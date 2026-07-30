import { describe, it, expect } from 'vitest';
import { parseDays } from '@/lib/utils';

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
