import { describe, it, expect, beforeEach } from 'vitest';
import { getAchievementStatus, countUnlockedAchievements } from '@/lib/achievement-utils';
import { achievements, modules } from '@/lib/data';

describe('getAchievementStatus', () => {
  const emptyState = {
    completedModules: [] as string[],
    quizScores: {} as Record<string, number>,
    challengeStats: { owaspCorrect: 0, authCorrect: 0 },
  };

  describe('first-steps', () => {
    it('should be unlocked when at least 1 module is completed', () => {
      expect(getAchievementStatus('first-steps', ['owasp'], {})).toBe(true);
    });

    it('should not be unlocked when no modules are completed', () => {
      expect(getAchievementStatus('first-steps', [], {})).toBe(false);
    });
  });

  describe('sql-master', () => {
    it('should be unlocked when sql-injection module is completed', () => {
      expect(getAchievementStatus('sql-master', ['sql-injection'], {})).toBe(true);
    });

    it('should not be unlocked without sql-injection module', () => {
      expect(getAchievementStatus('sql-master', ['owasp', 'xss'], {})).toBe(false);
    });
  });

  describe('xss-hunter', () => {
    it('should be unlocked when xss module is completed', () => {
      expect(getAchievementStatus('xss-hunter', ['xss'], {})).toBe(true);
    });
  });

  describe('quiz-master', () => {
    it('should be unlocked when 3+ quizzes are taken', () => {
      expect(
        getAchievementStatus('quiz-master', [], { owasp: 80, sqli: 75, xss: 90 })
      ).toBe(true);
    });

    it('should not be unlocked with fewer than 3 quizzes', () => {
      expect(
        getAchievementStatus('quiz-master', [], { owasp: 80, sqli: 75 })
      ).toBe(false);
    });
  });

  describe('quiz-perfect', () => {
    it('should be unlocked when any quiz score is 100', () => {
      expect(
        getAchievementStatus('quiz-perfect', [], { owasp: 100, sqli: 50 })
      ).toBe(true);
    });

    it('should not be unlocked without a perfect score', () => {
      expect(
        getAchievementStatus('quiz-perfect', [], { owasp: 99, sqli: 80 })
      ).toBe(false);
    });
  });

  describe('quiz-streak', () => {
    it('should be unlocked when 3+ quizzes have score >= 80', () => {
      expect(
        getAchievementStatus('quiz-streak', [], { a: 80, b: 85, c: 90 })
      ).toBe(true);
    });

    it('should not be unlocked with fewer than 3 high scores', () => {
      expect(
        getAchievementStatus('quiz-streak', [], { a: 80, b: 79, c: 90 })
      ).toBe(false);
    });
  });

  describe('full-completion', () => {
    it('should be unlocked when all modules are completed', () => {
      const allModuleIds = modules.map((m) => m.id);
      expect(getAchievementStatus('full-completion', allModuleIds, {})).toBe(true);
    });

    it('should not be unlocked with partial completion', () => {
      expect(getAchievementStatus('full-completion', ['owasp'], {})).toBe(false);
    });
  });

  describe('all-categories', () => {
    it('should be unlocked when 8+ quiz categories are taken', () => {
      const scores: Record<string, number> = {};
      for (let i = 0; i < 8; i++) scores[`cat${i}`] = 50;
      expect(getAchievementStatus('all-categories', [], scores)).toBe(true);
    });

    it('should not be unlocked with fewer than 8 categories', () => {
      expect(getAchievementStatus('all-categories', [], { a: 50, b: 60 })).toBe(false);
    });
  });
});

describe('countUnlockedAchievements', () => {
  it('should return 0 for empty state', () => {
    const count = countUnlockedAchievements([], {}, { owaspCorrect: 0, authCorrect: 0 });
    expect(count).toBe(0);
  });

  it('should count correctly for partial progress', () => {
    const count = countUnlockedAchievements(
      ['owasp', 'sql-injection'],
      { owasp: 80 },
      { owaspCorrect: 5, authCorrect: 3 }
    );
    expect(count).toBeGreaterThanOrEqual(2); // first-steps + at least sql-master
  });

  it('should count many achievements for full completion', () => {
    const allModuleIds = modules.map((m) => m.id);
    const allScores: Record<string, number> = {};
    for (let i = 0; i < 10; i++) allScores[`cat${i}`] = 100;
    const count = countUnlockedAchievements(
      allModuleIds,
      allScores,
      { owaspCorrect: 11, authCorrect: 8 }
    );
    // Should unlock at least a reasonable number of achievements
    expect(count).toBeGreaterThanOrEqual(5);
  });
});
