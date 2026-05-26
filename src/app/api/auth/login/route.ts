import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateToken, checkRateLimit, getClientIp } from '@/lib/api-middleware';
import { verifyPassword } from '@/lib/auth-utils';
import { loginSchema } from '@/lib/validations/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { emailOrPhone, password, rememberMe } = parsed.data;

    // Rate limiting: 5 attempts per 30 seconds per identifier
    const rateKey = `login-${emailOrPhone}`;
    const rateResult = checkRateLimit(rateKey, 5, 30_000);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много попыток. Подождите', retryAfter: rateResult.retryAfter },
        { status: 429 }
      );
    }

    const logActivity = async (data: { userId?: string; email: string; ip: string; userAgent: string; success: boolean }) => {
      await prisma.loginActivity.create({
        data: { id: crypto.randomUUID(), ...data },
      });
    };

    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';

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
      await logActivity({ email: emailOrPhone, ip, userAgent, success: false });
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    if (user.isBlocked) {
      await logActivity({ userId: user.id, email: user.email, ip, userAgent, success: false });
      return NextResponse.json({ error: 'Аккаунт заблокирован' }, { status: 403 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await logActivity({ userId: user.id, email: user.email, ip, userAgent, success: false });
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
    await logActivity({ userId: user.id, email: user.email, ip, userAgent, success: true });

    const token = generateToken(user.id, user.role, { rememberMe, group: user.group, fullName: user.fullName });

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
