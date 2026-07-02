import { describe, it, expect, vi } from 'vitest';
import { safeJson, safeJsonParse } from '@/lib/safe-json';

describe('safeJson', () => {
  it('should parse valid JSON response', async () => {
    const res = { text: () => Promise.resolve('{"key": "value"}') } as Response;
    const result = await safeJson<{ key: string }>(res);
    expect(result).toEqual({ key: 'value' });
  });

  it('should return fallback for empty response body', async () => {
    const res = { text: () => Promise.resolve('') } as Response;
    const result = await safeJson(res, { fallback: true });
    expect(result).toEqual({ fallback: true });
  });

  it('should return fallback for invalid JSON', async () => {
    const res = { text: () => Promise.resolve('not json') } as Response;
    const result = await safeJson(res, { error: 'custom' });
    expect(result).toEqual({ error: 'custom' });
  });

  it('should use default fallback when not provided', async () => {
    const res = { text: () => Promise.resolve('not json') } as Response;
    const result = await safeJson(res);
    expect(result).toEqual({ error: 'Invalid JSON response' });
  });

  it('should return fallback when text() throws', async () => {
    const res = { text: () => Promise.reject(new Error('network error')) } as Response;
    const result = await safeJson(res, { safe: true });
    expect(result).toEqual({ safe: true });
  });

  it('should return fallback when text is null', async () => {
    const res = { text: () => Promise.resolve(null as unknown as string) } as Response;
    const result = await safeJson(res, { ok: false });
    expect(result).toEqual({ ok: false });
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON string', () => {
    const result = safeJsonParse<{ a: number }>('{"a": 1}');
    expect(result).toEqual({ a: 1 });
  });

  it('should return null for invalid JSON string', () => {
    const result = safeJsonParse('not json');
    expect(result).toBeNull();
  });

  it('should return custom fallback for invalid JSON', () => {
    const result = safeJsonParse('not json', { default: true });
    expect(result).toEqual({ default: true });
  });

  it('should return null for null input', () => {
    const result = safeJsonParse(null);
    expect(result).toBeNull();
  });

  it('should return custom fallback for null input', () => {
    const result = safeJsonParse(null, { fallback: true });
    expect(result).toEqual({ fallback: true });
  });

  it('should return null for empty string', () => {
    const result = safeJsonParse('');
    expect(result).toBeNull();
  });

  it('should parse array JSON', () => {
    const result = safeJsonParse<number[]>('[1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });

  it('should parse nested objects', () => {
    const result = safeJsonParse<{ deep: { value: string } }>('{"deep": {"value": "test"}}');
    expect(result).toEqual({ deep: { value: 'test' } });
  });

  it('should handle primitive values', () => {
    expect(safeJsonParse('42')).toBe(42);
    expect(safeJsonParse('"hello"')).toBe('hello');
    expect(safeJsonParse('true')).toBe(true);
    expect(safeJsonParse('null')).toBeNull();
  });
});
