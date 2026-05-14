import { describe, it, expect } from 'vitest';
import {
  generateOTP,
  validateEmail,
  validatePhone,
  validatePassword,
  validateToken,
  generateToken,
  generateUserId,
} from '@/lib/auth-utils';

describe('generateOTP', () => {
  it('should generate a 6-digit string', () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should generate different OTPs on subsequent calls', () => {
    const otp1 = generateOTP();
    const otp2 = generateOTP();
    // They could theoretically be the same, but it's extremely unlikely
    expect(otp1 === otp2).toBe(false);
  });
});

describe('validateEmail', () => {
  it('should accept valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.org')).toBe(true);
    expect(validateEmail('admin@cybersec.lab')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('test')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('test domain.com')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('should accept valid phone numbers', () => {
    expect(validatePhone('+79991234567')).toBe(true);
    expect(validatePhone('+123456789012')).toBe(true);
    expect(validatePhone('89991234567')).toBe(true);
    expect(validatePhone('+7 (999) 123-45-67')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(validatePhone('')).toBe(false);
    expect(validatePhone('123')).toBe(false);
    expect(validatePhone('abcdefghijk')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should accept strong passwords', () => {
    const result = validatePassword('Admin@123');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject short passwords', () => {
    const result = validatePassword('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Минимум 8 символов');
  });

  it('should reject passwords without uppercase', () => {
    const result = validatePassword('password@123');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('заглавная'))).toBe(true);
  });

  it('should reject passwords without lowercase', () => {
    const result = validatePassword('PASSWORD@123');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('строчная'))).toBe(true);
  });

  it('should reject passwords without digits', () => {
    const result = validatePassword('Password@abc');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('цифра'))).toBe(true);
  });

  it('should reject passwords without special chars', () => {
    const result = validatePassword('Password123');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('спецсимвол'))).toBe(true);
  });

  it('should return all applicable errors', () => {
    const result = validatePassword('123');
    expect(result.errors.length).toBeGreaterThan(2);
  });
});

describe('generateToken & validateToken', () => {
  it('should generate a valid token', () => {
    const token = generateToken('usr_123', 'admin');
    const result = validateToken(token);
    expect(result.valid).toBe(true);
    expect(result.payload?.id).toBe('usr_123');
    expect(result.payload?.role).toBe('admin');
  });

  it('should reject null token', () => {
    expect(validateToken(null).valid).toBe(false);
  });

  it('should reject tampered token', () => {
    const token = generateToken('usr_123', 'admin');
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(validateToken(tampered).valid).toBe(false);
  });

  it('should reject random string as token', () => {
    expect(validateToken('random-garbage-string').valid).toBe(false);
  });
});

describe('generateUserId', () => {
  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateUserId());
    }
    expect(ids.size).toBe(100);
  });
});
