import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireRole(auth.role, 'teacher')) return forbidden();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    const userFilter: Prisma.UserWhereInput = { role: 'student' };
    if (groupId) userFilter.group = groupId;

    const students = await getPrisma().user.findMany({
      where: userFilter,
      select: { id: true, fullName: true, group: true, createdAt: true },
    });

    const studentIds = students.map((s) => s.id);

    const progress = await getPrisma().progress.findMany({
      where: { userId: { in: studentIds }, completed: true },
      select: { userId: true, moduleId: true, score: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });

    interface StudentVelocity {
      userId: string;
      fullName: string | null;
      group: string | null;
      modulesCompleted: number;
      avgDaysPerModule: number;
      firstModuleDate: string;
      lastModuleDate: string;
      scoreImprovement: number;
      velocityScore: number;
    }

    const studentVelocities: StudentVelocity[] = [];

    for (const student of students) {
      const studentProgress = progress.filter((p) => p.userId === student.id);

      const modulesCompleted = studentProgress.length;
      if (modulesCompleted < 2) continue;

      const sorted = [...studentProgress].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
      const firstModuleDate = sorted[0].updatedAt;
      const lastModuleDate = sorted[sorted.length - 1].updatedAt;
      const totalDays = Math.max(
        1,
        Math.floor((lastModuleDate.getTime() - firstModuleDate.getTime()) / (24 * 60 * 60 * 1000)),
      );
      const avgDaysPerModule = Math.round((totalDays / modulesCompleted) * 10) / 10;

      const half = Math.floor(modulesCompleted / 2);
      const firstHalfScores = sorted.slice(0, half).map((p) => p.score ?? 0);
      const secondHalfScores = sorted.slice(half).map((p) => p.score ?? 0);
      const firstAvg =
        firstHalfScores.length > 0 ? firstHalfScores.reduce((a, b) => a + b, 0) / firstHalfScores.length : 0;
      const secondAvg =
        secondHalfScores.length > 0 ? secondHalfScores.reduce((a, b) => a + b, 0) / secondHalfScores.length : 0;
      const scoreImprovement = Math.round((secondAvg - firstAvg) * 10) / 10;

      const speedScore = Math.max(0, Math.min(100, Math.round((1 - avgDaysPerModule / 14) * 100)));
      const improvementScore = Math.max(0, Math.min(100, Math.round(((scoreImprovement + 50) / 100) * 100)));
      const velocityScore = Math.round(speedScore * 0.6 + improvementScore * 0.4);

      studentVelocities.push({
        userId: student.id,
        fullName: student.fullName,
        group: student.group,
        modulesCompleted,
        avgDaysPerModule,
        firstModuleDate: firstModuleDate.toISOString().split('T')[0],
        lastModuleDate: lastModuleDate.toISOString().split('T')[0],
        scoreImprovement,
        velocityScore,
      });
    }

    studentVelocities.sort((a, b) => b.velocityScore - a.velocityScore);

    const ranges = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '81-100', min: 81, max: 100, count: 0 },
    ];
    for (const v of studentVelocities) {
      for (const r of ranges) {
        if (v.velocityScore >= r.min && v.velocityScore <= r.max) {
          r.count++;
          break;
        }
      }
    }

    const groupMap = new Map<string, { days: number; improvement: number; count: number }>();
    for (const v of studentVelocities) {
      const g = v.group || '(no group)';
      const existing = groupMap.get(g) || { days: 0, improvement: 0, count: 0 };
      existing.days += v.avgDaysPerModule;
      existing.improvement += v.scoreImprovement;
      existing.count++;
      groupMap.set(g, existing);
    }
    const avgVelocityByGroup = Array.from(groupMap.entries()).map(([group, data]) => ({
      group,
      avgDaysPerModule: Math.round((data.days / data.count) * 10) / 10,
      avgScoreImprovement: Math.round((data.improvement / data.count) * 10) / 10,
    }));

    const weekMap = new Map<string, { days: number; improvement: number; count: number }>();
    for (const v of studentVelocities) {
      const weekStart = new Date(v.lastModuleDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      const existing = weekMap.get(weekKey) || {
        days: 0,
        improvement: 0,
        count: 0,
      };
      existing.days += v.avgDaysPerModule;
      existing.improvement += v.scoreImprovement;
      existing.count++;
      weekMap.set(weekKey, existing);
    }
    const velocityOverTime = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        avgDaysPerModule: Math.round((data.days / data.count) * 10) / 10,
        avgScoreImprovement: Math.round((data.improvement / data.count) * 10) / 10,
      }));

    return NextResponse.json({
      studentVelocities,
      velocityDistribution: ranges,
      avgVelocityByGroup,
      velocityOverTime,
    });
  } catch (error) {
    logger.error('Learning velocity error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
