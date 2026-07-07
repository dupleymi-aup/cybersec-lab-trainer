import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { hashPassword, validatePassword } from '@/lib/auth-utils';
import { otpStore } from '@/lib/otp-store';
import { checkRateLimit } from '@/lib/api-middleware';
import { timingSafeEqual } from 'crypto';
import { parseBody } from '@/lib/utils';

interface PasswordResetBody {
  emailOrPhone: string;
  newPassword: string;
  otp: string;
}

export async function POST(request: NextRequest) {
  const bodyResult = await parseBody<PasswordResetBody>(request);
  if (!bodyResult.ok) return bodyResult.response;
  const { emailOrPhone, newPassword, otp } = bodyResult.data;

  if (!emailOrPhone || !newPassword || !otp) {
    return NextResponse.json({ error: 'Email/phone, OTP and new password required' }, { status: 400 });
  }

  // Validate password strength
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return NextResponse.json(
      {
        error: 'Пароль не соответствует требованиям',
        details: passwordValidation.errors,
      },
      { status: 400 },
    );
  }

  // Find user to get the OTP store key
  const user = await getPrisma().user.findFirst({
    where: { OR: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
    select: { id: true },
  });

  // Rate limiting: 5 attempts per 10 minutes per user
  // Use emailOrPhone as rate key even before finding user, to avoid timing-based enumeration
  const rateKey = `otp-reset-${emailOrPhone}`;
  const rateResult = checkRateLimit(rateKey, 5, 10 * 60 * 1000);
  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        error: 'Слишком много попыток. Подождите',
        retryAfter: rateResult.retryAfter,
      },
      { status: 429 },
    );
  }

  const genericError = NextResponse.json({ error: 'Неверный или просроченный OTP' }, { status: 400 });

  if (!user) {
    return genericError;
  }

  const entry = otpStore.get(user.id);
  if (!entry || Date.now() > entry.expiresAt) {
    if (entry) otpStore.delete(user.id);
    return genericError;
  }

  // Use timing-safe comparison to prevent timing attacks
  const isValid = entry.otp.length === otp.length && timingSafeEqual(Buffer.from(entry.otp), Buffer.from(otp));

  if (!isValid) {
    return genericError;
  }

  otpStore.delete(user.id);

  const hash = await hashPassword(newPassword);
  await getPrisma().user.update({
    where: { id: user.id },
    data: {
      passwordHash: hash,
      tokenVersion: { increment: 1 }, // Revoke all existing tokens
    },
  });

  return NextResponse.json({ success: true });
}
