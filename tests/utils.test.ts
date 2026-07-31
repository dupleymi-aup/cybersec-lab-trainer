import { describe, it, expect } from 'vitest';
import { cn, parseDays, parseBody } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('filters falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('handles conditional objects', () => {
    expect(cn('a', { b: true, c: false })).toBe('a b');
  });

  it('deduplicates tailwind conflicts via twMerge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('parseBody', () => {
  it('parses valid JSON body', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseBody<{ name: string }>(request);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ name: 'test' });
  });

  it('returns 400 response for invalid JSON', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      body: '{invalid json',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseBody(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe('Invalid request body');
    }
  });

  it('returns 400 response for empty body', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      body: '',
    });
    const result = await parseBody(request);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });
});

describe('parseDays', () => {
  it('returns fallback when no days param', () => {
    const params = new URLSearchParams();
    expect(parseDays(params)).toBe(30);
  });

  it('returns custom fallback when specified', () => {
    const params = new URLSearchParams();
    expect(parseDays(params, 60)).toBe(60);
  });

  it('parses valid days parameter', () => {
    const params = new URLSearchParams({ days: '45' });
    expect(parseDays(params)).toBe(45);
  });

  it('clamps to max value', () => {
    const params = new URLSearchParams({ days: '500' });
    expect(parseDays(params)).toBe(365);
  });

  it('returns 1 for invalid (NaN) values', () => {
    const params = new URLSearchParams({ days: 'abc' });
    expect(parseDays(params)).toBe(1);
  });

  it('returns 1 for zero', () => {
    const params = new URLSearchParams({ days: '0' });
    expect(parseDays(params)).toBe(1);
  });

  it('returns 1 for negative values', () => {
    const params = new URLSearchParams({ days: '-5' });
    expect(parseDays(params)).toBe(1);
  });

  it('respects custom max', () => {
    const params = new URLSearchParams({ days: '100' });
    expect(parseDays(params, 30, 50)).toBe(50);
  });
});
