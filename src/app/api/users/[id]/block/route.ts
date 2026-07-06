import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole, checkRateLimit, getClientIp } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';
import { validateUuid } from '@/lib/validate-uuid';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 20 block/unblock actions per minute per admin
  const rateLimit = checkRateLimit(`block:${auth.id}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
  }

  const { id } = await params;

  // Validate UUID format
  if (!validateUuid(id)) {
    return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
  }

  // Prevent self-block
  if (id === auth.id) {
    return NextResponse.json({ error: 'Нельзя заблокировать себя' }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { isBlocked } = body;

  if (typeof isBlocked !== 'boolean') {
    return NextResponse.json({ error: 'isBlocked must be boolean' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      isBlocked,
      tokenVersion: { increment: 1 }, // Revoke all existing tokens
    },
  });

  // Audit log the block/unblock
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: isBlocked ? 'user_blocked' : 'user_unblocked',
        targetId: id,
        targetName: user.fullName || user.email,
        details: `Admin ${auth.id} ${isBlocked ? 'blocked' : 'unblocked'} user ${user.email} [IP: ${ip}]`,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Audit logging failed', { error });
    }
  }

  return NextResponse.json({
    success: true,
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
    },
  });
}
