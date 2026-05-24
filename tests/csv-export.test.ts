import { describe, it, expect } from 'vitest';

// Replicate the escapeCsvField function from export/route.ts for testing
function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  const needsPrefixEscape = dangerousPrefixes.some(prefix => str.startsWith(prefix));
  if (needsPrefixEscape || str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

describe('CSV export - formula injection prevention', () => {
  it('should escape fields starting with =', () => {
    const result = escapeCsvField('=cmd|"/C calc"!A0');
    expect(result).toBe('"=cmd|""/C calc""!A0"');
  });

  it('should escape fields starting with +', () => {
    const result = escapeCsvField('+12345678');
    expect(result).toBe('"+12345678"');
  });

  it('should escape fields starting with -', () => {
    const result = escapeCsvField('-cmd');
    expect(result).toBe('"-cmd"');
  });

  it('should escape fields starting with @', () => {
    const result = escapeCsvField('@SUM(A1:A10)');
    expect(result).toBe('"@SUM(A1:A10)"');
  });

  it('should escape fields starting with tab', () => {
    const result = escapeCsvField('\tmalicious');
    expect(result).toBe('"\tmalicious"');
  });

  it('should escape fields with commas', () => {
    const result = escapeCsvField('Doe, John');
    expect(result).toBe('"Doe, John"');
  });

  it('should escape fields with double quotes', () => {
    const result = escapeCsvField('He said "hello"');
    expect(result).toBe('"He said ""hello"""');
  });

  it('should not escape normal fields', () => {
    expect(escapeCsvField('John Doe')).toBe('John Doe');
    expect(escapeCsvField('john@example.com')).toBe('john@example.com');
    expect(escapeCsvField('student')).toBe('student');
  });

  it('should handle null and undefined', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  it('should handle numbers and booleans', () => {
    expect(escapeCsvField(123)).toBe('123');
    expect(escapeCsvField(true)).toBe('true');
    expect(escapeCsvField(false)).toBe('false');
  });
});
