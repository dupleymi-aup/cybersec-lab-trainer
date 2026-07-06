/**
 * XP and Level system for CyberSec Lab gamification
 *
 * Level ranges:
 *   1-10:  Junior (0-999 XP)
 *   11-20: Mid   (1000-4999 XP)
 *   21-35: Senior (5000-14999 XP)
 *   36-50: Lead  (15000+ XP)
 *
 * XP sources:
 *   Complete module:     100 XP
 *   Pass quiz (≥60%):    50 XP
 *   Perfect quiz (100%): 100 XP
 *   Submit assignment:   25 XP
 *   Assignment graded:   50 XP (if passed)
 *   Daily login streak:  10 XP per day (bonus multiplier for streaks)
 */

// XP required for each level (cumulative)
const XP_TABLE: number[] = [
  0, // level 1 (start)
  50, // level 2
  100, // level 3
  200, // level 4
  350, // level 5
  500, // level 6
  700, // level 7
  900, // level 8
  1200, // level 9
  1500, // level 10  (Junior → Mid threshold starts accumulating)
  2000, // level 11
  2500, // level 12
  3000, // level 13
  3500, // level 14
  4000, // level 15
  4500, // level 16
  5000, // level 17
  6000, // level 18
  7000, // level 19
  8000, // level 20
  9500, // level 21  (Mid → Senior)
  11000, // level 22
  12500, // level 23
  14000, // level 24
  15500, // level 25
  17000, // level 26
  18500, // level 27
  20000, // level 28
  22000, // level 29
  24000, // level 30
  26000, // level 31
  28000, // level 32
  30000, // level 33
  33000, // level 34
  36000, // level 35
  40000, // level 36  (Senior → Lead)
  45000, // level 37
  50000, // level 38
  55000, // level 39
  60000, // level 40
  66000, // level 41
  72000, // level 42
  78000, // level 43
  84000, // level 44
  90000, // level 45
  97000, // level 46
  104000, // level 47
  111000, // level 48
  118000, // level 49
  125000, // level 50 (max)
];

const MAX_LEVEL = 50;

export type UserRank = 'Junior' | 'Mid' | 'Senior' | 'Lead';

export function getRank(level: number): UserRank {
  if (level <= 10) return 'Junior';
  if (level <= 20) return 'Mid';
  if (level <= 35) return 'Senior';
  return 'Lead';
}

export function getLevel(xp: number): { level: number; rank: UserRank } {
  let level = 1;
  for (let i = 1; i < XP_TABLE.length; i++) {
    if (xp >= XP_TABLE[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return {
    level: Math.min(level, MAX_LEVEL),
    rank: getRank(Math.min(level, MAX_LEVEL)),
  };
}

export function getXpForNextLevel(xp: number): {
  current: number;
  needed: number;
  nextLevel: number;
} {
  const { level } = getLevel(xp);
  if (level >= MAX_LEVEL) {
    return { current: xp, needed: 0, nextLevel: MAX_LEVEL };
  }
  const currentLevelXp = XP_TABLE[level - 1] ?? 0;
  const nextLevelXp = XP_TABLE[level] ?? XP_TABLE[XP_TABLE.length - 1];
  return {
    current: xp - currentLevelXp,
    needed: nextLevelXp - xp,
    nextLevel: level + 1,
  };
}

// XP reward constants
export const XP_REWARDS = {
  moduleComplete: 100,
  quizPass: 50,
  quizPerfect: 100,
  assignmentSubmit: 25,
  assignmentPassed: 50,
  dailyLogin: 10,
  streakBonus: 5, // extra XP per streak day
} as const;

export function calculateStreakBonus(days: number): number {
  return XP_REWARDS.dailyLogin + days * XP_REWARDS.streakBonus;
}
