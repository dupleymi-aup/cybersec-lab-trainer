import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, checkRateLimit, getClientIp } from '@/lib/api-middleware';
import { hashPassword, validatePassword } from '@/lib/auth-utils';

// POST /api/admin/users/[id]/reset-password - admin resets another user's password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireAdmin(auth)) return forbidden();

  // Rate limit: 10 password resets per minute per admin
  const rateLimit = checkRateLimit(`reset-pw:${auth.id}`, 10, 60_000);
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

  const body = await request.json();
  const { newPassword } = body;

  if (!newPassword) {
    return NextResponse.json({ error: 'New password is required' }, { status: 400 });
  }

  // Validate password strength
  const pwValidation = validatePassword(newPassword);
  if (!pwValidation.valid) {
    return NextResponse.json({ error: pwValidation.errors.join(', ') }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  // Audit log the password reset
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: 'password_reset',
        targetId: id,
        targetName: targetUser.fullName || targetUser.email,
        details: `Admin ${auth.id} reset password for user ${targetUser.email} [IP: ${ip}]`,
      },
    });
  } catch {
    // Audit logging is best-effort
  }

  return NextResponse.json({ success: true });
}

function requireAdmin(auth: { id: string; role: string }): boolean {
  return auth.role === 'admin';
}
