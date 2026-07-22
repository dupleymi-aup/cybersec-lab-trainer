import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  getPrisma: vi.fn(),
}));

vi.mock('@/lib/auth-server', () => ({
  generateToken: vi.fn(),
  getTokenPayload: vi.fn(),
}));

vi.mock('@/lib/auth-types', () => ({
  ROLE_HIERARCHY: { student: 0, teacher: 1, admin: 2 },
  hasPermission: vi.fn(),
}));

vi.mock('@/lib/capabilities', () => ({
  hasCapability: vi.fn(),
  hasAnyCapability: vi.fn(),
  hasCapabilities: vi.fn(),
}));

import { NextRequest } from 'next/server';
import {
  getTokenFromRequest,
  requireRole,
  requirePermission,
  requireCapability,
  requireCapabilities,
  requireAnyCapability,
  unauthorized,
  forbidden,
  getClientIp,
  checkRateLimit,
  authenticate,
  withCapability,
  withAnyCapability,
  withAllCapabilities,
} from '@/lib/api-middleware';
import { getTokenPayload } from '@/lib/auth-server';
import { hasPermission } from '@/lib/auth-types';
import { hasCapability, hasAnyCapability, hasCapabilities } from '@/lib/capabilities';
import { getPrisma } from '@/lib/db';

function makeRequest(headers: Record<string, string> = {}, cookies: Record<string, string> = {}): NextRequest {
  const url = 'https://example.com/api/test';
  const init: RequestInit = { headers };
  const req = new NextRequest(url, init);
  for (const [k, v] of Object.entries(cookies)) {
    req.cookies.set(k, v);
  }
  return req;
}

describe('getTokenFromRequest', () => {
  it('extracts Bearer token from Authorization header', () => {
    const req = makeRequest({ authorization: 'Bearer abc123' });
    expect(getTokenFromRequest(req)).toBe('abc123');
  });

  it('returns null when no Authorization header', () => {
    const req = makeRequest();
    expect(getTokenFromRequest(req)).toBeNull();
  });

  it('returns null when Authorization header does not start with Bearer', () => {
    const req = makeRequest({ authorization: 'Basic abc123' });
    expect(getTokenFromRequest(req)).toBeNull();
  });

  it('falls back to auth-token cookie', () => {
    const req = makeRequest({}, { 'auth-token': 'cookie-token' });
    expect(getTokenFromRequest(req)).toBe('cookie-token');
  });

  it('prefers Authorization header over cookie', () => {
    const req = makeRequest({ authorization: 'Bearer header-token' }, { 'auth-token': 'cookie-token' });
    expect(getTokenFromRequest(req)).toBe('header-token');
  });

  it('returns null when no header and no cookie', () => {
    const req = makeRequest();
    expect(getTokenFromRequest(req)).toBeNull();
  });
});

describe('requireRole', () => {
  it('returns true when user role meets required role', () => {
    expect(requireRole('admin', 'teacher')).toBe(true);
    expect(requireRole('teacher', 'student')).toBe(true);
    expect(requireRole('admin', 'admin')).toBe(true);
  });

  it('returns false when user role is below required role', () => {
    expect(requireRole('student', 'teacher')).toBe(false);
    expect(requireRole('student', 'admin')).toBe(false);
    expect(requireRole('teacher', 'admin')).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(requireRole('unknown', 'student')).toBe(false);
  });

  it('returns false when required role is unknown', () => {
    expect(requireRole('admin', 'unknown')).toBe(false);
  });

  it('checks any of multiple required roles', () => {
    expect(requireRole('teacher', 'student', 'admin')).toBe(true);
    expect(requireRole('student', 'teacher', 'admin')).toBe(false);
  });
});

describe('requirePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to hasPermission', () => {
    vi.mocked(hasPermission).mockReturnValue(true);
    expect(requirePermission('admin', 'manage_users')).toBe(true);
    expect(hasPermission).toHaveBeenCalledWith('admin', 'manage_users');
  });

  it('returns false when hasPermission returns false', () => {
    vi.mocked(hasPermission).mockReturnValue(false);
    expect(requirePermission('student', 'manage_users')).toBe(false);
  });
});

describe('requireCapability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false for null auth', () => {
    expect(requireCapability(null, 'users:read')).toBe(false);
  });

  it('delegates to hasCapability', () => {
    vi.mocked(hasCapability).mockReturnValue(true);
    const auth = { id: '1', role: 'admin' };
    expect(requireCapability(auth, 'users:read')).toBe(true);
    expect(hasCapability).toHaveBeenCalledWith('admin', 'users:read');
  });
});

describe('requireCapabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false for null auth', () => {
    expect(requireCapabilities(null, 'users:read', 'users:write')).toBe(false);
  });

  it('delegates to hasCapabilities', () => {
    vi.mocked(hasCapabilities).mockReturnValue(true);
    const auth = { id: '1', role: 'admin' };
    expect(requireCapabilities(auth, 'users:read', 'users:write')).toBe(true);
    expect(hasCapabilities).toHaveBeenCalledWith('admin', 'users:read', 'users:write');
  });
});

describe('requireAnyCapability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false for null auth', () => {
    expect(requireAnyCapability(null, 'users:read')).toBe(false);
  });

  it('delegates to hasAnyCapability', () => {
    vi.mocked(hasAnyCapability).mockReturnValue(true);
    const auth = { id: '1', role: 'teacher' };
    expect(requireAnyCapability(auth, 'users:read', 'users:write')).toBe(true);
    expect(hasAnyCapability).toHaveBeenCalledWith('teacher', 'users:read', 'users:write');
  });
});

describe('unauthorized / forbidden', () => {
  it('unauthorized returns 401 with default message', () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
  });

  it('unauthorized returns 401 with custom message', () => {
    const res = unauthorized('Custom error');
    expect(res.status).toBe(401);
  });

  it('forbidden returns 403 with default message', () => {
    const res = forbidden();
    expect(res.status).toBe(403);
  });

  it('forbidden returns 403 with custom message', () => {
    const res = forbidden('No access');
    expect(res.status).toBe(403);
  });
});

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('extracts IP from x-forwarded-for single value', () => {
    const req = makeRequest({ 'x-forwarded-for': '10.0.0.1' });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('falls back to x-real-ip', () => {
    const req = makeRequest({ 'x-real-ip': '192.168.1.1' });
    expect(getClientIp(req)).toBe('192.168.1.1');
  });

  it('returns unknown when no IP headers', () => {
    const req = makeRequest();
    expect(getClientIp(req)).toBe('unknown');
  });

  it('prefers x-forwarded-for over x-real-ip', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '5.6.7.8' });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('handles empty x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '' });
    expect(getClientIp(req)).toBe('unknown');
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows first request', () => {
    const result = checkRateLimit('test-key', 5, 60000);
    expect(result.allowed).toBe(true);
  });

  it('allows requests within limit', () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit('test-key2', 5, 60000);
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks requests exceeding limit', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-key3', 5, 60000);
    }
    const result = checkRateLimit('test-key3', 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('resets after window expires', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-key4', 5, 1000);
    }
    vi.advanceTimersByTime(1001);
    const result = checkRateLimit('test-key4', 5, 1000);
    expect(result.allowed).toBe(true);
  });

  it('different keys have independent limits', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('key-a', 5, 60000);
    }
    const result = checkRateLimit('key-b', 5, 60000);
    expect(result.allowed).toBe(true);
  });

  it('evicts expired entries when store is full', () => {
    // Fill store with entries that will expire immediately
    for (let i = 0; i < 10001; i++) {
      checkRateLimit(`evict-${i}`, 5, 1); // 1ms window
    }
    // Advance past expiration
    vi.advanceTimersByTime(2);
    // New request triggers cleanup of expired entries
    const result = checkRateLimit('evict-new', 5, 60000);
    expect(result.allowed).toBe(true);
  });
});

describe('authenticate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no token', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue(null);
    const req = makeRequest();
    const result = await authenticate(req);
    expect(result).toBeNull();
  });

  it('returns null when token is expired', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue({
      id: '1', role: 'student', exp: 0,
    });
    const req = makeRequest({ authorization: 'Bearer expired-token' });
    const result = await authenticate(req);
    expect(result).toBeNull();
  });

  it('returns null when user not found', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue({
      id: '1', role: 'student', exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue(null) },
    } as any);
    const req = makeRequest({ authorization: 'Bearer valid-token' });
    const result = await authenticate(req);
    expect(result).toBeNull();
  });

  it('returns null when user is blocked', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue({
      id: '1', role: 'student', exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ isBlocked: true, tokenVersion: 0, role: 'student' }) },
    } as any);
    const req = makeRequest({ authorization: 'Bearer valid-token' });
    const result = await authenticate(req);
    expect(result).toBeNull();
  });

  it('returns null when tokenVersion mismatch', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue({
      id: '1', role: 'student', tokenVersion: 0, exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ isBlocked: false, tokenVersion: 1, role: 'student' }) },
    } as any);
    const req = makeRequest({ authorization: 'Bearer valid-token' });
    const result = await authenticate(req);
    expect(result).toBeNull();
  });

  it('returns AuthUser on success', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue({
      id: '1', role: 'admin', group: 'G1', fullName: 'Test User', tokenVersion: 0,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ isBlocked: false, tokenVersion: 0, role: 'admin' }) },
    } as any);
    const req = makeRequest({ authorization: 'Bearer valid-token' });
    const result = await authenticate(req);
    expect(result).toEqual({
      id: '1',
      role: 'admin',
      group: 'G1',
      fullName: 'Test User',
      tokenVersion: 0,
    });
  });
});

describe('withCapability / withAnyCapability / withAllCapabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('withCapability returns 401 when not authenticated', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue(null);
    const req = makeRequest();
    const result = await withCapability(req, 'users:read');
    expect(result).toHaveProperty('status', 401);
  });

  it('withCapability returns 403 when missing capability', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue({
      id: '1', role: 'student', exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ isBlocked: false, tokenVersion: 0, role: 'student' }) },
    } as any);
    vi.mocked(hasCapability).mockReturnValue(false);
    const req = makeRequest({ authorization: 'Bearer token' });
    const result = await withCapability(req, 'users:read');
    expect(result).toHaveProperty('status', 403);
  });

  it('withCapability returns auth on success', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue({
      id: '1', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ isBlocked: false, tokenVersion: 0, role: 'admin' }) },
    } as any);
    vi.mocked(hasCapability).mockReturnValue(true);
    const req = makeRequest({ authorization: 'Bearer token' });
    const result = await withCapability(req, 'users:read');
    expect(result).toHaveProperty('auth');
    expect((result as any).auth.id).toBe('1');
  });

  it('withAnyCapability returns 401 when not authenticated', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue(null);
    const req = makeRequest();
    const result = await withAnyCapability(req, 'users:read', 'users:write');
    expect(result).toHaveProperty('status', 401);
  });

  it('withAnyCapability returns 403 when no matching capability', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue({
      id: '1', role: 'student', exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ isBlocked: false, tokenVersion: 0, role: 'student' }) },
    } as any);
    vi.mocked(hasAnyCapability).mockReturnValue(false);
    const req = makeRequest({ authorization: 'Bearer token' });
    const result = await withAnyCapability(req, 'users:read', 'users:write');
    expect(result).toHaveProperty('status', 403);
  });

  it('withAnyCapability returns auth when any capability matches', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue({
      id: '1', role: 'teacher', exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ isBlocked: false, tokenVersion: 0, role: 'teacher' }) },
    } as any);
    vi.mocked(hasAnyCapability).mockReturnValue(true);
    const req = makeRequest({ authorization: 'Bearer token' });
    const result = await withAnyCapability(req, 'users:read', 'users:write');
    expect(result).toHaveProperty('auth');
  });

  it('withAllCapabilities returns 401 when not authenticated', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue(null);
    const req = makeRequest();
    const result = await withAllCapabilities(req, 'users:read', 'users:write');
    expect(result).toHaveProperty('status', 401);
  });

  it('withAllCapabilities returns 403 when not all capabilities present', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue({
      id: '1', role: 'teacher', exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ isBlocked: false, tokenVersion: 0, role: 'teacher' }) },
    } as any);
    vi.mocked(hasCapabilities).mockReturnValue(false);
    const req = makeRequest({ authorization: 'Bearer token' });
    const result = await withAllCapabilities(req, 'users:read', 'users:write');
    expect(result).toHaveProperty('status', 403);
  });

  it('withAllCapabilities returns auth when all capabilities present', async () => {
    vi.mocked(getTokenPayload).mockResolvedValue({
      id: '1', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: vi.fn().mockResolvedValue({ isBlocked: false, tokenVersion: 0, role: 'admin' }) },
    } as any);
    vi.mocked(hasCapabilities).mockReturnValue(true);
    const req = makeRequest({ authorization: 'Bearer token' });
    const result = await withAllCapabilities(req, 'users:read', 'users:write');
    expect(result).toHaveProperty('auth');
  });
});
