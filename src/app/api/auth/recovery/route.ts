import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOTP } from '@/lib/auth-utils';
import { otpStore } from '@/lib/otp-store';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { emailOrPhone } = body;

  if (!emailOrPhone) {
    return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
  });

  if (!user) {
    return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(user.id, { otp, expiresAt });

  return NextResponse.json({
    success: true,
    message: 'OTP sent',
    userId: user.id,
    otp,
  });
}
