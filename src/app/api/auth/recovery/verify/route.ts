import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { otpStore } from '@/lib/otp-store';
import { checkRateLimit } from '@/lib/api-middleware';
import { timingSafeEqual } from 'crypto';
import { parseBody } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface OtpVerifyBody {
  emailOrPhone: string;
  otp: string;
}

export async function POST(request: NextRequest) {
  try {
    const bodyResult = await parseBody<OtpVerifyBody>(request);
    if (!bodyResult.ok) return bodyResult.response;
    const { emailOrPhone, otp } = bodyResult.data;

    if (!emailOrPhone || !otp) {
      return NextResponse.json({ error: 'Email/phone and OTP required' }, { status: 400 });
    }

    // Find user to get the OTP store key
    const user = await getPrisma().user.findFirst({
      where: { OR: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
      select: { id: true },
    });

    // Rate limiting: 5 attempts per 10 minutes per user
    // Use emailOrPhone as rate key even before finding user, to avoid timing-based enumeration
    const rateKey = `otp-verify-${emailOrPhone}`;
    const rateResult = checkRateLimit(rateKey, 5, 10 * 60 * 1000);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many attempts. Please wait',
          retryAfter: rateResult.retryAfter,
        },
        { status: 429 },
      );
    }

    const genericError = NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });

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
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('OTP verify error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
