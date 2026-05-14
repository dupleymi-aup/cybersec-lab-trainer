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

// Client-side token signing (not cryptographically secure but prevents casual forgery)
const TOKEN_SECRET = process.env.NEXT_PUBLIC_TOKEN_SECRET || 'cybersec-lab-token-secret-v1';

function signToken(payload: string): string {
  const hmac = btoa(payload + TOKEN_SECRET);
  return btoa(JSON.stringify({ p: payload, s: hmac }));
}

function verifyToken(token: string): string | null {
  try {
    const decoded = JSON.parse(atob(token));
    const expected = btoa(decoded.p + TOKEN_SECRET);
    if (decoded.s !== expected) return null;
    return decoded.p;
  } catch {
    return null;
  }
}

export function generateToken(userId: string, role: string, rememberMe?: boolean): string {
  const expiry = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({
    id: userId,
    role,
    exp: Date.now() + expiry,
  });
  return signToken(payload);
}

export function validateToken(token: string | null): { valid: boolean; payload?: { id: string; role: string } } {
  if (!token) return { valid: false };
  const payload = verifyToken(token);
  if (!payload) return { valid: false };
  try {
    const data = JSON.parse(payload);
    if (data.exp < Date.now()) return { valid: false };
    return { valid: true, payload: { id: data.id, role: data.role } };
  } catch {
    return { valid: false };
  }
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
