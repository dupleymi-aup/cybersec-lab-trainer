import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, generateToken } from '@/lib/api-middleware';

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

    if (targetUserId === admin.id) {
      return NextResponse.json({ error: 'Нельзя войти как себя' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const token = generateToken(targetUser.id, targetUser.role);

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
