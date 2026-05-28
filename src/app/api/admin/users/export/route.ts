import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole, checkRateLimit, getClientIp } from '@/lib/api-middleware';

interface ExportRequestBody {
  role?: string;
  group?: string;
  university?: string;
  course?: string;
  ids?: string[];
}

function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  // Prevent CSV formula injection: fields starting with =, +, -, @, tab, or CR can execute formulas
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  const needsPrefixEscape = dangerousPrefixes.some(prefix => str.startsWith(prefix));
  if (needsPrefixEscape || str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// POST /api/admin/users/export - export users as CSV
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 10 exports per minute per admin
  const rateLimit = checkRateLimit(`export:${auth.id}`, 10, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  let body: ExportRequestBody;
  try {
    body = await request.json();
  } catch (e) {
    console.error("[api] POST failed:", e);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { role, group, university, course, ids } = body;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (ids && Array.isArray(ids) && ids.length > 0) {
    where.id = { in: ids };
  } else {
    if (role) where.role = role;
    if (group) where.group = { contains: group, mode: 'insensitive' as const };
    if (university) where.university = { contains: university, mode: 'insensitive' as const };
    if (course) where.course = { contains: course, mode: 'insensitive' as const };
  }

  // Fetch users
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      group: true,
      course: true,
      university: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      loginCount: true,
      isBlocked: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // CSV headers
  const headers = [
    'id',
    'email',
    'phone',
    'fullName',
    'group',
    'course',
    'university',
    'role',
    'createdAt',
    'lastLoginAt',
    'loginCount',
    'isBlocked',
  ];

  // Build CSV rows
  const rows = [
    headers.join(','),
    ...users.map((u) =>
      [
        escapeCsvField(u.id),
        escapeCsvField(u.email),
        escapeCsvField(u.phone),
        escapeCsvField(u.fullName),
        escapeCsvField(u.group),
        escapeCsvField(u.course),
        escapeCsvField(u.university),
        escapeCsvField(u.role),
        escapeCsvField(u.createdAt.toISOString()),
        escapeCsvField(u.lastLoginAt?.toISOString() ?? ''),
        escapeCsvField(u.loginCount),
        escapeCsvField(u.isBlocked),
      ].join(',')
    ),
  ];

  const csvContent = rows.join('\n');

  // Generate filename with current date
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = `users-export-${dateStr}.csv`;

  // Audit log the export action (best-effort)
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: 'users_export',
        targetId: auth.id,
        targetName: `${users.length} users`,
        details: `Admin ${auth.id} exported ${users.length} users as CSV [IP: ${ip}]`,
      },
    });
  } catch (error) {
    // Audit logging is best-effort
    if (process.env.NODE_ENV === 'development') {
      console.warn('Audit logging failed:', error);
    }
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
