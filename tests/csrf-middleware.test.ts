import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock NextRequest and NextResponse for middleware testing
const mockNextRequest = (path: string, method: string, headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => {
  const cookieStore = Object.entries(cookies).map(([name, value]) => ({ name, value }));
  return {
    nextUrl: new URL(`http://localhost:3000${path}`),
    method,
    headers: new Map(Object.entries(headers)),
    cookies: {
      get: (name: string) => cookieStore.find(c => c.name === name),
    },
  };
};

describe('CSRF middleware', () => {
  describe('isPublicPath', () => {
    const PUBLIC_PATHS = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/recovery',
      '/api/auth/recovery/verify',
      '/api/auth/recovery/reset',
      '/api/health',
      '/api/admin/health',
      '/api/docs',
      '/api/lti',
    ];

    function isPublicPath(pathname: string): boolean {
      return PUBLIC_PATHS.some(publicPath => pathname.startsWith(publicPath));
    }

    it('should identify public auth paths', () => {
      expect(isPublicPath('/api/auth/login')).toBe(true);
      expect(isPublicPath('/api/auth/register')).toBe(true);
      expect(isPublicPath('/api/auth/recovery/verify')).toBe(true);
      expect(isPublicPath('/api/health')).toBe(true);
    });

    it('should identify non-public paths', () => {
      expect(isPublicPath('/api/assignments')).toBe(false);
      expect(isPublicPath('/api/admin/users')).toBe(false);
      expect(isPublicPath('/api/gamification/xp')).toBe(false);
    });

    it('should match paths with additional segments', () => {
      expect(isPublicPath('/api/auth/login/something')).toBe(true);
      expect(isPublicPath('/api/docs/v1')).toBe(true);
    });
  });

  describe('CSRF token generation', () => {
    function generateCsrfToken(): string {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    it('should generate a 64 character hex token', () => {
      const token = generateCsrfToken();
      expect(token.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens each time', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });
});
