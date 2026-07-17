import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { generateOTP } from '@/lib/auth-utils';
import { otpStore, ensureOtpCapacity } from '@/lib/otp-store';
import { sendOTPRecoveryEmail } from '@/lib/email';
import { checkRateLimit, getClientIp } from '@/lib/api-middleware';
import { recoveryRequestEmailPhoneSchema } from '@/lib/validations/api';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const parsed = recoveryRequestEmailPhoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { emailOrPhone } = parsed.data;

  // Rate limit: 3 OTP requests per 10 minutes per email/phone to prevent email flooding
  const rateKey = `otp-request-${emailOrPhone.toLowerCase()}`;
  const rateResult = checkRateLimit(rateKey, 3, 10 * 60 * 1000);
  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please wait',
        retryAfter: rateResult.retryAfter,
      },
      { status: 429 },
    );
  }

  // Also rate limit by IP to prevent distributed attacks
  const ip = getClientIp(request);
  const ipRateKey = `otp-request-ip-${ip}`;
  const ipRateResult = checkRateLimit(ipRateKey, 10, 10 * 60 * 1000);
  if (!ipRateResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please wait',
        retryAfter: ipRateResult.retryAfter,
      },
      { status: 429 },
    );
  }

  const user = await getPrisma().user.findFirst({
    where: { OR: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
  });

  // Always return same generic response to prevent user enumeration
  const genericResponse = {
    success: true,
    message: 'If the user exists, an OTP has been sent to their email',
  };

  if (!user) {
    return NextResponse.json(genericResponse);
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  ensureOtpCapacity();
  otpStore.set(user.id, { otp, expiresAt });

  const emailSent = await sendOTPRecoveryEmail(user.email, user.fullName || user.email, otp);
  if (!emailSent) {
    logger.warn('OTP email delivery failed', {
      userId: user.id,
      email: user.email,
      ip,
    });
  }

  // In development, log OTP so developers can test without email delivery
  if (process.env.NODE_ENV === 'development') {
    logger.info('Development OTP', {
      userId: user.id,
      email: user.email,
      otp,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  }

  return NextResponse.json(genericResponse);
}
