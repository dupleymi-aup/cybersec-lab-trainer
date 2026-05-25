import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  const { searchParams } = new URL(request.url);
  const groupBy = searchParams.get('groupBy'); // 'group' | 'course' | 'university'

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Current period (last 30 days)
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    select: { id: true, group: true, course: true, university: true, lastLoginAt: true },
  });

  const studentIds = students.map((s) => s.id);
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.lastLoginAt && s.lastLoginAt >= thirtyDaysAgo).length;
  const activePercentage = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 10000) / 100 : 0;

  // Progress data
  const progressRecords = await prisma.progress.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, moduleId: true, completed: true, score: true },
  });

  // Quiz results
  const quizResults = await prisma.quizResult.findMany({
    where: { userId: { in: studentIds } },
    select: { userId: true, percentage: true },
  });

  // Login activity in last 30 days
  const loginActivity = await prisma.loginActivity.count({
    where: {
      userId: { in: studentIds },
      timestamp: { gte: thirtyDaysAgo },
    },
  });

  // Compute avg completion rate (modules completed / 8 total modules)
  const totalModules = 8;
  const perStudentModules = new Map<string, number>();
  for (const p of progressRecords) {
    if (p.completed) {
      perStudentModules.set(p.userId, (perStudentModules.get(p.userId) || 0) + 1);
    }
  }
  let totalCompletedModules = 0;
  for (const count of perStudentModules.values()) {
    totalCompletedModules += count;
  }
  const avgCompletionRate = totalStudents > 0
    ? Math.round((totalCompletedModules / (totalStudents * totalModules)) * 10000) / 100
    : 0;

  // Avg quiz score
  const avgQuizScore = quizResults.length > 0
    ? Math.round((quizResults.reduce((sum, q) => sum + q.percentage, 0) / quizResults.length) * 100) / 100
    : 0;

  const totalQuizAttempts = quizResults.length;

  // Previous period (30-60 days ago)
  const prevStudents = students.filter((s) => s.lastLoginAt && s.lastLoginAt >= sixtyDaysAgo && s.lastLoginAt < thirtyDaysAgo);
  const prevActiveStudents = prevStudents.length;
  const prevActivePercentage = totalStudents > 0 ? Math.round((prevActiveStudents / totalStudents) * 10000) / 100 : 0;

  // Previous period progress
  const prevProgress = await prisma.progress.findMany({
    where: {
      userId: { in: studentIds },
      updatedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
    select: { userId: true, completed: true },
  });

  // Previous period quiz results
  const prevQuizResults = await prisma.quizResult.findMany({
    where: {
      userId: { in: studentIds },
      updatedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
    select: { percentage: true },
  });

  // Previous period login activity
  const prevLoginActivity = await prisma.loginActivity.count({
    where: {
      userId: { in: studentIds },
      timestamp: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
  });

  // Previous period completion rate
  const prevPerStudentModules = new Map<string, number>();
  for (const p of prevProgress) {
    if (p.completed) {
      prevPerStudentModules.set(p.userId, (prevPerStudentModules.get(p.userId) || 0) + 1);
    }
  }
  let prevTotalCompleted = 0;
  for (const count of prevPerStudentModules.values()) {
    prevTotalCompleted += count;
  }
  const prevAvgCompletionRate = totalStudents > 0
    ? Math.round((prevTotalCompleted / (totalStudents * totalModules)) * 10000) / 100
    : 0;

  const prevAvgQuizScore = prevQuizResults.length > 0
    ? Math.round((prevQuizResults.reduce((sum, q) => sum + q.percentage, 0) / prevQuizResults.length) * 100) / 100
    : 0;

  function trendIndicator(current: number, previous: number): 'up' | 'down' | 'stable' {
    const diff = current - previous;
    if (diff > 2) return 'up';
    if (diff < -2) return 'down';
    return 'stable';
  }

  const current = {
    totalStudents,
    activeStudents,
    activePercentage,
    avgCompletionRate,
    avgQuizScore,
    totalQuizAttempts,
    totalLoginAttempts: loginActivity,
  };

  const previous = {
    totalStudents,
    activeStudents: prevActiveStudents,
    activePercentage: prevActivePercentage,
    avgCompletionRate: prevAvgCompletionRate,
    avgQuizScore: prevAvgQuizScore,
    totalQuizAttempts: prevQuizResults.length,
    totalLoginAttempts: prevLoginActivity,
  };

  const trends = {
    activeStudents: trendIndicator(activePercentage, prevActivePercentage),
    avgCompletionRate: trendIndicator(avgCompletionRate, prevAvgCompletionRate),
    avgQuizScore: trendIndicator(avgQuizScore, prevAvgQuizScore),
    totalLoginAttempts: trendIndicator(loginActivity, prevLoginActivity),
  };

  // Optional groupBy aggregation
  let groupedData: Record<string, unknown> = {};

  if (groupBy === 'group' || groupBy === 'course' || groupBy === 'university') {
    const field = groupBy as 'group' | 'course' | 'university';
    const groups = new Map<string, { totalStudents: number; activeStudents: number; progressRecords: typeof progressRecords; quizResults: typeof quizResults }>();

    for (const s of students) {
      const key = s[field] || '(не указано)';
      if (!groups.has(key)) {
        groups.set(key, { totalStudents: 0, activeStudents: 0, progressRecords: [], quizResults: [] });
      }
      const g = groups.get(key);
      if (g) {
        g.totalStudents++;
        if (s.lastLoginAt && s.lastLoginAt >= thirtyDaysAgo) {
          g.activeStudents++;
        }
      }
    }

    for (const p of progressRecords) {
      const student = students.find((s) => s.id === p.userId);
      if (student) {
        const key = student[field] || '(не указано)';
        const g = groups.get(key);
        if (g) g.progressRecords.push(p);
      }
    }

    for (const q of quizResults) {
      const student = students.find((s) => s.id === q.userId);
      if (student) {
        const key = student[field] || '(не указано)';
        const g = groups.get(key);
        if (g) g.quizResults.push(q);
      }
    }

    const byField: Record<string, unknown>[] = [];
    for (const [key, g] of groups.entries()) {
      const completedCount = g.progressRecords.filter((p) => p.completed).length;
      const groupAvgCompletion = g.totalStudents > 0
        ? Math.round((completedCount / (g.totalStudents * totalModules)) * 10000) / 100
        : 0;
      const groupAvgQuiz = g.quizResults.length > 0
        ? Math.round((g.quizResults.reduce((sum, q) => sum + q.percentage, 0) / g.quizResults.length) * 100) / 100
        : 0;
      byField.push({
        name: key,
        totalStudents: g.totalStudents,
        activeStudents: g.activeStudents,
        avgCompletionRate: groupAvgCompletion,
        avgQuizScore: groupAvgQuiz,
      });
    }

    groupedData = { [`by${field.charAt(0).toUpperCase() + field.slice(1)}`]: byField };
  }

  return NextResponse.json({
    current,
    previous,
    trends,
    ...groupedData,
  });
}
