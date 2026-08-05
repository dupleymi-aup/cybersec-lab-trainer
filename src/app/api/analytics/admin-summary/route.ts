import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { MS_PER_DAY, PERCENT_ROUNDING_FACTOR, PERCENT_SCALE } from '@/lib/constants';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireRole(auth.role, 'admin')) return forbidden();

    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy'); // 'group' | 'course' | 'university'

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * MS_PER_DAY);

    // Current period (last 30 days)
    const students = await getPrisma().user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        group: true,
        course: true,
        university: true,
        lastLoginAt: true,
      },
    });

    type StudentRow = { id: string; group: string; course: string; university: string; lastLoginAt: Date | null };
    type ProgressRow = { userId: string; moduleId: string; completed: boolean; score: number | null };
    type QuizResultRow = { userId: string; percentage: number };
    type PrevQuizResultRow = { percentage: number };

    const studentIds = students.map((s: StudentRow) => s.id);
    const totalStudents = students.length;
    const activeStudents = students.filter((s: StudentRow) => s.lastLoginAt && s.lastLoginAt >= thirtyDaysAgo).length;
    const activePercentage =
      totalStudents > 0 ? Math.round((activeStudents / totalStudents) * PERCENT_ROUNDING_FACTOR) / PERCENT_SCALE : 0;

    // Progress data
    const progressRecords = await getPrisma().progress.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, moduleId: true, completed: true, score: true },
    });

    // Quiz results
    const quizResults = await getPrisma().quizResult.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, percentage: true },
    });

    // Login activity in last 30 days
    const loginActivity = await getPrisma().loginActivity.count({
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
    const avgCompletionRate =
      totalStudents > 0
        ? Math.round((totalCompletedModules / (totalStudents * totalModules)) * PERCENT_ROUNDING_FACTOR) / PERCENT_SCALE
        : 0;

    // Avg quiz score
    const avgQuizScore =
      quizResults.length > 0
        ? Math.round(
            (quizResults.reduce((sum: number, q: QuizResultRow) => sum + q.percentage, 0) / quizResults.length) * 100,
          ) / 100
        : 0;

    const totalQuizAttempts = quizResults.length;

    // Previous period student count (total students active in 30-60 days ago period)
    const prevPeriodStudents = students.filter(
      (s: StudentRow) => s.lastLoginAt && s.lastLoginAt >= sixtyDaysAgo && s.lastLoginAt < thirtyDaysAgo,
    );
    const prevActiveStudents = prevPeriodStudents.length;
    const prevActivePercentage =
      totalStudents > 0
        ? Math.round((prevActiveStudents / totalStudents) * PERCENT_ROUNDING_FACTOR) / PERCENT_SCALE
        : 0;

    // Previous period progress
    const prevProgress = await getPrisma().progress.findMany({
      where: {
        userId: { in: studentIds },
        updatedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      select: { userId: true, completed: true },
    });

    // Previous period quiz results
    const prevQuizResults = await getPrisma().quizResult.findMany({
      where: {
        userId: { in: studentIds },
        updatedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      select: { percentage: true },
    });

    // Previous period login activity
    const prevLoginActivity = await getPrisma().loginActivity.count({
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
    const prevAvgCompletionRate =
      totalStudents > 0
        ? Math.round((prevTotalCompleted / (totalStudents * totalModules)) * PERCENT_ROUNDING_FACTOR) / PERCENT_SCALE
        : 0;

    const prevAvgQuizScore =
      prevQuizResults.length > 0
        ? Math.round(
            (prevQuizResults.reduce((sum: number, q: PrevQuizResultRow) => sum + q.percentage, 0) /
              prevQuizResults.length) *
              100,
          ) / 100
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
      students: 'stable' as const,
      activity: trendIndicator(activePercentage, prevActivePercentage),
      completion: trendIndicator(avgCompletionRate, prevAvgCompletionRate),
      quizScore: trendIndicator(avgQuizScore, prevAvgQuizScore),
    };

    // Optional groupBy aggregation
    let groupedData: Record<string, unknown> = {};

    if (groupBy === 'group' || groupBy === 'course' || groupBy === 'university') {
      const field = groupBy as 'group' | 'course' | 'university';
      const groups = new Map<
        string,
        {
          totalStudents: number;
          activeStudents: number;
          progressRecords: typeof progressRecords;
          quizResults: typeof quizResults;
        }
      >();

      for (const s of students) {
        const key = s[field] || '(not specified)';
        let g = groups.get(key);
        if (!g) {
          g = {
            totalStudents: 0,
            activeStudents: 0,
            progressRecords: [],
            quizResults: [],
          };
          groups.set(key, g);
        }
        g.totalStudents++;
        if (s.lastLoginAt && s.lastLoginAt >= thirtyDaysAgo) {
          g.activeStudents++;
        }
      }

      for (const p of progressRecords) {
        const student = students.find((s: StudentRow) => s.id === p.userId);
        if (student) {
          const key = student[field] || '(not specified)';
          const g = groups.get(key);
          if (g) g.progressRecords.push(p);
        }
      }

      for (const q of quizResults) {
        const student = students.find((s: StudentRow) => s.id === q.userId);
        if (student) {
          const key = student[field] || '(not specified)';
          const g = groups.get(key);
          if (g) g.quizResults.push(q);
        }
      }

      const byField: Record<string, unknown>[] = [];
      for (const [key, g] of groups.entries()) {
        const completedCount = g.progressRecords.filter((p: ProgressRow) => p.completed).length;
        const groupAvgCompletion =
          g.totalStudents > 0
            ? Math.round((completedCount / (g.totalStudents * totalModules)) * PERCENT_ROUNDING_FACTOR) / PERCENT_SCALE
            : 0;
        const groupAvgQuiz =
          g.quizResults.length > 0
            ? Math.round(
                (g.quizResults.reduce((sum: number, q: QuizResultRow) => sum + q.percentage, 0) /
                  g.quizResults.length) *
                  100,
              ) / 100
            : 0;
        byField.push({
          name: key,
          totalStudents: g.totalStudents,
          activeStudents: g.activeStudents,
          avgCompletionRate: groupAvgCompletion,
          avgQuizScore: groupAvgQuiz,
        });
      }

      groupedData = {
        [`by${field.charAt(0).toUpperCase() + field.slice(1)}`]: byField,
      };
    }

    return NextResponse.json({
      current,
      previous,
      trends,
      ...groupedData,
    });
  } catch (error) {
    logger.error('Admin summary error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
