import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/otp-store';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, otp } = body;

  if (!userId || !otp) {
    return NextResponse.json({ error: 'User ID and OTP required' }, { status: 400 });
  }

  const entry = otpStore.get(userId);
  if (!entry) {
    return NextResponse.json({ error: 'OTP not found or expired' }, { status: 400 });
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(userId);
    return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
  }

  if (entry.otp !== otp) {
    return NextResponse.json({ error: 'Неверный OTP' }, { status: 400 });
  }

  otpStore.delete(userId);
  return NextResponse.json({ success: true });
}
