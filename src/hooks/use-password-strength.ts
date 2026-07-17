import { useMemo } from 'react';

interface PasswordCheck {
  label: string;
  passed: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  checks: PasswordCheck[];
}

export function usePasswordStrength(password: string): PasswordStrength {
  return useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200', checks: [] };

    const checks: PasswordCheck[] = [
      { label: 'Minimum 8 characters', passed: password.length >= 8 },
      { label: 'Lowercase letters (a-z)', passed: /[a-z]/.test(password) },
      { label: 'Uppercase letters (A-Z)', passed: /[A-Z]/.test(password) },
      { label: 'Numbers (0-9)', passed: /[0-9]/.test(password) },
      { label: 'Special characters (!@#$...)', passed: /[^a-zA-Z0-9]/.test(password) },
      { label: 'Minimum 12 characters', passed: password.length >= 12 },
    ];

    const passedCount = checks.filter((c) => c.passed).length;
    const score =
      passedCount <= 1
        ? 15
        : passedCount <= 2
          ? 30
          : passedCount <= 3
            ? 50
            : passedCount <= 4
              ? 70
              : passedCount <= 5
                ? 85
                : 100;
    const label =
      passedCount <= 1
        ? 'Very weak'
        : passedCount <= 2
          ? 'Weak'
          : passedCount <= 3
            ? 'Fair'
            : passedCount <= 4
              ? 'Good'
              : passedCount <= 5
                ? 'Strong'
                : 'Excellent';
    const color =
      passedCount <= 1
        ? 'bg-red-500'
        : passedCount <= 2
          ? 'bg-red-400'
          : passedCount <= 3
            ? 'bg-yellow-500'
            : passedCount <= 4
              ? 'bg-emerald-400'
              : passedCount <= 5
                ? 'bg-emerald-500'
                : 'bg-emerald-600';

    return { score, label, color, checks };
  }, [password]);
}
