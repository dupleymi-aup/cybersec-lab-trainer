import { describe, it, expect } from 'vitest';
import {
  getLevel,
  getRank,
  getXpForNextLevel,
  XP_REWARDS,
  calculateStreakBonus,
} from '@/lib/xp-utils';

describe('getLevel', () => {
  it('should return level 1 for 0 XP', () => {
    const result = getLevel(0);
    expect(result.level).toBe(1);
    expect(result.rank).toBe('Junior');
  });

  it('should return level 2 for 50 XP', () => {
    const result = getLevel(50);
    expect(result.level).toBe(2);
  });

  it('should return level 11 (Mid) for 2000 XP', () => {
    const result = getLevel(2000);
    expect(result.level).toBe(11);
    expect(result.rank).toBe('Mid');
  });

  it('should return level 21 (Senior) for 9500 XP', () => {
    const result = getLevel(9500);
    expect(result.level).toBe(21);
    expect(result.rank).toBe('Senior');
  });

  it('should return level 36 (Lead) for 40000 XP', () => {
    const result = getLevel(40000);
    expect(result.level).toBe(36);
    expect(result.rank).toBe('Lead');
  });

  it('should cap at max level 50', () => {
    const result = getLevel(999999);
    expect(result.level).toBe(50);
    expect(result.rank).toBe('Lead');
  });

  it('should be monotonically increasing', () => {
    let prevLevel = 0;
    for (let xp = 0; xp < 130000; xp += 1000) {
      const { level } = getLevel(xp);
      expect(level).toBeGreaterThanOrEqual(prevLevel);
      prevLevel = level;
    }
  });
});

describe('getRank', () => {
  it('should return Junior for levels 1-10', () => {
    for (let level = 1; level <= 10; level++) {
      expect(getRank(level)).toBe('Junior');
    }
  });

  it('should return Mid for levels 11-20', () => {
    for (let level = 11; level <= 20; level++) {
      expect(getRank(level)).toBe('Mid');
    }
  });

  it('should return Senior for levels 21-35', () => {
    for (let level = 21; level <= 35; level++) {
      expect(getRank(level)).toBe('Senior');
    }
  });

  it('should return Lead for levels 36-50', () => {
    for (let level = 36; level <= 50; level++) {
      expect(getRank(level)).toBe('Lead');
    }
  });
});

describe('getXpForNextLevel', () => {
  it('should return progress at start', () => {
    const result = getXpForNextLevel(0);
    expect(result.current).toBe(0);
    expect(result.nextLevel).toBe(2);
  });

  it('should return 0 needed at max level', () => {
    const result = getXpForNextLevel(999999);
    expect(result.needed).toBe(0);
    expect(result.nextLevel).toBe(50);
  });

  it('should calculate current XP correctly', () => {
    const result = getXpForNextLevel(75);
    expect(result.current).toBe(25); // 75 - 50 (level 2 threshold)
    expect(result.nextLevel).toBe(3);
  });
});

describe('XP_REWARDS', () => {
  it('should have expected reward values', () => {
    expect(XP_REWARDS.moduleComplete).toBe(100);
    expect(XP_REWARDS.quizPass).toBe(50);
    expect(XP_REWARDS.quizPerfect).toBe(100);
    expect(XP_REWARDS.assignmentSubmit).toBe(25);
    expect(XP_REWARDS.assignmentPassed).toBe(50);
    expect(XP_REWARDS.dailyLogin).toBe(10);
    expect(XP_REWARDS.streakBonus).toBe(5);
  });
});

describe('calculateStreakBonus', () => {
  it('should return base + 1 * bonus for day 1', () => {
    expect(calculateStreakBonus(1)).toBe(15); // 10 + 1*5
  });

  it('should increase with streak days', () => {
    expect(calculateStreakBonus(5)).toBe(35); // 10 + 5*5
    expect(calculateStreakBonus(10)).toBe(60); // 10 + 10*5
  });

  it('should return base for 0 days', () => {
    expect(calculateStreakBonus(0)).toBe(10);
  });
});
