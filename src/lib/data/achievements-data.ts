import { modules } from './modules-data';

// ============================================================
// Achievements
// ============================================================
export const achievements = [
  {
    id: 'first-steps',
    title: 'Первые шаги',
    description: 'Завершите свой первый модуль обучения.',
    condition: 'Пройдите любой модуль',
  },
  {
    id: 'sql-master',
    title: 'SQL-мастер',
    description: 'Завершите все задания лаборатории SQL-инъекций.',
    condition: 'Пройдите модуль SQL-инъекции',
  },
  {
    id: 'xss-hunter',
    title: 'Охотник на XSS',
    description: 'Изучите все три типа XSS-атак.',
    condition: 'Пройдите модуль XSS',
  },
  {
    id: 'security-guard',
    title: 'Страж безопасности',
    description: 'Изучите все 10 категорий OWASP Top 10.',
    condition: 'Изучите все пункты OWASP Top 10',
  },
  {
    id: 'auth-expert',
    title: 'Эксперт по аутентификации',
    description: 'Завершите модуль безопасности аутентификации.',
    condition: 'Пройдите модуль Аутентификация',
  },
  {
    id: 'code-reviewer',
    title: 'Код-ревьюер',
    description: 'Завершите все задания безопасного кодирования.',
    condition: 'Пройдите модуль Безопасное кодирование',
  },
  {
    id: 'quiz-master',
    title: 'Мастер квизов',
    description: 'Пройдите квизы в 3 и более категориях.',
    condition: 'Завершите 3 квиза',
  },
  {
    id: 'quiz-perfect',
    title: 'Безупречный результат',
    description: 'Получите 100% в любом квизе.',
    condition: 'Наберите 100% в квизе',
  },
  {
    id: 'crypto-ninja',
    title: 'Криптограф-ниндзя',
    description: 'Завершите модуль инструментов безопасности.',
    condition: 'Пройдите модуль Инструменты',
  },
  {
    id: 'full-completion',
    title: 'Полное прохождение',
    description: 'Завершите все обучающие модули платформы.',
    condition: 'Пройдите все 8 модулей',
  },
  {
    id: 'csrf-shield',
    title: 'Щит от CSRF',
    description: 'Изучите модуль CSRF-атак и механизмы защиты.',
    condition: 'Пройдите модуль CSRF',
  },
  {
    id: 'owasp-half',
    title: 'Полпути к OWASP',
    description: 'Изучите минимум 5 из 10 категорий OWASP Top 10.',
    condition: 'Изучите 5 пунктов OWASP Top 10',
  },
  {
    id: 'quiz-all',
    title: 'Квиз-энциклопедист',
    description: 'Пройдите квизы во всех 9 категориях.',
    condition: 'Завершите 9 квизов',
  },
  {
    id: 'crypto-explorer',
    title: 'Исследователь криптографии',
    description: 'Используйте все инструменты в модуле «Инструменты безопасности».',
    condition: 'Попробуйте все криптографические инструменты',
  },
  {
    id: 'coding-pro',
    title: 'Профессионал код-ревью',
    description: 'Правильно решите минимум 8 из 15 задач безопасного кодирования.',
    condition: 'Решите 8+ задач на безопасное кодирование',
  },
  {
    id: 'headers-guard',
    title: 'Страж заголовков',
    description: 'Изучите все 12 Security Headers и правильно ответьте на квизы.',
    condition: 'Пройдите модуль Security Headers',
  },
  {
    id: 'coding-master',
    title: 'Мастер безопасного кода',
    description: 'Правильно решите все 15+ задач безопасного кодирования.',
    condition: 'Решите 15+ задач на безопасное кодирование',
  },
  {
    id: 'network-ninja',
    title: 'Сетевой ниндзя',
    description: 'Пройдите все квизы по сетевой безопасности.',
    condition: 'Наберите 80%+ в квизе Network Security',
  },
  {
    id: 'social-engineer',
    title: 'Эксперт по социальной инженерии',
    description: 'Пройдите все квизы по социальной инженерии.',
    condition: 'Наберите 80%+ в квизе Social Engineering',
  },
  {
    id: 'all-headers-correct',
    title: 'Все заголовки на месте',
    description: 'Правильно ответьте на все вопросы квиза Security Headers.',
    condition: 'Наберите 100% в квизе Security Headers',
  },
  {
    id: 'api-guardian',
    title: 'Страж API',
    description: 'Изучите все 10 тем модуля «Безопасность API».',
    condition: 'Пройдите модуль Безопасность API',
  },
  {
    id: 'idor-detective',
    title: 'IDOR-детектив',
    description: 'Пройдите квиз по IDOR-атакам на 80%+.',
    condition: 'Наберите 80%+ в квизе IDOR',
  },
  {
    id: 'ssrf-hunter',
    title: 'SSRF-охотник',
    description: 'Пройдите квиз по SSRF-атакам на 80%+.',
    condition: 'Наберите 80%+ в квизе SSRF',
  },
];

/**
 * Check if an achievement is unlocked based on current progress.
 * This is a pure function — pass in the state slices it depends on.
 */
export function isAchievementUnlocked(
  id: string,
  completedModules: string[],
  studiedOwaspItems: string[],
  quizScores: Record<string, number>,
  secureCodingCorrectCount = 0,
): boolean {
  switch (id) {
    case 'first-steps':
      return completedModules.length >= 1;
    case 'sql-master':
      return completedModules.includes('sql-injection');
    case 'xss-hunter':
      return completedModules.includes('xss');
    case 'security-guard':
      return studiedOwaspItems.length >= 10;
    case 'auth-expert':
      return completedModules.includes('auth');
    case 'code-reviewer':
      return completedModules.includes('secure-coding');
    case 'quiz-master':
      return Object.keys(quizScores).length >= 3;
    case 'quiz-perfect':
      return Object.values(quizScores).some((s) => s === 100);
    case 'crypto-ninja':
      return completedModules.includes('tools');
    case 'full-completion':
      return completedModules.length >= modules.length;
    case 'csrf-shield':
      return completedModules.includes('csrf');
    case 'owasp-half':
      return studiedOwaspItems.length >= 5;
    case 'quiz-all':
      return Object.keys(quizScores).length >= 9;
    case 'crypto-explorer':
      return (quizScores['tools'] || 0) >= 50;
    case 'coding-pro':
      return secureCodingCorrectCount >= 20;
    case 'headers-guard':
      return completedModules.includes('security-headers');
    case 'coding-master':
      return Object.values(quizScores).filter((s) => s >= 80).length >= 5;
    case 'network-ninja':
      return (quizScores['network'] || 0) >= 80;
    case 'social-engineer':
      return (quizScores['social'] || 0) >= 80;
    case 'all-headers-correct':
      return (quizScores['headers'] || 0) === 100;
    case 'api-guardian':
      return completedModules.includes('api-security');
    case 'idor-detective':
      return (quizScores['idor'] || 0) >= 80;
    case 'ssrf-hunter':
      return (quizScores['ssrf'] || 0) >= 80;
    default:
      return false;
  }
}
