import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('env validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.TOKEN_SECRET;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use defaults in development', async () => {
    process.env.NODE_ENV = 'development';
    const { env } = await import('@/lib/env');
    expect(env.nodeEnv).toBe('development');
    expect(env.appUrl).toBeTruthy();
  });

  it('should accept NEXT_PUBLIC_APP_URL', async () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_APP_URL = 'https://custom.example.com';
    const { env } = await import('@/lib/env');
    expect(env.appUrl).toBe('https://custom.example.com');
  });

  it('should throw for invalid NEXT_PUBLIC_APP_URL', async () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_APP_URL = 'not-a-url';
    await expect(import('@/lib/env')).rejects.toThrow('Invalid NEXT_PUBLIC_APP_URL');
  });

  it('should throw for invalid NODE_ENV', async () => {
    process.env.NODE_ENV = 'staging' as string;
    await expect(import('@/lib/env')).rejects.toThrow('Invalid NODE_ENV');
  });

  it('should throw for missing TOKEN_SECRET in production', async () => {
    process.env.NODE_ENV = 'production';
    await expect(import('@/lib/env')).rejects.toThrow('TOKEN_SECRET must be set in production');
  });

  it('should use provided TOKEN_SECRET', async () => {
    process.env.NODE_ENV = 'development';
    process.env.TOKEN_SECRET = 'my-secret-12345678901234567890';
    const { env } = await import('@/lib/env');
    expect(env.tokenSecret).toBe('my-secret-12345678901234567890');
  });

  it('should generate random secret when TOKEN_SECRET not set in dev', async () => {
    process.env.NODE_ENV = 'development';
    const { env } = await import('@/lib/env');
    expect(env.tokenSecret).toBeTruthy();
    expect(env.tokenSecret.length).toBeGreaterThan(0);
  });

  it('should warn about missing DATABASE_URL in development', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    vi.mocked(logger.warn).mockClear();
    await import('@/lib/env');
    expect(logger.warn).toHaveBeenCalledWith(
      'DATABASE_URL not set. Database features will be disabled. Set DATABASE_URL in .env to enable Prisma.',
    );
  });

  it('should use Math.random fallback when crypto.getRandomValues unavailable', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.TOKEN_SECRET;
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { getRandomValues: undefined },
    });
    try {
      const { env } = await import('@/lib/env');
      expect(env.tokenSecret).toBeTruthy();
      expect(env.tokenSecret.length).toBeGreaterThan(0);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: originalCrypto,
      });
    }
  });
});
