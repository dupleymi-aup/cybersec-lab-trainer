import bcrypt from 'bcryptjs';

export function generateUserId(): string {
  return 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^\+?\d{10,15}$/.test(cleaned);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Минимум 8 символов');
  if (!/[a-z]/.test(password)) errors.push('Хотя бы одна строчная буква');
  if (!/[A-Z]/.test(password)) errors.push('Хотя бы одна заглавная буква');
  if (!/[0-9]/.test(password)) errors.push('Хотя бы одна цифра');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Хотя бы один спецсимвол');
  return { valid: errors.length === 0, errors };
}
