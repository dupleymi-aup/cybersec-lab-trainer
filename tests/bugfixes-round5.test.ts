import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockPrisma = {
  user: { findUnique: vi.fn(), findMany: vi.fn() },
};

vi.mock('@/lib/db', () => ({
  getPrisma: () => mockPrisma,
}));

import { checkRateLimit } from '@/lib/api-middleware';

describe('XP rate limiting', () => {
  beforeEach(() => {
    // Clean up any existing rate limit entries for our test keys
    for (const _key of ['xp:test-user', 'xp:test-user-2']) {
      // Access internal store indirectly — we'll just use unique keys
    }
  });

  it('should allow first XP request', () => {
    const result = checkRateLimit('xp:test-allow-1', 20, 60 * 60 * 1000);
    expect(result.allowed).toBe(true);
  });

  it('should block after exceeding max attempts', () => {
    const key = 'xp:test-block-1';
    const maxAttempts = 5;
    const windowMs = 60 * 60 * 1000;

    // Use up all allowed attempts
    for (let i = 0; i < maxAttempts; i++) {
      const result = checkRateLimit(key, maxAttempts, windowMs);
      expect(result.allowed).toBe(true);
    }

    // Next request should be blocked
    const blocked = checkRateLimit(key, maxAttempts, windowMs);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('should reset after window expires', async () => {
    const key = 'xp:test-reset-1';
    const maxAttempts = 3;
    const windowMs = 100; // 100ms window

    // Exhaust attempts
    for (let i = 0; i < maxAttempts; i++) {
      const result = checkRateLimit(key, maxAttempts, windowMs);
      expect(result.allowed).toBe(true);
    }

    // Should be blocked now
    const blocked = checkRateLimit(key, maxAttempts, windowMs);
    expect(blocked.allowed).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should be allowed again
    const afterReset = checkRateLimit(key, maxAttempts, windowMs);
    expect(afterReset.allowed).toBe(true);
  });

  it('should handle different keys independently', () => {
    const key1 = 'xp:test-indep-1';
    const key2 = 'xp:test-indep-2';
    const maxAttempts = 5;
    const windowMs = 60 * 60 * 1000;

    // Exhaust key1
    for (let i = 0; i < maxAttempts; i++) {
      checkRateLimit(key1, maxAttempts, windowMs);
    }

    // key1 should be blocked
    expect(checkRateLimit(key1, maxAttempts, windowMs).allowed).toBe(false);

    // key2 should still be allowed
    expect(checkRateLimit(key2, maxAttempts, windowMs).allowed).toBe(true);
  });

  it('should report correct retryAfter time', () => {
    const key = 'xp:test-retry-1';
    const maxAttempts = 1;
    const windowMs = 60_000; // 1 minute

    checkRateLimit(key, maxAttempts, windowMs);

    const result = checkRateLimit(key, maxAttempts, windowMs);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
    expect(result.retryAfter).toBeLessThanOrEqual(60);
  });
});
