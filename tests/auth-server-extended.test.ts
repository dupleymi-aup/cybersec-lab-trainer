// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    tokenSecret: 'test-secret-key-for-jwt-signing-1234567890',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { generateToken, verifyToken, signJwt, getTokenPayload, authenticate } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

describe('auth-server extended', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signJwt', () => {
    it('should produce a valid token', async () => {
      const token = await signJwt({ id: 'u1', role: 'student' });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include group and fullName in payload', async () => {
      const token = await signJwt({ id: 'u1', role: 'teacher', group: 'CS-101', fullName: 'John' });
      const payload = await verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.id).toBe('u1');
      expect(payload?.role).toBe('teacher');
      expect(payload?.group).toBe('CS-101');
      expect(payload?.fullName).toBe('John');
    });
  });

  describe('generateToken', () => {
    it('should create a 7-day token by default', async () => {
      const token = await generateToken('user1', 'admin');
      const payload = await verifyToken(token);
      expect(payload?.id).toBe('user1');
      expect(payload?.role).toBe('admin');
    });

    it('should create a 30-day token with rememberMe', async () => {
      const token = await generateToken('user1', 'student', { rememberMe: true });
      const payload = await verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.id).toBe('user1');
    });

    it('should include all optional fields', async () => {
      const token = await generateToken('u2', 'teacher', {
        group: 'G1',
        fullName: 'Test User',
        tokenVersion: 3,
      });
      const payload = await verifyToken(token);
      expect(payload?.group).toBe('G1');
      expect(payload?.fullName).toBe('Test User');
      expect(payload?.tokenVersion).toBe(3);
    });
  });

  describe('getTokenPayload', () => {
    it('should return null for null token', async () => {
      const result = await getTokenPayload(null);
      expect(result).toBeNull();
    });

    it('should return null for invalid token', async () => {
      const result = await getTokenPayload('invalid.token.here');
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return payload for valid token', async () => {
      const token = await generateToken('u3', 'student');
      const payload = await getTokenPayload(token);
      expect(payload?.id).toBe('u3');
      expect(payload?.role).toBe('student');
      expect(payload?.exp).toBeGreaterThan(0);
    });
  });

  describe('authenticate', () => {
    it('should return null for null token', async () => {
      const result = await authenticate(null);
      expect(result).toBeNull();
    });

    it('should return null for invalid token', async () => {
      const result = await authenticate('bad-token');
      expect(result).toBeNull();
    });

    it('should return {id, role} for valid token', async () => {
      const token = await generateToken('u4', 'admin');
      const result = await authenticate(token);
      expect(result).toEqual({ id: 'u4', role: 'admin' });
    });
  });

  describe('verifyToken edge cases', () => {
    it('should return null when payload lacks id', async () => {
      const { SignJWT } = await import('jose');
      const secret = new TextEncoder().encode('test-secret-key-for-jwt-signing-1234567890');
      const token = await new SignJWT({ role: 'student', exp: 9999999999 })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret);
      const result = await verifyToken(token);
      expect(result).toBeNull();
    });

    it('should return null when payload lacks role', async () => {
      const { SignJWT } = await import('jose');
      const secret = new TextEncoder().encode('test-secret-key-for-jwt-signing-1234567890');
      const token = await new SignJWT({ id: 'u5', exp: 9999999999 })
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret);
      const result = await verifyToken(token);
      expect(result).toBeNull();
    });
  });
});
