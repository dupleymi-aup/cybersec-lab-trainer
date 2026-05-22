import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole, checkRateLimit, getClientIp } from '@/lib/api-middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 20 role changes per minute per admin
  const rateLimit = checkRateLimit(`role:${auth.id}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  const { id } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
  }

  // Prevent self-role-change
  if (id === auth.id) {
    return NextResponse.json({ error: 'Нельзя изменить свою роль' }, { status: 403 });
  }

  const body = await request.json();
  const { role } = body;

  if (!role || !['student', 'teacher', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });

  // Audit log the role change
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: 'role_change',
        targetId: id,
        targetName: user.fullName || user.email,
        details: `Admin ${auth.id} changed role to '${role}' for user ${user.email} [IP: ${ip}]`,
      },
    });
  } catch {
    // Audit logging is best-effort
  }

  return NextResponse.json({
    success: true,
    user: { ...user, createdAt: user.createdAt.toISOString(), lastLoginAt: user.lastLoginAt?.toISOString() },
  });
}
