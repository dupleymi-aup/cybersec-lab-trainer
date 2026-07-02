import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateEnv } from '@/lib/env';

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe('validateEnv', () => {
  it('should return development config by default', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('TOKEN_SECRET', '');
    const result = validateEnv();
    expect(result.nodeEnv).toBe('development');
    expect(result.appUrl).toBe('http://localhost:3000');
    expect(result.tokenSecret).toBeTruthy();
    expect(typeof result.tokenSecret).toBe('string');
  });

  it('should accept production NODE_ENV with valid URL and token', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost/mydb');
    vi.stubEnv('TOKEN_SECRET', 'my-super-secret-key-32-chars-long!!');
    const result = validateEnv();
    expect(result.nodeEnv).toBe('production');
    expect(result.appUrl).toBe('https://example.com');
    expect(result.databaseUrl).toBe('postgresql://localhost/mydb');
    expect(result.tokenSecret).toBe('my-super-secret-key-32-chars-long!!');
  });

  it('should accept test NODE_ENV', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost/test');
    const result = validateEnv();
    expect(result.nodeEnv).toBe('test');
  });

  it('should throw for invalid NODE_ENV', () => {
    vi.stubEnv('NODE_ENV', 'staging');
    expect(() => validateEnv()).toThrow('Invalid NODE_ENV');
  });

  it('should throw for invalid app URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'not-a-url');
    expect(() => validateEnv()).toThrow('Invalid NEXT_PUBLIC_APP_URL');
  });

  it('should generate token secret when not set in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TOKEN_SECRET', '');
    const result = validateEnv();
    expect(result.tokenSecret).toBeTruthy();
    expect(typeof result.tokenSecret).toBe('string');
  });

  it('should throw in production when TOKEN_SECRET is missing', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost/mydb');
    vi.stubEnv('TOKEN_SECRET', '');
    expect(() => validateEnv()).toThrow('TOKEN_SECRET must be set in production');
  });

  it('should use default app URL when not set', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    const result = validateEnv();
    expect(result.appUrl).toBe('http://localhost:3000');
  });

  it('should use default database URL in production when set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
    vi.stubEnv('DATABASE_URL', 'postgresql://prod/mydb');
    vi.stubEnv('TOKEN_SECRET', 'my-super-secret-key-32-chars-long!!');
    const result = validateEnv();
    expect(result.databaseUrl).toBe('postgresql://prod/mydb');
  });

  it('should warn when DATABASE_URL not set in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    vi.stubEnv('TOKEN_SECRET', '');
    vi.stubEnv('DATABASE_URL', '');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = validateEnv();
    expect(result.databaseUrl).toBe('');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DATABASE_URL not set'));
    warnSpy.mockRestore();
  });
});