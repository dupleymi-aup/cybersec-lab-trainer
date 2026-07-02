import { describe, it, expect } from 'vitest';
import {
  generateOTP,
  validateEmail,
  validatePhone,
  validatePassword,
  generateUserId,
  hashPassword,
  verifyPassword,
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

describe('hashPassword / verifyPassword', () => {
  it('should hash a password and verify it correctly', async () => {
    const password = 'TestPass@123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2b$') || hash.startsWith('$2a$')).toBe(true);

    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);

    const invalid = await verifyPassword('WrongPass@456', hash);
    expect(invalid).toBe(false);
  });

  it('should produce different hashes for the same password', async () => {
    const password = 'SamePass@789';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
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
