export const otpStore = new Map<string, { otp: string; expiresAt: number }>();
const MAX_OTP_ENTRIES = 1000;

/** Clean expired OTPs from the store. Call this before adding new entries. */
export function cleanExpiredOtps(): void {
  const now = Date.now();
  for (const [key, entry] of otpStore.entries()) {
    if (now > entry.expiresAt) {
      otpStore.delete(key);
    }
  }
}

/** Check store size and clean if approaching limit */
export function ensureOtpCapacity(): void {
  if (otpStore.size >= MAX_OTP_ENTRIES) {
    cleanExpiredOtps();
  }
  // If still full, evict oldest
  if (otpStore.size >= MAX_OTP_ENTRIES) {
    const firstKey = otpStore.keys().next().value;
    if (firstKey) otpStore.delete(firstKey);
  }
}
