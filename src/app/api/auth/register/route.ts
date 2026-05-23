import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateToken, checkRateLimit, getClientIp } from '@/lib/api-middleware';
import { hashPassword } from '@/lib/auth-utils';
import { ADMIN_INVITE_CODE } from '@/lib/auth-store';
import { registerSchema } from '@/lib/validations/api';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 registrations per hour per IP
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`register-${ip}`, 3, 3600_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Слишком много попыток регистрации. Подождите', retryAfter: rateLimit.retryAfter },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { email, phone, fullName, role, inviteCode, password } = parsed.data;

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      return NextResponse.json({ error: 'Пользователь с таким email или телефоном уже существует' }, { status: 409 });
    }

    // Check invite code for admin/teacher
    if (role === 'admin' || role === 'teacher') {
      if (!ADMIN_INVITE_CODE) {
        return NextResponse.json({ error: 'Регистрация с этой ролью отключена' }, { status: 403 });
      }
      if (!inviteCode || inviteCode.toUpperCase() !== ADMIN_INVITE_CODE) {
        return NextResponse.json({ error: 'Неверный код приглашения' }, { status: 403 });
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        phone,
        fullName,
        role,
        passwordHash,
        lastLoginAt: new Date(),
        loginCount: 1,
      },
    });

    const token = generateToken(user.id, user.role, { group: user.group, fullName: user.fullName });

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
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
