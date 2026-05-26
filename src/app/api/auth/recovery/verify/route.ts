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

  if (!user) {
    return NextResponse.json({ error: 'Неверный OTP' }, { status: 400 });
  }

  // Rate limiting: 5 attempts per 10 minutes per user
  const rateKey = `otp-verify-${user.id}`;
  const rateResult = checkRateLimit(rateKey, 5, 10 * 60 * 1000);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Подождите', retryAfter: rateResult.retryAfter },
      { status: 429 }
    );
  }

  const entry = otpStore.get(user.id);
  if (!entry) {
    return NextResponse.json({ error: 'OTP not found or expired' }, { status: 400 });
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(user.id);
    return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
  }

  // Use timing-safe comparison to prevent timing attacks
  const isValid = entry.otp.length === otp.length &&
    timingSafeEqual(
      Buffer.from(entry.otp),
      Buffer.from(otp)
    );

  if (!isValid) {
    return NextResponse.json({ error: 'Неверный OTP' }, { status: 400 });
  }

  otpStore.delete(user.id);
  return NextResponse.json({ success: true });
}
