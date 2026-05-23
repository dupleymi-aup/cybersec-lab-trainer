import { describe, it, expect } from 'vitest';
import { getAchievementStatus, countUnlockedAchievements } from '@/lib/achievement-utils';

describe('getAchievementStatus', () => {
  const emptyProgress = { completedModules: [], quizScores: {}, challengeStats: undefined };

  it('should return false for first-steps with no modules', () => {
    expect(getAchievementStatus('first-steps', [], {}, undefined)).toBe(false);
  });

  it('should unlock first-steps when module completed', () => {
    expect(getAchievementStatus('first-steps', ['owasp'], {}, undefined)).toBe(true);
  });

  it('should unlock sql-master when sql-injection completed', () => {
    expect(getAchievementStatus('sql-master', ['sql-injection'], {}, undefined)).toBe(true);
  });

  it('should not unlock sql-master without sql module', () => {
    expect(getAchievementStatus('sql-master', ['xss'], {}, undefined)).toBe(false);
  });

  it('should unlock quiz-master with 3+ quiz categories', () => {
    const quizScores = { sql: 80, xss: 75, csrf: 90 };
    expect(getAchievementStatus('quiz-master', [], quizScores, undefined)).toBe(true);
  });

  it('should unlock quiz-perfect with 100% score', () => {
    const quizScores = { sql: 100 };
    expect(getAchievementStatus('quiz-perfect', [], quizScores, undefined)).toBe(true);
  });

  it('should unlock quiz-streak with 3+ high scores (>=80)', () => {
    const quizScores = { sql: 85, xss: 90, csrf: 80 };
    expect(getAchievementStatus('quiz-streak', [], quizScores, undefined)).toBe(true);
  });

  it('should unlock owasp-challenger with 11+ correct', () => {
    const challengeStats = { owaspCorrect: 11, authCorrect: 5 };
    expect(getAchievementStatus('owasp-challenger', [], {}, challengeStats)).toBe(true);
  });

  it('should unlock perfect-challenge with perfect score', () => {
    const challengeStats = { owaspCorrect: 11, authCorrect: 8 };
    expect(getAchievementStatus('perfect-challenge', [], {}, challengeStats)).toBe(true);
  });

  it('should unlock full-completion when 8+ modules done (matching achievement-utils logic)', () => {
    // achievement-utils checks completedModules.length >= modules.length
    // modules.length is > 8, so we need enough modules
    const allModules = ['owasp', 'sql-injection', 'xss', 'csrf', 'auth', 'secure-coding', 'tools', 'security-headers',
      'api-security', 'network-security', 'idior', 'ssrf'];
    // The actual check in achievement-utils is: completedModules.length >= modules.length
    // Since we test getAchievementStatus which uses >= 8, this should pass
    expect(getAchievementStatus('full-completion', allModules, {}, undefined)).toBe(true);
  });
});

describe('countUnlockedAchievements', () => {
  it('should return 0 for empty progress', () => {
    const count = countUnlockedAchievements([], {}, undefined);
    expect(count).toBe(0);
  });

  it('should count achievements with some progress', () => {
    const completedModules = ['owasp', 'sql-injection'];
    const quizScores = { sql: 100, xss: 85 };
    const count = countUnlockedAchievements(completedModules, quizScores, undefined);
    expect(count).toBeGreaterThan(2);
  });

  it('should count more achievements with full progress', () => {
    const allModules = ['owasp', 'sql-injection', 'xss', 'csrf', 'auth', 'secure-coding', 'tools', 'security-headers',
      'api-security', 'network-security'];
    const quizScores = { sql: 100, xss: 90, csrf: 85, auth: 80, owasp: 95, coding: 70, network: 75, social: 80 };
    const challengeStats = { owaspCorrect: 11, authCorrect: 8 };
    const count = countUnlockedAchievements(allModules, quizScores, challengeStats);
    // achievement-utils has simplified logic — at least 9 should unlock
    expect(count).toBeGreaterThanOrEqual(9);
  });
});
