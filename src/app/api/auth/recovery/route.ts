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

  // Always return same message to prevent user enumeration
  const response = {
    success: true,
    message: 'Если пользователь найден, OTP отправлен на email',
  };

  if (!user) {
    return NextResponse.json(response);
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(user.id, { otp, expiresAt });

  // TODO: Send OTP via email in production
  // For development, OTP is stored server-side and shown in dev tools
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for ${user.email}: ${otp}`);
  }

  return NextResponse.json(response);
}
