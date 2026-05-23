import { describe, it, expect } from 'vitest';
import { verifyToken, generateToken, getTokenPayload } from '@/lib/auth-server';

describe('auth-server', () => {
  describe('generateToken + verifyToken', () => {
    it('should preserve group and fullName in token round-trip', () => {
      const userId = 'test-user-123';
      const role = 'student';
      const group = 'CS-101';
      const fullName = 'John Doe';

      const token = generateToken(userId, role, { group, fullName });
      const payload = verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload!.id).toBe(userId);
      expect(payload!.role).toBe(role);
      expect(payload!.group).toBe(group);
      expect(payload!.fullName).toBe(fullName);
    });

    it('should work without optional fields', () => {
      const userId = 'test-user-456';
      const role = 'teacher';

      const token = generateToken(userId, role);
      const payload = verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload!.id).toBe(userId);
      expect(payload!.role).toBe(role);
      expect(payload!.group).toBeUndefined();
      expect(payload!.fullName).toBeUndefined();
    });

    it('should reject invalid tokens', () => {
      const payload = verifyToken('invalid-token-string');
      expect(payload).toBeNull();
    });

    it('should return null for empty token', () => {
      const payload = getTokenPayload(null);
      expect(payload).toBeNull();
    });
  });
});
