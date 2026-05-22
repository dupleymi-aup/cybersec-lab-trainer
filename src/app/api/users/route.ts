import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole, checkRateLimit, getClientIp } from '@/lib/api-middleware';
import { hashPassword } from '@/lib/auth-utils';
import { createUserSchema } from '@/lib/validations/api';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const isAdmin = auth.role === 'admin';
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * Math.min(limit, 100);

  // Filters
  const role = searchParams.get('role') || undefined;
  const search = searchParams.get('search') || undefined;
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const isBlocked = searchParams.get('isBlocked');

  const where: Record<string, unknown> = {};
  if (role && ['student', 'teacher', 'admin'].includes(role)) {
    where.role = role;
  }
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search, mode: 'insensitive' as const } },
      { group: { contains: search, mode: 'insensitive' as const } },
    ];
  }
  if (isBlocked !== undefined && isAdmin) {
    where.isBlocked = isBlocked === 'true';
  }

  const validSortFields = ['createdAt', 'fullName', 'email', 'role', 'lastLoginAt', 'loginCount'] as const;
  const sortField = (validSortFields.includes(sortBy as typeof validSortFields[number]) ? sortBy : 'createdAt') as typeof validSortFields[number];
  const order = sortOrder === 'asc' ? 'asc' : 'desc';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, phone: true, fullName: true,
        group: true, course: true, university: true, avatar: true,
        bio: true, role: true, createdAt: true, lastLoginAt: true,
        ...(isAdmin && { loginCount: true, isBlocked: true }),
      },
      orderBy: { [sortField]: order },
      skip,
      take: Math.min(limit, 100),
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString(),
    })),
    pagination: {
      page,
      limit: Math.min(limit, 100),
      total,
      totalPages: Math.ceil(total / Math.min(limit, 100)),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 10 user creations per minute per admin
  const rateLimit = checkRateLimit(`create-user:${auth.id}`, 10, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email, phone, fullName, role, password, group, course, university, bio, avatar } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) {
    return NextResponse.json({ error: 'Пользователь уже существует' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email, phone, fullName,
      role: role ?? 'student',
      passwordHash,
      group: group || '',
      course: course || '',
      university: university || '',
      bio: bio || '',
      avatar: avatar || '',
    },
  });

  // Audit log the user creation
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: 'user_created',
        targetId: user.id,
        targetName: user.fullName || user.email,
        details: `Admin ${auth.id} created user ${user.email} (role: ${user.role}) [IP: ${ip}]`,
      },
    });
  } catch {
    // Audit logging is best-effort
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      group: user.group,
      course: user.course,
      university: user.university,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      loginCount: user.loginCount,
      isBlocked: user.isBlocked,
    },
  });
}
