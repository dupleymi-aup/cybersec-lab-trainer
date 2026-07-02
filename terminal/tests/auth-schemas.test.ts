import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  passwordChangeSchema,
  createUserSchema,
  roleChangeSchema,
  blockUserSchema,
} from '@/lib/validations/api';

describe('loginSchema', () => {
  it('should accept valid login data', () => {
    const result = loginSchema.safeParse({
      emailOrPhone: 'test@example.com',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing emailOrPhone', () => {
    const result = loginSchema.safeParse({ password: 'SecurePass123!' });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = loginSchema.safeParse({
      emailOrPhone: 'test@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('should accept rememberMe flag', () => {
    const result = loginSchema.safeParse({
      emailOrPhone: 'test@example.com',
      password: 'SecurePass123!',
      rememberMe: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'student@example.com',
      phone: '+79001234567',
      fullName: 'Ivan Petrov',
      role: 'student',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      phone: '+79001234567',
      fullName: 'Ivan Petrov',
      role: 'student',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short name', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      phone: '+79001234567',
      fullName: 'I',
      role: 'student',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid role', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      phone: '+79001234567',
      fullName: 'Ivan Petrov',
      role: 'superadmin',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(false);
  });
});

describe('passwordChangeSchema', () => {
  it('should accept valid password change', () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass456!',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing current password', () => {
    const result = passwordChangeSchema.safeParse({
      newPassword: 'NewPass456!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short new password', () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: 'OldPass123!',
      newPassword: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('createUserSchema', () => {
  it('should accept valid user creation', () => {
    const result = createUserSchema.safeParse({
      email: 'newuser@example.com',
      phone: '+79001234567',
      fullName: 'New User',
      password: 'SecurePass123!',
      role: 'student',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional fields', () => {
    const result = createUserSchema.safeParse({
      email: 'newuser@example.com',
      phone: '+79001234567',
      fullName: 'New User',
      password: 'SecurePass123!',
      group: 'Group-A',
      course: '09.03.04',
      university: 'MAI',
    });
    expect(result.success).toBe(true);
  });
});

describe('roleChangeSchema', () => {
  it('should accept valid role change', () => {
    const result = roleChangeSchema.safeParse({ role: 'teacher' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid role', () => {
    const result = roleChangeSchema.safeParse({ role: 'moderator' });
    expect(result.success).toBe(false);
  });
});

describe('blockUserSchema', () => {
  it('should accept block true', () => {
    const result = blockUserSchema.safeParse({ isBlocked: true });
    expect(result.success).toBe(true);
  });

  it('should accept block false', () => {
    const result = blockUserSchema.safeParse({ isBlocked: false });
    expect(result.success).toBe(true);
  });

  it('should reject missing isBlocked', () => {
    const result = blockUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
