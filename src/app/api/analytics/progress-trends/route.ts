import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const dateRange = searchParams.get('dateRange') || '30d';
    const groupId = searchParams.get('groupId');
    const userWhere = groupId ? { role: 'student' as const, group: groupId } : { role: 'student' as const };

    // Calculate cutoff date
    let cutoffDate: Date | undefined;
    const now = new Date();
    if (dateRange !== 'all') {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    // Determine which students to query
    let studentIds: string[];
    if (userId) {
      // Check that the target user exists and is a student (or user is admin viewing any user)
      const targetUser = await getPrisma().user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (targetUser.role !== 'student' && auth.role !== 'admin') {
        return NextResponse.json({ error: 'Can only view student progress trends' }, { status: 403 });
      }
      studentIds = [userId];
    } else {
      const students = await getPrisma().user.findMany({
        where: userWhere,
        select: { id: true },
      });
      studentIds = students.map((s: { id: string }) => s.id);
    }

    if (studentIds.length === 0) {
      return NextResponse.json({ trends: [] });
    }

    // Fetch Progress records
    const progressRecords = await getPrisma().progress.findMany({
      where: {
        userId: { in: studentIds },
        ...(cutoffDate && { updatedAt: { gte: cutoffDate } }),
      },
      select: {
        userId: true,
        moduleId: true,
        completed: true,
        score: true,
        updatedAt: true,
      },
    });

    // Fetch QuizResult records
    const quizResults = await getPrisma().quizResult.findMany({
      where: {
        userId: { in: studentIds },
        ...(cutoffDate && { updatedAt: { gte: cutoffDate } }),
      },
      select: { userId: true, percentage: true, updatedAt: true },
    });

    // Build daily trends
    const dailyMap = new Map<
      string,
      {
        modulesCompleted: number[];
        quizScores: number[];
        activeUserIds: Set<string>;
      }
    >();

    function getDateKey(date: Date): string {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // Process progress records
    for (const p of progressRecords) {
      const dateKey = getDateKey(new Date(p.updatedAt));
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          modulesCompleted: [],
          quizScores: [],
          activeUserIds: new Set(),
        });
      }
      const entry = dailyMap.get(dateKey);
      if (entry) {
        entry.activeUserIds.add(p.userId);
        if (p.completed) {
          entry.modulesCompleted.push(1);
        }
      }
    }

    // Process quiz results
    for (const q of quizResults) {
      const dateKey = getDateKey(new Date(q.updatedAt));
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          modulesCompleted: [],
          quizScores: [],
          activeUserIds: new Set(),
        });
      }
      const entry = dailyMap.get(dateKey);
      if (entry) {
        entry.activeUserIds.add(q.userId);
        entry.quizScores.push(q.percentage);
      }
    }

    // Compute aggregate per-day values
    const totalStudents = studentIds.length;
    const trends = Array.from(dailyMap.entries())
      .map(([date, data]) => {
        const avgModulesCompleted = data.modulesCompleted.length > 0 ? data.modulesCompleted.length / totalStudents : 0;
        const avgQuizScore =
          data.quizScores.length > 0 ? data.quizScores.reduce((a, b) => a + b, 0) / data.quizScores.length : 0;
        return {
          date,
          modulesCompleted: Math.round(avgModulesCompleted * 100) / 100,
          avgQuizScore: Math.round(avgQuizScore * 100) / 100,
          activeStudents: data.activeUserIds.size,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ trends });
  } catch (error) {
    logger.error('Progress trends error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
