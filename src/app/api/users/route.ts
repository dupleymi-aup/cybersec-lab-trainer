import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { hashPassword } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, phone: true, fullName: true,
      group: true, course: true, university: true, avatar: true,
      bio: true, role: true, createdAt: true, lastLoginAt: true,
      loginCount: true, isBlocked: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    users: users.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  const body = await request.json();
  const { email, phone, fullName, role, password, group, course, university, bio, avatar } = body;

  if (!email || !phone || !fullName || !password) {
    return NextResponse.json({ error: 'Email, phone, name, and password required' }, { status: 400 });
  }

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
      role: role || 'student',
      passwordHash,
      group: group || '',
      course: course || '',
      university: university || '',
      bio: bio || '',
      avatar: avatar || '',
    },
  });

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
