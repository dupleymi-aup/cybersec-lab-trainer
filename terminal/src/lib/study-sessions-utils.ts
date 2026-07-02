/**
 * Study Sessions utilities - track learning time and activity
 */

import { prisma } from './db';

export interface StudySession {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  durationMs: number;
  pageType: string;
  xpEarned: number;
  createdAt: Date;
}

export interface CreateSessionInput {
  userId: string;
  date: string; // YYYY-MM-DD
  durationMs: number;
  pageType: string;
  xpEarned?: number;
}

export interface DailyBreakdown {
  date: string; // YYYY-MM-DD
  minutes: number;
  sessions: number;
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD
  totalMinutes: number;
  sessionsCount: number;
  dailyBreakdown: DailyBreakdown[];
}

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  todayMinutes: number;
  todaySessions: number;
  isActive: boolean;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapData {
  days: HeatmapDay[];
  weeks: number;
  startDate: string;
  endDate: string;
}

const MIN_MS = 60_000;
const XP_PER_5_MIN = 1;
const MAX_SESSION_XP = 10;

/**
 * Calculate XP earned from study session duration
 */
export function calculateSessionXP(durationMs: number): number {
  const minutes = Math.floor(durationMs / MIN_MS);
  const xp = Math.floor(minutes / 5) * XP_PER_5_MIN;
  return Math.min(xp, MAX_SESSION_XP);
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < MIN_MS) return '< 1m';
  const totalMinutes = Math.floor(ms / MIN_MS);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Convert date to YYYY-MM-DD string in local timezone
 */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
function fromDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if a date string is today
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isToday(dateStr: string): boolean {
  const sessionDate = new Date(dateStr);
  const today = new Date();
  return (
    sessionDate.getFullYear() === today.getFullYear() &&
    sessionDate.getMonth() === today.getMonth() &&
    sessionDate.getDate() === today.getDate()
  );
}

/**
 * Create a new study session
 */
export async function createSession(input: CreateSessionInput): Promise<StudySession> {
  const xpEarned = input.xpEarned ?? calculateSessionXP(input.durationMs);
  
  const session = await prisma.studySession.create({
    data: {
      userId: input.userId,
      date: input.date,
      durationMs: input.durationMs,
      pageType: input.pageType,
      xpEarned,
    },
  });

  return session;
}

/**
 * Get sessions for a specific date
 */
export async function getSessionsByDate(userId: string, date: string): Promise<StudySession[]> {
  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      date,
    },
  });

  return sessions;
}

/**
 * Get today's sessions
 */
export async function getTodaySessions(userId: string): Promise<StudySession[]> {
  const today = toDateString(new Date());
  return getSessionsByDate(userId, today);
}

/**
 * Get today's total study time in milliseconds
 */
export async function getTodayTotalMs(userId: string): Promise<number> {
  const sessions = await getTodaySessions(userId);
  return sessions.reduce((sum, s) => sum + s.durationMs, 0);
}

/**
 * Get total study time across all sessions
 */
export async function getTotalStudyTimeMs(userId: string): Promise<number> {
  const allSessions = await prisma.studySession.findMany({
    where: { userId },
  });
  
  return allSessions.reduce((sum, s) => sum + s.durationMs, 0);
}

/**
 * Get weekly stats
 */
export async function getWeeklyStats(
  userId: string,
  weeksBack = 1
): Promise<WeeklyStats[]> {
  const allSessions = await prisma.studySession.findMany({
    where: { userId },
  });

  const results: WeeklyStats[] = [];
  const now = new Date();

  for (let w = 0; w < weeksBack; w++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);

    const weekSessions = allSessions.filter((s) => {
      const d = new Date(s.date);
      return d >= weekStart && d <= weekEnd;
    });

    const dailyMap = new Map<string, DailyBreakdown>();
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + d);
      const key = toDateString(date);
      dailyMap.set(key, { date: key, minutes: 0, sessions: 0 });
    }

    for (const session of weekSessions) {
      const dayKey = toDateString(new Date(session.date));
      const entry = dailyMap.get(dayKey);
      if (entry) {
        entry.minutes += Math.floor(session.durationMs / MIN_MS);
        entry.sessions += 1;
      }
    }

    const dailyBreakdown = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const totalMinutes = dailyBreakdown.reduce((sum, d) => sum + d.minutes, 0);

    results.push({
      weekStart: toDateString(weekStart),
      totalMinutes,
      sessionsCount: weekSessions.length,
      dailyBreakdown,
    });
  }

  return results;
}

/**
 * Get streak information
 */
export async function getStreakInfo(userId: string): Promise<StreakInfo> {
  const allSessions = await prisma.studySession.findMany({
    where: { userId },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateString(today);

  const todayMinutes = await getTodayTotalMs(userId);
  const todaySessions = (await getTodaySessions(userId)).length;

  // Get all unique study dates sorted
  const studyDates = Array.from(new Set(allSessions.map((s) => s.date))).sort().reverse();

  if (studyDates.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      todayMinutes: 0,
      todaySessions: 0,
      isActive: false,
    };
  }

  // Check if streak is active
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateString(yesterday);
  const isActive = studyDates[0] === todayStr || studyDates[0] === yesterdayStr;

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(today);

  if (studyDates[0] !== todayStr) {
    checkDate = new Date(yesterday);
  }

  for (const dateStr of studyDates) {
    const expectedStr = toDateString(checkDate);
    if (dateStr === expectedStr) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr < expectedStr) {
      break;
    }
  }

  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of [...studyDates].reverse()) {
    const currentDate = fromDateString(dateStr);
    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);
    prevDate = currentDate;
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    todayMinutes: Math.floor(todayMinutes / MIN_MS),
    todaySessions,
    isActive,
  };
}

/**
 * Generate heatmap data
 */
export async function getHeatmapData(userId: string, weeksBack = 26): Promise<HeatmapData> {
  const allSessions = await prisma.studySession.findMany({
    where: { userId },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - weeksBack * 7);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  const endDate = new Date(now);

  // Build minutes map
  const minutesMap = new Map<string, number>();
  for (const session of allSessions) {
    const dateStr = toDateString(new Date(session.date));
    const existing = minutesMap.get(dateStr) || 0;
    minutesMap.set(dateStr, existing + Math.floor(session.durationMs / MIN_MS));
  }

  // Generate all days
  const days: HeatmapDay[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = toDateString(current);
    const minutes = minutesMap.get(dateStr) || 0;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (minutes > 0) level = 1;
    if (minutes >= 30) level = 2;
    if (minutes >= 60) level = 3;
    if (minutes >= 120) level = 4;

    days.push({ date: dateStr, minutes, level });
    current.setDate(current.getDate() + 1);
  }

  return {
    days,
    weeks: weeksBack,
    startDate: toDateString(startDate),
    endDate: toDateString(endDate),
  };
}
