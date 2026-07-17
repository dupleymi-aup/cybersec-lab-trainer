import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, generateToken, getClientIp } from '@/lib/api-middleware';
import { setAuthCookie } from '@/lib/cookie-auth';
import { impersonateSchema } from '@/lib/validations/api';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const admin = await authenticate(request);
    if (!admin) return unauthorized();

    if (admin.role !== 'admin') {
      return forbidden('Only administrators can use impersonation');
    }

    const body = await request.json();
    const parsed = impersonateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { targetUserId } = parsed.data;

    if (targetUserId === admin.id) {
      return NextResponse.json({ error: 'Cannot impersonate yourself' }, { status: 400 });
    }

    const targetUser = await getPrisma().user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent impersonating blocked users
    if (targetUser.isBlocked) {
      return NextResponse.json({ error: 'Cannot impersonate a blocked user' }, { status: 403 });
    }

    // Prevent admin impersonating another admin (privilege escalation concern)
    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Cannot impersonate another administrator' }, { status: 403 });
    }

    const token = await generateToken(targetUser.id, targetUser.role, {
      group: targetUser.group,
      fullName: targetUser.fullName,
      tokenVersion: targetUser.tokenVersion,
    });

    // Audit log the impersonation
    try {
      const adminUser = await getPrisma().user.findUnique({
        where: { id: admin.id },
      });
      const ip = getClientIp(request);
      await getPrisma().auditLog.create({
        data: {
          id: crypto.randomUUID(),
          adminId: admin.id,
          adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
          action: 'impersonation_start',
          targetId: targetUserId,
          targetName: targetUser.fullName || targetUser.email,
          details: `Admin ${adminUser?.fullName || adminUser?.email || admin.id} started impersonating user ${targetUserId} [IP: ${ip}]`,
        },
      });
    } catch (error) {
      logger.warn('Audit logging failed', { error });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        phone: targetUser.phone,
        fullName: targetUser.fullName,
        group: targetUser.group,
        course: targetUser.course,
        university: targetUser.university,
        avatar: targetUser.avatar,
        bio: targetUser.bio,
        role: targetUser.role,
        createdAt: targetUser.createdAt.toISOString(),
        lastLoginAt: targetUser.lastLoginAt?.toISOString(),
        loginCount: targetUser.loginCount,
        isBlocked: targetUser.isBlocked,
      },
    });

    // Set httpOnly cookie for impersonated session
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    logger.error('Impersonation failed', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
