import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseDays } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireRole(auth.role, 'teacher')) return forbidden();

    const { searchParams } = new URL(request.url);
    const days = parseDays(searchParams, 90);
    const groupId = searchParams.get('groupId');

    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const userFilter: Prisma.UserWhereInput = { role: 'student' };
    if (groupId) userFilter.group = groupId;

    const students = await getPrisma().user.findMany({
      where: userFilter,
      select: { id: true, fullName: true, group: true, createdAt: true },
    });

    const studentIds = students.map((s) => s.id);

    const progress = await getPrisma().progress.findMany({
      where: { userId: { in: studentIds }, updatedAt: { gte: since } },
      select: {
        userId: true,
        moduleId: true,
        completed: true,
        score: true,
        updatedAt: true,
      },
    });

    const quizAttempts = await getPrisma().quizAttempt.findMany({
      where: { userId: { in: studentIds }, attemptedAt: { gte: since } },
      select: { userId: true, attemptedAt: true },
    });

    const quizResults = await getPrisma().quizResult.findMany({
      where: { userId: { in: studentIds }, updatedAt: { gte: since } },
      select: { userId: true, percentage: true, updatedAt: true },
    });

    const groupNames = [...new Set(students.map((s) => s.group).filter(Boolean))];

    interface GroupData {
      groupName: string;
      studentCount: number;
      activityTimeline: Array<{
        week: string;
        activeStudents: number;
        modulesCompleted: number;
        quizAttempts: number;
      }>;
      performanceVariance: number;
      peerInfluenceScore: number;
      newMemberIntegrationDays: number;
      healthScore: number;
      trend: 'improving' | 'stable' | 'declining';
    }

    const groupsData: GroupData[] = [];

    for (const groupName of groupNames) {
      const groupStudents = students.filter((s) => s.group === groupName);
      const groupStudentIds = groupStudents.map((s) => s.id);

      const groupProgress = progress.filter((p) => groupStudentIds.includes(p.userId));
      const groupQuizAttempts = quizAttempts.filter((q) => groupStudentIds.includes(q.userId));
      const groupQuizResults = quizResults.filter((q) => groupStudentIds.includes(q.userId));

      const weekMap = new Map<
        string,
        {
          activeStudents: Set<string>;
          modulesCompleted: number;
          quizAttempts: number;
        }
      >();
      for (const p of groupProgress) {
        const weekStart = new Date(p.updatedAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weekMap.has(weekKey))
          weekMap.set(weekKey, {
            activeStudents: new Set(),
            modulesCompleted: 0,
            quizAttempts: 0,
          });
        const weekEntry = weekMap.get(weekKey);
        if (weekEntry) {
          weekEntry.activeStudents.add(p.userId);
          if (p.completed) weekEntry.modulesCompleted++;
        }
      }
      for (const q of groupQuizAttempts) {
        const weekStart = new Date(q.attemptedAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weekMap.has(weekKey))
          weekMap.set(weekKey, {
            activeStudents: new Set(),
            modulesCompleted: 0,
            quizAttempts: 0,
          });
        const weekEntry = weekMap.get(weekKey);
        if (weekEntry) {
          weekEntry.activeStudents.add(q.userId);
          weekEntry.quizAttempts++;
        }
      }

      const activityTimeline = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, data]) => ({
          week,
          activeStudents: data.activeStudents.size,
          modulesCompleted: data.modulesCompleted,
          quizAttempts: data.quizAttempts,
        }));

      const scores = groupProgress.filter((p) => p.score != null).map((p) => p.score ?? 0);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const variance =
        scores.length > 1 ? scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length : 0;
      const performanceVariance = Math.round(Math.sqrt(variance) * 10) / 10;

      const studentScores = groupStudents
        .map((s) => {
          const sProgress = groupProgress.filter((p) => p.userId === s.id);
          const sScores = sProgress.filter((p) => p.score != null).map((p) => p.score ?? 0);
          return sScores.length > 0 ? sScores.reduce((a, b) => a + b, 0) / sScores.length : 0;
        })
        .sort((a, b) => b - a);

      const topQuartile = studentScores.slice(0, Math.max(1, Math.floor(studentScores.length / 4)));
      const restScores = studentScores.slice(Math.max(1, Math.floor(studentScores.length / 4)));
      const topAvg = topQuartile.length > 0 ? topQuartile.reduce((a, b) => a + b, 0) / topQuartile.length : 0;
      const restAvg = restScores.length > 0 ? restScores.reduce((a, b) => a + b, 0) / restScores.length : 0;
      const peerInfluenceScore = topAvg > 0 && restAvg > 0 ? Math.round((restAvg / topAvg) * 100) : 0;

      const integrationDays: number[] = [];
      for (const s of groupStudents) {
        const sProgress = groupProgress.filter((p) => p.userId === s.id);
        if (sProgress.length > 0) {
          const firstActivity = new Date(Math.min(...sProgress.map((p) => p.updatedAt.getTime())));
          const daysToIntegrate = Math.floor(
            (firstActivity.getTime() - s.createdAt.getTime()) / (24 * 60 * 60 * 1000),
          );
          if (daysToIntegrate >= 0) integrationDays.push(daysToIntegrate);
        }
      }
      const newMemberIntegrationDays =
        integrationDays.length > 0
          ? Math.round(integrationDays.reduce((a, b) => a + b, 0) / integrationDays.length)
          : 0;

      const activityRate =
        activityTimeline.length > 0
          ? Math.round(
              (activityTimeline.reduce((sum, w) => sum + w.activeStudents, 0) /
                (activityTimeline.length * groupStudents.length)) *
                100,
            )
          : 0;
      const completionRate =
        groupStudents.length > 0
          ? Math.round((groupProgress.filter((p) => p.completed).length / (groupStudents.length * 10)) * 100)
          : 0;
      const quizRate =
        groupStudents.length > 0
          ? Math.min(100, Math.round((groupQuizResults.length / groupStudents.length) * 20))
          : 0;
      const healthScore = Math.round(activityRate * 0.4 + completionRate * 0.35 + quizRate * 0.25);

      const recentWeeks = activityTimeline.slice(-4);
      const olderWeeks = activityTimeline.slice(-8, -4);
      const recentActive = recentWeeks.reduce((sum, w) => sum + w.activeStudents, 0);
      const olderActive = olderWeeks.length > 0 ? olderWeeks.reduce((sum, w) => sum + w.activeStudents, 0) : 0;
      let trend: 'improving' | 'stable' | 'declining';
      if (olderActive > 0 && recentActive > olderActive * 1.1) trend = 'improving';
      else if (olderActive > 0 && recentActive < olderActive * 0.9) trend = 'declining';
      else trend = 'stable';

      groupsData.push({
        groupName,
        studentCount: groupStudents.length,
        activityTimeline,
        performanceVariance,
        peerInfluenceScore,
        newMemberIntegrationDays,
        healthScore,
        trend,
      });
    }

    groupsData.sort((a, b) => b.healthScore - a.healthScore);

    const allWeeks = new Map<string, { healthScores: number[]; activeCount: Set<string> }>();
    for (const g of groupsData) {
      for (const w of g.activityTimeline) {
        if (!allWeeks.has(w.week)) allWeeks.set(w.week, { healthScores: [], activeCount: new Set() });
        const weekEntry = allWeeks.get(w.week);
        if (weekEntry) {
          weekEntry.healthScores.push(g.healthScore);
        }
      }
    }
    const overallTrends = Array.from(allWeeks.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        avgHealthScore:
          Math.round((data.healthScores.reduce((a, b) => a + b, 0) / data.healthScores.length) * 10) / 10,
        totalActive: students.filter((s) => {
          const weekStart = new Date(week);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          return (
            progress.some((p) => p.userId === s.id && p.updatedAt >= weekStart && p.updatedAt < weekEnd) ||
            quizAttempts.some((q) => q.userId === s.id && q.attemptedAt >= weekStart && q.attemptedAt < weekEnd)
          );
        }).length,
      }));

    return NextResponse.json({ groups: groupsData, overallTrends });
  } catch (error) {
    console.error('Group dynamics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
