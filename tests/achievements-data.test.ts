import { describe, it, expect } from 'vitest';
import { isAchievementUnlocked, achievements } from '@/lib/data/achievements-data';

const emptyModules: string[] = [];
const emptyOwasp: string[] = [];
const emptyScores: Record<string, number> = {};

describe('isAchievementUnlocked', () => {
  describe('module-based achievements', () => {
    it('first-steps: unlocks with 1+ completed modules', () => {
      expect(isAchievementUnlocked('first-steps', ['owasp'], emptyOwasp, emptyScores)).toBe(true);
    });
    it('first-steps: locked with 0 modules', () => {
      expect(isAchievementUnlocked('first-steps', emptyModules, emptyOwasp, emptyScores)).toBe(false);
    });
    it('sql-master: unlocks with sql-injection', () => {
      expect(isAchievementUnlocked('sql-master', ['sql-injection'], emptyOwasp, emptyScores)).toBe(true);
    });
    it('sql-master: locked without sql-injection', () => {
      expect(isAchievementUnlocked('sql-master', ['xss'], emptyOwasp, emptyScores)).toBe(false);
    });
    it('xss-hunter: unlocks with xss', () => {
      expect(isAchievementUnlocked('xss-hunter', ['xss'], emptyOwasp, emptyScores)).toBe(true);
    });
    it('auth-expert: unlocks with auth', () => {
      expect(isAchievementUnlocked('auth-expert', ['auth'], emptyOwasp, emptyScores)).toBe(true);
    });
    it('code-reviewer: unlocks with secure-coding', () => {
      expect(isAchievementUnlocked('code-reviewer', ['secure-coding'], emptyOwasp, emptyScores)).toBe(true);
    });
    it('crypto-ninja: unlocks with tools', () => {
      expect(isAchievementUnlocked('crypto-ninja', ['tools'], emptyOwasp, emptyScores)).toBe(true);
    });
    it('csrf-shield: unlocks with csrf', () => {
      expect(isAchievementUnlocked('csrf-shield', ['csrf'], emptyOwasp, emptyScores)).toBe(true);
    });
    it('headers-guard: unlocks with security-headers', () => {
      expect(isAchievementUnlocked('headers-guard', ['security-headers'], emptyOwasp, emptyScores)).toBe(true);
    });
    it('api-guardian: unlocks with api-security', () => {
      expect(isAchievementUnlocked('api-guardian', ['api-security'], emptyOwasp, emptyScores)).toBe(true);
    });
  });

  describe('OWASP-based achievements', () => {
    it('security-guard: unlocks with 10+ owasp items', () => {
      const items = Array.from({ length: 10 }, (_, i) => `item-${i}`);
      expect(isAchievementUnlocked('security-guard', emptyModules, items, emptyScores)).toBe(true);
    });
    it('security-guard: locked with 9 owasp items', () => {
      const items = Array.from({ length: 9 }, (_, i) => `item-${i}`);
      expect(isAchievementUnlocked('security-guard', emptyModules, items, emptyScores)).toBe(false);
    });
    it('owasp-half: unlocks with 5+ owasp items', () => {
      const items = Array.from({ length: 5 }, (_, i) => `item-${i}`);
      expect(isAchievementUnlocked('owasp-half', emptyModules, items, emptyScores)).toBe(true);
    });
    it('owasp-half: locked with 4 owasp items', () => {
      const items = Array.from({ length: 4 }, (_, i) => `item-${i}`);
      expect(isAchievementUnlocked('owasp-half', emptyModules, items, emptyScores)).toBe(false);
    });
  });

  describe('quiz-based achievements', () => {
    it('quiz-master: unlocks with 3+ quiz categories', () => {
      expect(isAchievementUnlocked('quiz-master', emptyModules, emptyOwasp, { a: 80, b: 85, c: 90 })).toBe(true);
    });
    it('quiz-master: locked with 2 categories', () => {
      expect(isAchievementUnlocked('quiz-master', emptyModules, emptyOwasp, { a: 80, b: 85 })).toBe(false);
    });
    it('quiz-perfect: unlocks with 100% score', () => {
      expect(isAchievementUnlocked('quiz-perfect', emptyModules, emptyOwasp, { a: 100 })).toBe(true);
    });
    it('quiz-perfect: locked without 100%', () => {
      expect(isAchievementUnlocked('quiz-perfect', emptyModules, emptyOwasp, { a: 99 })).toBe(false);
    });
    it('quiz-all: unlocks with 9+ categories', () => {
      const scores: Record<string, number> = {};
      for (let i = 0; i < 9; i++) scores[`c${i}`] = 50;
      expect(isAchievementUnlocked('quiz-all', emptyModules, emptyOwasp, scores)).toBe(true);
    });
    it('quiz-all: locked with 8 categories', () => {
      const scores: Record<string, number> = {};
      for (let i = 0; i < 8; i++) scores[`c${i}`] = 50;
      expect(isAchievementUnlocked('quiz-all', emptyModules, emptyOwasp, scores)).toBe(false);
    });
    it('crypto-explorer: unlocks with tools score >= 50', () => {
      expect(isAchievementUnlocked('crypto-explorer', emptyModules, emptyOwasp, { tools: 50 })).toBe(true);
    });
    it('crypto-explorer: locked with tools score < 50', () => {
      expect(isAchievementUnlocked('crypto-explorer', emptyModules, emptyOwasp, { tools: 49 })).toBe(false);
    });
    it('coding-master: unlocks with 5+ scores >= 80', () => {
      const scores = { a: 80, b: 85, c: 90, d: 82, e: 88 };
      expect(isAchievementUnlocked('coding-master', emptyModules, emptyOwasp, scores)).toBe(true);
    });
    it('network-ninja: unlocks with network score >= 80', () => {
      expect(isAchievementUnlocked('network-ninja', emptyModules, emptyOwasp, { network: 80 })).toBe(true);
    });
    it('social-engineer: unlocks with social score >= 80', () => {
      expect(isAchievementUnlocked('social-engineer', emptyModules, emptyOwasp, { social: 80 })).toBe(true);
    });
    it('all-headers-correct: unlocks with headers score === 100', () => {
      expect(isAchievementUnlocked('all-headers-correct', emptyModules, emptyOwasp, { headers: 100 })).toBe(true);
    });
    it('all-headers-correct: locked with headers score 99', () => {
      expect(isAchievementUnlocked('all-headers-correct', emptyModules, emptyOwasp, { headers: 99 })).toBe(false);
    });
    it('idor-detective: unlocks with idor score >= 80', () => {
      expect(isAchievementUnlocked('idor-detective', emptyModules, emptyOwasp, { idor: 80 })).toBe(true);
    });
    it('ssrf-hunter: unlocks with ssrf score >= 80', () => {
      expect(isAchievementUnlocked('ssrf-hunter', emptyModules, emptyOwasp, { ssrf: 80 })).toBe(true);
    });
  });

  describe('secure coding achievements', () => {
    it('coding-pro: unlocks with 20+ correct', () => {
      expect(isAchievementUnlocked('coding-pro', emptyModules, emptyOwasp, emptyScores, 20)).toBe(true);
    });
    it('coding-pro: locked with 19 correct', () => {
      expect(isAchievementUnlocked('coding-pro', emptyModules, emptyOwasp, emptyScores, 19)).toBe(false);
    });
  });

  describe('full-completion', () => {
    it('unlocks when all modules completed', () => {
      const allModules = ['owasp', 'sql-injection', 'xss', 'csrf', 'auth', 'secure-coding',
        'tools', 'security-headers', 'idor', 'ssrf', 'api-security', 'phishing-analyzer'];
      expect(isAchievementUnlocked('full-completion', allModules, emptyOwasp, emptyScores)).toBe(true);
    });
  });

  describe('unknown achievement', () => {
    it('returns false for unknown id', () => {
      expect(isAchievementUnlocked('nonexistent', emptyModules, emptyOwasp, emptyScores)).toBe(false);
    });
  });
});

describe('achievements data', () => {
  it('should export a non-empty array of achievements', () => {
    expect(Array.isArray(achievements)).toBe(true);
    expect(achievements.length).toBeGreaterThan(0);
  });

  it('each achievement should have required fields', () => {
    for (const a of achievements) {
      expect(a.id).toBeTruthy();
      expect(a.title).toBeTruthy();
      expect(a.description).toBeTruthy();
    }
  });
});
