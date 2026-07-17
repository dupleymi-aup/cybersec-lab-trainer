import bcrypt from 'bcryptjs';

export function generateUserId(): string {
  return crypto.randomUUID();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateOTP(): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  // Map to 6-digit range [100000, 999999]
  const num = ((array[0] << 24) | (array[1] << 16) | (array[2] << 8) | array[3]) >>> 0;
  return (100000 + (num % 900000)).toString();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+[.][^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-()]/g, '');
  return /^\+?\d{10,15}$/.test(cleaned);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Minimum 8 characters');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one digit');
  if (!/[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]/.test(password)) errors.push('At least one special character');
  return { valid: errors.length === 0, errors };
}
