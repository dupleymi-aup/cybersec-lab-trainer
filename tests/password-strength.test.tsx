import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePasswordStrength } from '@/hooks/use-password-strength';

function renderPasswordStrength(password: string) {
  return renderHook(() => usePasswordStrength(password));
}

describe('usePasswordStrength', () => {
  it('should return empty result for empty password', () => {
    const { result } = renderPasswordStrength('');
    expect(result.current).toEqual({
      score: 0,
      label: '',
      color: 'bg-slate-200',
      checks: [],
    });
  });

  it('should detect very weak password (1 check passed)', () => {
    const { result } = renderPasswordStrength('abc');
    expect(result.current.score).toBe(15);
    expect(result.current.label).toBe('Очень слабый');
    expect(result.current.color).toBe('bg-red-500');
  });

  it('should detect weak password (2 checks passed)', () => {
    const { result } = renderPasswordStrength('abcDEF');
    expect(result.current.score).toBe(30);
    expect(result.current.label).toBe('Слабый');
    expect(result.current.color).toBe('bg-red-400');
  });

  it('should detect medium password (3 checks passed)', () => {
    const { result } = renderPasswordStrength('abcdef123');
    expect(result.current.score).toBe(50);
    expect(result.current.label).toBe('Средний');
    expect(result.current.color).toBe('bg-yellow-500');
  });

  it('should detect good password (4 checks passed)', () => {
    const { result } = renderPasswordStrength('Abcdef123');
    expect(result.current.score).toBe(70);
    expect(result.current.label).toBe('Хороший');
    expect(result.current.color).toBe('bg-emerald-400');
  });

  it('should detect strong password (5 checks passed)', () => {
    const { result } = renderPasswordStrength('Abcdef123!');
    expect(result.current.score).toBe(85);
    expect(result.current.label).toBe('Надёжный');
    expect(result.current.color).toBe('bg-emerald-500');
  });

  it('should detect excellent password (6 checks passed)', () => {
    const { result } = renderPasswordStrength('Admin@123456');
    expect(result.current.score).toBe(100);
    expect(result.current.label).toBe('Отличный');
    expect(result.current.color).toBe('bg-emerald-600');
  });

  it('should have 6 checks for any non-empty password', () => {
    const { result } = renderPasswordStrength('test');
    expect(result.current.checks).toHaveLength(6);
  });

  it('should correctly mark individual checks', () => {
    const { result } = renderPasswordStrength('Admin@123456');
    const checks = result.current.checks;
    expect(checks[0].passed).toBe(true);  // 8+ chars
    expect(checks[1].passed).toBe(true);  // lowercase
    expect(checks[2].passed).toBe(true);  // uppercase
    expect(checks[3].passed).toBe(true);  // digits
    expect(checks[4].passed).toBe(true);  // special chars
    expect(checks[5].passed).toBe(true);  // 12+ chars
  });

  it('should correctly fail individual checks', () => {
    const { result } = renderPasswordStrength('abc');
    const checks = result.current.checks;
    expect(checks[0].passed).toBe(false); // 8+ chars
    expect(checks[1].passed).toBe(true);  // lowercase
    expect(checks[2].passed).toBe(false); // uppercase
    expect(checks[3].passed).toBe(false); // digits
    expect(checks[4].passed).toBe(false); // special chars
    expect(checks[5].passed).toBe(false); // 12+ chars
  });
});
