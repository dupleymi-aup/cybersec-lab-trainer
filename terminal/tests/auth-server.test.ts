import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCalls } = vi.hoisted(() => {
  const calls: Array<{ payload: unknown }> = [];
  return { mockCalls: calls };
});

vi.mock('jose', () => {
  let instance: Record<string, ReturnType<typeof vi.fn>>;
  const MockSignJWT = class MockSignJWT {
    constructor(payload: unknown) {
      mockCalls.push({ payload });
      instance = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue('mock-jwt-token'),
      };
      Object.assign(this, instance);
    }
  };
  return {
    SignJWT: MockSignJWT as unknown as typeof import('jose').SignJWT,
    jwtVerify: vi.fn().mockRejectedValue(new Error('not mocked')),
  };
});

import { verifyToken, generateToken, getTokenPayload, authenticate, signJwt } from '@/lib/auth-server';

describe('auth-server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalls.length = 0;
  });

  describe('generateToken', () => {
    it('should generate a JWT with basic payload', async () => {
      const token = await generateToken('user-1', 'student');
      expect(token).toBe('mock-jwt-token');
      expect(mockCalls[0].payload).toMatchObject({ id: 'user-1', role: 'student' });
    });

    it('should support rememberMe extended expiry', async () => {
      const token = await generateToken('user-1', 'student', { rememberMe: true });
      expect(token).toBe('mock-jwt-token');
    });

    it('should include optional fields in token payload', async () => {
      await generateToken('user-1', 'teacher', {
        group: 'GR-101',
        fullName: 'Иван Иванов',
        tokenVersion: 2,
      });
      expect(mockCalls[0].payload).toMatchObject({
        id: 'user-1',
        role: 'teacher',
        group: 'GR-101',
        fullName: 'Иван Иванов',
        tokenVersion: 2,
      });
    });
  });

  describe('signJwt', () => {
    it('should create a token via wrapper', async () => {
      const token = await signJwt({ id: 'user-2', role: 'admin', group: 'GR-202' });
      expect(token).toBe('mock-jwt-token');
      expect(mockCalls[0].payload).toMatchObject({ id: 'user-2', role: 'admin', group: 'GR-202' });
    });
  });

  describe('verifyToken', () => {
    it('should return null for invalid token', async () => {
      const payload = await verifyToken('some-token');
      expect(payload).toBeNull();
    });

    it('should return null for empty token string', async () => {
      const payload = await verifyToken('');
      expect(payload).toBeNull();
    });

    it('should return payload for valid token', async () => {
      const { jwtVerify } = await import('jose');
      vi.mocked(jwtVerify).mockResolvedValueOnce({
        payload: { id: 'user-1', role: 'student', exp: 9999999999 },
      } as never);
      const payload = await verifyToken('valid-token');
      expect(payload).toEqual({
        id: 'user-1',
        role: 'student',
        tokenVersion: undefined,
        group: undefined,
        fullName: undefined,
        exp: 9999999999,
      });
    });

    it('should return null if payload missing required fields', async () => {
      const { jwtVerify } = await import('jose');
      vi.mocked(jwtVerify).mockResolvedValueOnce({
        payload: { id: 'user-1' },
      } as never);
      const payload = await verifyToken('token-no-role');
      expect(payload).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const { jwtVerify } = await import('jose');
      vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('network error'));
      const payload = await verifyToken('bad-token');
      expect(payload).toBeNull();
    });
  });

  describe('getTokenPayload', () => {
    it('should return null for null token', async () => {
      const payload = await getTokenPayload(null);
      expect(payload).toBeNull();
    });

    it('should return payload for valid token', async () => {
      const { jwtVerify } = await import('jose');
      vi.mocked(jwtVerify).mockResolvedValueOnce({
        payload: { id: 'user-1', role: 'student', exp: 9999999999 },
      } as never);
      const payload = await getTokenPayload('valid-token');
      expect(payload).toEqual({
        id: 'user-1',
        role: 'student',
        tokenVersion: undefined,
        group: undefined,
        fullName: undefined,
        exp: 9999999999,
      });
    });
  });

  describe('authenticate', () => {
    it('should return null for null token', async () => {
      const result = await authenticate(null);
      expect(result).toBeNull();
    });

    it('should return {id, role} for valid token', async () => {
      const { jwtVerify } = await import('jose');
      vi.mocked(jwtVerify).mockResolvedValueOnce({
        payload: { id: 'user-1', role: 'teacher', exp: 9999999999 },
      } as never);
      const result = await authenticate('valid-token');
      expect(result).toEqual({ id: 'user-1', role: 'teacher' });
    });

    it('should return null for invalid token', async () => {
      const { jwtVerify } = await import('jose');
      vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('invalid'));
      const result = await authenticate('bad-token');
      expect(result).toBeNull();
    });
  });
});
