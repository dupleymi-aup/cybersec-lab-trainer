import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, requireRole } from '@/lib/api-middleware';
import type { Prisma } from '@prisma/client';

const CATEGORY_NAMES: Record<string, string> = {
  sql: 'SQL-инъекции',
  xss: 'XSS-атаки',
  csrf: 'CSRF-атаки',
  auth: 'Аутентификация',
  general: 'Общие',
  owasp: 'OWASP Top 10',
  coding: 'Безопасное кодирование',
  network: 'Сети',
  social: 'Социальная инженерия',
};

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const groupId = searchParams.get('groupId');

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const userFilter: Prisma.UserWhereInput = { role: 'student' };
  if (groupId) userFilter.group = groupId;

  const students = await prisma.user.findMany({
    where: userFilter,
    select: { id: true, fullName: true },
  });

  const studentIds = students.map((s) => s.id);
  const studentNameMap = new Map(students.map((s) => [s.id, s.fullName]));

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId: { in: studentIds }, attemptedAt: { gte: since } },
    select: { userId: true, quizId: true, category: true, correct: true, attemptedAt: true },
    orderBy: { attemptedAt: 'asc' },
  });

  const quizResults = await prisma.quizResult.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, quizId: true, percentage: true, score: true, total: true, updatedAt: true },
  });

  // Group attempts by (userId, quizId) to calculate session durations
  const sessionMap = new Map<string, { userId: string; quizId: string; category: string; attempts: Array<{ userId: string; quizId: string; category: string; correct: boolean; attemptedAt: Date }> }>();
  for (const attempt of quizAttempts) {
    const key = `${attempt.userId}-${attempt.quizId}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, { userId: attempt.userId, quizId: attempt.quizId, category: attempt.category, attempts: [] });
    }
    const session = sessionMap.get(key);
    if (session) {
      session.attempts.push(attempt);
    }
  }

  // Calculate duration per session (first attempt to last attempt timestamp)
  const sessionsWithDuration: Array<{
    userId: string; quizId: string; category: string; duration: number;
    score: number; percentage: number; questionCount: number;
  }> = [];
  for (const [, session] of sessionMap) {
    if (session.attempts.length < 2) continue;
    const firstTime = session.attempts[0].attemptedAt.getTime();
    const lastTime = session.attempts[session.attempts.length - 1].attemptedAt.getTime();
    const durationSec = (lastTime - firstTime) / 1000;
    if (durationSec <= 0 || durationSec > 3600) continue; // Skip unreasonable durations

    const correctCount = session.attempts.filter((a) => a.correct).length;
    const percentage = Math.round((correctCount / session.attempts.length) * 100);

    // Get quiz result score if available
    const qr = quizResults.find((r) => r.userId === session.userId && r.quizId === session.quizId);

    sessionsWithDuration.push({
      userId: session.userId,
      quizId: session.quizId,
      category: session.category,
      duration: durationSec,
      score: qr ? qr.score : correctCount,
      percentage,
      questionCount: session.attempts.length,
    });
  }

  // Category timing
  const categoryTimingMap = new Map<string, number[]>();
  for (const s of sessionsWithDuration) {
    if (!categoryTimingMap.has(s.category)) categoryTimingMap.set(s.category, []);
    const durations = categoryTimingMap.get(s.category);
    if (durations) {
      durations.push(s.duration);
    }
  }

  const categoryTiming = Array.from(categoryTimingMap.entries()).map(([cat, durations]) => {
    const sorted = [...durations].sort((a, b) => a - b);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    return {
      category: CATEGORY_NAMES[cat] || cat,
      avgDuration: Math.round(avg * 10) / 10,
      medianDuration: Math.round(median * 10) / 10,
      attemptCount: durations.length,
    };
  });

  // Rushed quizzes (completed in under 30 seconds)
  const rushedThreshold = 30;
  const rushedQuizzes = sessionsWithDuration
    .filter((s) => s.duration < rushedThreshold)
    .map((s) => ({
      userId: s.userId,
      fullName: studentNameMap.get(s.userId) || 'Unknown',
      category: CATEGORY_NAMES[s.category] || s.category,
      duration: Math.round(s.duration * 10) / 10,
      score: s.score,
      percentage: s.percentage,
      questionCount: s.questionCount,
    }))
    .sort((a, b) => a.duration - b.duration)
    .slice(0, 50);

  // Time vs performance buckets
  const durationBuckets = [
    { range: '< 15 сек', min: 0, max: 15, percents: [] as number[] },
    { range: '15-30 сек', min: 15, max: 30, percents: [] as number[] },
    { range: '30-60 сек', min: 30, max: 60, percents: [] as number[] },
    { range: '1-3 мин', min: 60, max: 180, percents: [] as number[] },
    { range: '3-5 мин', min: 180, max: 300, percents: [] as number[] },
    { range: '5-10 мин', min: 300, max: 600, percents: [] as number[] },
    { range: '> 10 мин', min: 600, max: 3600, percents: [] as number[] },
  ];
  for (const s of sessionsWithDuration) {
    for (const b of durationBuckets) {
      if (s.duration >= b.min && s.duration < b.max) {
        b.percents.push(s.percentage);
        break;
      }
    }
  }
  const timeVsPerformance = durationBuckets
    .filter((b) => b.percents.length > 0)
    .map((b) => ({
      durationBucket: b.range,
      avgPercentage: Math.round(b.percents.reduce((a, x) => a + x, 0) / b.percents.length * 10) / 10,
      attemptCount: b.percents.length,
    }));

  // Hourly performance
  const hourlyMap = new Map<number, { total: number; count: number }>();
  for (const s of sessionsWithDuration) {
    const firstAttempt = sessionsWithDuration.find((a) => a.userId === s.userId && a.quizId === s.quizId);
    if (!firstAttempt) continue;
    // Use the quiz result updatedAt for the hour
    const qr = quizResults.find((r) => r.userId === s.userId && r.quizId === s.quizId);
    if (!qr) continue;
    const hour = qr.updatedAt.getHours();
    const existing = hourlyMap.get(hour) || { total: 0, count: 0 };
    existing.total += s.percentage;
    existing.count++;
    hourlyMap.set(hour, existing);
  }
  const hourlyPerformance = Array.from(hourlyMap.entries())
    .map(([hour, data]) => ({
      hour,
      avgPercentage: Math.round((data.total / data.count) * 10) / 10,
      attemptCount: data.count,
    }))
    .sort((a, b) => a.hour - b.hour);

  // Weekday vs weekend
  const weekdayData: number[] = [];
  const weekendData: number[] = [];
  const weekdayDurations: number[] = [];
  const weekendDurations: number[] = [];
  for (const qr of quizResults) {
    const dayOfWeek = qr.updatedAt.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) {
      weekendData.push(qr.percentage);
      weekendDurations.push(0); // We don't have duration per quiz result
    } else {
      weekdayData.push(qr.percentage);
      weekdayDurations.push(0);
    }
  }
  // Use session durations for the avgDuration calculation
  const weekdaySessions = sessionsWithDuration.filter((s) => {
    const qr = quizResults.find((r) => r.userId === s.userId && r.quizId === s.quizId);
    return qr && qr.updatedAt.getDay() !== 0 && qr.updatedAt.getDay() !== 6;
  });
  const weekendSessions = sessionsWithDuration.filter((s) => {
    const qr = quizResults.find((r) => r.userId === s.userId && r.quizId === s.quizId);
    return qr && (qr.updatedAt.getDay() === 0 || qr.updatedAt.getDay() === 6);
  });

  const weekdayVsWeekend = [
    {
      dayType: 'weekday' as const,
      avgPercentage: weekdayData.length > 0 ? Math.round(weekdayData.reduce((a, b) => a + b, 0) / weekdayData.length * 10) / 10 : 0,
      attemptCount: weekdayData.length,
      avgDuration: weekdaySessions.length > 0 ? Math.round(weekdaySessions.reduce((a, s) => a + s.duration, 0) / weekdaySessions.length * 10) / 10 : 0,
    },
    {
      dayType: 'weekend' as const,
      avgPercentage: weekendData.length > 0 ? Math.round(weekendData.reduce((a, b) => a + b, 0) / weekendData.length * 10) / 10 : 0,
      attemptCount: weekendData.length,
      avgDuration: weekendSessions.length > 0 ? Math.round(weekendSessions.reduce((a, s) => a + s.duration, 0) / weekendSessions.length * 10) / 10 : 0,
    },
  ];

  return NextResponse.json({
    categoryTiming,
    rushedQuizzes,
    timeVsPerformance,
    hourlyPerformance,
    weekdayVsWeekend,
  });
}
