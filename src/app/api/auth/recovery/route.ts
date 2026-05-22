import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOTP } from '@/lib/auth-utils';
import { otpStore, ensureOtpCapacity } from '@/lib/otp-store';
import { sendOTPRecoveryEmail } from '@/lib/email';

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
  ensureOtpCapacity();
  otpStore.set(user.id, { otp, expiresAt });

  const emailSent = await sendOTPRecoveryEmail(user.email, user.fullName || user.email, otp);
  if (!emailSent && process.env.NODE_ENV === 'development') {
    console.warn(`[DEV] OTP for ${user.email}: ${otp} (SMTP not configured)`);
  }

  return NextResponse.json(response);
}
