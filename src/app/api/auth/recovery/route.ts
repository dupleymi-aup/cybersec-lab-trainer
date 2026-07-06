import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOTP } from "@/lib/auth-utils";
import { otpStore, ensureOtpCapacity } from "@/lib/otp-store";
import { sendOTPRecoveryEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/api-middleware";
import { recoveryRequestEmailPhoneSchema } from "@/lib/validations/api";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = recoveryRequestEmailPhoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { emailOrPhone } = parsed.data;

  // Rate limit: 3 OTP requests per 10 minutes per email/phone to prevent email flooding
  const rateKey = `otp-request-${emailOrPhone.toLowerCase()}`;
  const rateResult = checkRateLimit(rateKey, 3, 10 * 60 * 1000);
  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        error: "Слишком много запросов. Подождите",
        retryAfter: rateResult.retryAfter,
      },
      { status: 429 },
    );
  }

  // Also rate limit by IP to prevent distributed attacks
  const ipRateKey = `otp-request-ip-${getClientIp(request)}`;
  const ipRateResult = checkRateLimit(ipRateKey, 10, 10 * 60 * 1000);
  if (!ipRateResult.allowed) {
    return NextResponse.json(
      {
        error: "Слишком много запросов. Подождите",
        retryAfter: ipRateResult.retryAfter,
      },
      { status: 429 },
    );
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
  });

  // Always return same message to prevent user enumeration
  const response = {
    success: true,
    message: "Если пользователь найден, OTP отправлен на email",
  };

  if (!user) {
    return NextResponse.json(response);
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  ensureOtpCapacity();
  otpStore.set(user.id, { otp, expiresAt });

  const emailSent = await sendOTPRecoveryEmail(
    user.email,
    user.fullName || user.email,
    otp,
  );
  if (!emailSent) {
    // In development, check console for email delivery issues
    // OTP is still stored in memory for verification
  }

  return NextResponse.json(response);
}
