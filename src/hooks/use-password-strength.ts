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
      { label: 'Минимум 8 символов', passed: password.length >= 8 },
      { label: 'Строчные буквы (a-z)', passed: /[a-z]/.test(password) },
      { label: 'Заглавные буквы (A-Z)', passed: /[A-Z]/.test(password) },
      { label: 'Цифры (0-9)', passed: /[0-9]/.test(password) },
      { label: 'Спецсимволы (!@#$...)', passed: /[^a-zA-Z0-9]/.test(password) },
      { label: 'Минимум 12 символов', passed: password.length >= 12 },
    ];

    const passedCount = checks.filter((c) => c.passed).length;
    let score = 0;
    let label = '';
    let color = 'bg-slate-200';

    if (passedCount <= 1) { score = 15; label = 'Очень слабый'; color = 'bg-red-500'; }
    else if (passedCount <= 2) { score = 30; label = 'Слабый'; color = 'bg-red-400'; }
    else if (passedCount <= 3) { score = 50; label = 'Средний'; color = 'bg-yellow-500'; }
    else if (passedCount <= 4) { score = 70; label = 'Хороший'; color = 'bg-emerald-400'; }
    else if (passedCount <= 5) { score = 85; label = 'Надёжный'; color = 'bg-emerald-500'; }
    else { score = 100; label = 'Отличный'; color = 'bg-emerald-600'; }

    return { score, label, color, checks };
  }, [password]);
}
