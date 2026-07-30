import { describe, it, expect } from 'vitest';
import { validateUuid } from '@/lib/validate-uuid';

describe('validateUuid', () => {
  it('accepts valid UUID v4', () => {
    expect(validateUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts valid UUID v1', () => {
    expect(validateUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
  });

  it('accepts uppercase UUID', () => {
    expect(validateUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateUuid('')).toBe(false);
  });

  it('rejects short string', () => {
    expect(validateUuid('550e8400-e29b-41d4-a716')).toBe(false);
  });

  it('rejects string with invalid chars', () => {
    expect(validateUuid('550e8400-e29b-41d4-a716-44665544000g')).toBe(false);
  });

  it('rejects string without dashes', () => {
    expect(validateUuid('550e8400e29b41d4a716446655440000')).toBe(false);
  });

  it('rejects random text', () => {
    expect(validateUuid('not-a-uuid')).toBe(false);
  });
});
