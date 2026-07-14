import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseDays } from '@/lib/utils';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const days = parseDays(searchParams);
    const groupId = searchParams.get('groupId');
    const course = searchParams.get('course');
    const university = searchParams.get('university');

    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const userWhere: Record<string, unknown> = { role: 'student' };
    if (groupId) userWhere.group = groupId;
    if (course) userWhere.course = course;
    if (university) userWhere.university = university;

    const students = await getPrisma().user.findMany({
      where: userWhere,
      select: { id: true },
    });

    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) {
      return NextResponse.json({
        daily: [],
        summary: {
          totalModulesCompleted: 0,
          totalQuizAttempts: 0,
          avgDailyActive: 0,
          trend: 'stable' as const,
        },
      });
    }

    // Get all progress records within the date range
    const progressRecords = await getPrisma().progress.findMany({
      where: {
        userId: { in: studentIds },
        updatedAt: { gte: since },
      },
      select: { userId: true, moduleId: true, completed: true, updatedAt: true },
    });

    // Get all quiz results within the date range
    const quizResults = await getPrisma().quizResult.findMany({
      where: {
        userId: { in: studentIds },
        updatedAt: { gte: since },
      },
      select: { userId: true, percentage: true, updatedAt: true },
    });

    // Get login activity
    const loginActivity = await getPrisma().loginActivity.findMany({
      where: {
        userId: { in: studentIds },
        timestamp: { gte: since },
      },
      select: { userId: true, timestamp: true },
    });

    // Build daily data
    const dailyMap = new Map<
      string,
      {
        modulesCompleted: number;
        modulesStarted: number;
        quizAttempts: number;
        quizScores: number[];
        activeStudents: Set<string>;
        newCompletions: number;
      }
    >();

    for (let d = new Date(since); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, {
        modulesCompleted: 0,
        modulesStarted: 0,
        quizAttempts: 0,
        quizScores: [],
        activeStudents: new Set(),
        newCompletions: 0,
      });
    }

    // Process progress records
    for (const p of progressRecords) {
      const dateStr = p.updatedAt.toISOString().split('T')[0];
      const entry = dailyMap.get(dateStr);
      if (entry) {
        entry.activeStudents.add(p.userId);
        if (p.completed) {
          entry.modulesCompleted++;
          entry.newCompletions++;
        } else {
          entry.modulesStarted++;
        }
      }
    }

    // Process quiz results
    for (const q of quizResults) {
      const dateStr = q.updatedAt.toISOString().split('T')[0];
      const entry = dailyMap.get(dateStr);
      if (entry) {
        entry.activeStudents.add(q.userId);
        entry.quizAttempts++;
        entry.quizScores.push(q.percentage);
      }
    }

    // Process login activity
    for (const l of loginActivity) {
      const dateStr = l.timestamp.toISOString().split('T')[0];
      const entry = dailyMap.get(dateStr);
      if (entry) {
        entry.activeStudents.add(l.userId || '');
      }
    }

    const daily = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        modulesCompleted: data.modulesCompleted,
        modulesStarted: data.modulesStarted,
        quizAttempts: data.quizAttempts,
        avgQuizScore:
          data.quizScores.length > 0
            ? Math.round((data.quizScores.reduce((a, b) => a + b, 0) / data.quizScores.length) * 10) / 10
            : 0,
        activeStudents: data.activeStudents.size,
        newCompletions: data.newCompletions,
      }));

    // Compute summary
    const totalModulesCompleted = daily.reduce((sum, d) => sum + d.modulesCompleted, 0);
    const totalQuizAttempts = daily.reduce((sum, d) => sum + d.quizAttempts, 0);
    const avgDailyActive =
      daily.length > 0 ? Math.round((daily.reduce((sum, d) => sum + d.activeStudents, 0) / daily.length) * 10) / 10 : 0;

    // Determine trend based on last 7 days vs previous 7 days
    const last7 = daily.slice(-7);
    const prev7 = daily.slice(-14, -7);
    const last7Avg = last7.length > 0 ? last7.reduce((sum, d) => sum + d.activeStudents, 0) / last7.length : 0;
    const prev7Avg = prev7.length > 0 ? prev7.reduce((sum, d) => sum + d.activeStudents, 0) / prev7.length : 0;
    const trendDiff = last7Avg - prev7Avg;
    const trend = trendDiff > 2 ? 'up' : trendDiff < -2 ? 'down' : 'stable';

    return NextResponse.json({
      daily,
      summary: {
        totalModulesCompleted,
        totalQuizAttempts,
        avgDailyActive,
        trend,
      },
    });
  } catch (error) {
    logger.error('Progress dynamics error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
