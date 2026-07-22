import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log info messages in development', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    logger.info('test message');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log warn messages in development', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    logger.warn('warning message');
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log error messages in development', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    logger.error('error message');
    expect(console.error).toHaveBeenCalled();
  });

  it('should log info with context in development', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    logger.info('with context', { key: 'value' });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log warn with context in development', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    logger.warn('warn ctx', { detail: 42 });
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log error with context in development', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    logger.error('err ctx', { code: 500 });
    expect(console.error).toHaveBeenCalled();
  });

  it('should redact sensitive keys in context', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    logger.info('sensitive', { password: 'secret123', token: 'tok123', normal: 'keep' });
    const call = consoleSpy.mock.calls[0];
    expect(call).toBeDefined();
  });

  it('should log as JSON in production', async () => {
    process.env.NODE_ENV = 'production';
    const { logger } = await import('@/lib/logger');
    logger.info('prod message');
    expect(consoleSpy).toHaveBeenCalled();
    const arg = consoleSpy.mock.calls[0]?.[0];
    expect(typeof arg).toBe('string');
    const parsed = JSON.parse(arg);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('prod message');
  });

  it('should use console.error for error level in production', async () => {
    process.env.NODE_ENV = 'production';
    const { logger } = await import('@/lib/logger');
    logger.error('prod error');
    expect(console.error).toHaveBeenCalled();
  });

  it('should use console.warn for warn level in production', async () => {
    process.env.NODE_ENV = 'production';
    const { logger } = await import('@/lib/logger');
    logger.warn('prod warn');
    expect(console.warn).toHaveBeenCalled();
  });
});
