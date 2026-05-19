import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateToken, checkRateLimit } from '@/lib/api-middleware';
import { verifyPassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailOrPhone, password, rememberMe } = body;

    if (!emailOrPhone || !password) {
      return NextResponse.json({ error: 'Email/phone and password required' }, { status: 400 });
    }

    // Rate limiting: 5 attempts per 30 seconds per identifier
    const rateKey = `login-${emailOrPhone}`;
    const rateResult = checkRateLimit(rateKey, 5, 30_000);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много попыток. Подождите', retryAfter: rateResult.retryAfter },
        { status: 429 }
      );
    }

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { phone: emailOrPhone },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: 'Аккаунт заблокирован' }, { status: 403 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    // Update login stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: user.loginCount + 1,
      },
    });

    // Log login activity
    await prisma.loginActivity.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        email: user.email,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        success: true,
      },
    });

    const token = generateToken(user.id, user.role, rememberMe);

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
        loginCount: user.loginCount + 1,
        isBlocked: user.isBlocked,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
