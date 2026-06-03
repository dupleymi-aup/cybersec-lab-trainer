import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { otpStore } from '@/lib/otp-store';
import { checkRateLimit } from '@/lib/api-middleware';
import { timingSafeEqual } from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { emailOrPhone, otp } = body;

  if (!emailOrPhone || !otp) {
    return NextResponse.json({ error: 'Email/phone and OTP required' }, { status: 400 });
  }

  // Find user to get the OTP store key
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
    select: { id: true },
  });

  // Rate limiting: 5 attempts per 10 minutes per user
  // Use emailOrPhone as rate key even before finding user, to avoid timing-based enumeration
  const rateKey = `otp-verify-${emailOrPhone}`;
  const rateResult = checkRateLimit(rateKey, 5, 10 * 60 * 1000);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Подождите', retryAfter: rateResult.retryAfter },
      { status: 429 }
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
  const isValid = entry.otp.length === otp.length &&
    timingSafeEqual(
      Buffer.from(entry.otp),
      Buffer.from(otp)
    );

  if (!isValid) {
    return genericError;
  }

  otpStore.delete(user.id);
  return NextResponse.json({ success: true });
}
