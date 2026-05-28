import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, generateToken, getClientIp } from '@/lib/api-middleware';

export async function POST(request: NextRequest) {
  try {
    const admin = await authenticate(request);
    if (!admin) return unauthorized();

    if (admin.role !== 'admin') {
      return forbidden('Только администраторы могут использовать имперсонацию');
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    if (targetUserId === admin.id) {
      return NextResponse.json({ error: 'Нельзя войти как себя' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Prevent impersonating blocked users
    if (targetUser.isBlocked) {
      return NextResponse.json({ error: 'Нельзя войти как заблокированный пользователь' }, { status: 403 });
    }

    // Prevent admin impersonating another admin (privilege escalation concern)
    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Нельзя войти как другой администратор' }, { status: 403 });
    }

    const token = generateToken(targetUser.id, targetUser.role, {
      group: targetUser.group,
      fullName: targetUser.fullName,
      tokenVersion: targetUser.tokenVersion,
    });

    // Audit log the impersonation
    try {
      const adminUser = await prisma.user.findUnique({ where: { id: admin.id } });
      const ip = getClientIp(request);
      await prisma.auditLog.create({
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
      // Audit logging is best-effort
      if (process.env.NODE_ENV === 'development') {
        console.warn('Audit logging failed:', error);
      }
    }

    return NextResponse.json({
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
      token,
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
