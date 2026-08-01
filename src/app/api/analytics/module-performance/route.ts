import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseDays } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { MODULE_SHORT_NAMES } from '@/lib/module-names';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireRole(auth.role, 'teacher')) return forbidden();

    const { searchParams } = new URL(request.url);
    const days = parseDays(searchParams);
    const groupBy = searchParams.get('groupBy');
    const groupId = searchParams.get('groupId');
    const userWhere = groupId ? { role: 'student' as const, group: groupId } : { role: 'student' as const };

    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    type StudentRow = { id: string; group: string | null; course: string | null; university: string | null };
    type ProgressRow = { userId: string; moduleId: string; completed: boolean; score: number | null };

    const students = await getPrisma().user.findMany({
      where: userWhere,
      select: { id: true, group: true, course: true, university: true },
    });

    const studentIds = students.map((s: StudentRow) => s.id);
    const totalStudents = students.length;

    const progressRecords = await getPrisma().progress.findMany({
      where: {
        userId: { in: studentIds },
        updatedAt: { gte: since },
      },
      select: { userId: true, moduleId: true, completed: true, score: true },
    });

    const moduleIds = Object.keys(MODULE_SHORT_NAMES);
    const modules = moduleIds.map((moduleId) => {
      const moduleProgress = progressRecords.filter((p: ProgressRow) => p.moduleId === moduleId);
      const completedCount = moduleProgress.filter((p: ProgressRow) => p.completed).length;
      const scores = moduleProgress.filter((p: ProgressRow) => p.score != null).map((p: ProgressRow) => p.score as number);
      const avgScore =
        scores.length > 0 ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 100) / 100 : 0;
      const avgScoreForCompleted =
        moduleProgress.filter((p: ProgressRow) => p.completed && p.score != null).length > 0
          ? Math.round(
              (moduleProgress
                .filter((p: ProgressRow) => p.completed && p.score != null)
                .reduce((sum: number, p: ProgressRow) => sum + (p.score as number), 0) /
                moduleProgress.filter((p: ProgressRow) => p.completed && p.score != null).length) *
                100,
            ) / 100
          : 0;
      const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 10000) / 100 : 0;

      return {
        moduleId,
        moduleName: MODULE_SHORT_NAMES[moduleId] || moduleId,
        totalStudents,
        completedCount,
        completionRate,
        avgScore,
        avgScoreForCompleted,
        difficultyIndex: avgScore > 0 ? Math.round((100 - avgScore) * 10) / 10 : 0,
      };
    });

    let byGroup: Record<string, unknown>[] = [];
    if (groupBy === 'group' || groupBy === 'course' || groupBy === 'university') {
      const field = groupBy as 'group' | 'course' | 'university';
      const groups = new Map<string, typeof progressRecords>();
      const studentById = new Map<string, StudentRow>(students.map((s: StudentRow) => [s.id, s]));

      for (const s of students) {
        const key = s[field] || '(not specified)';
        if (!groups.has(key)) groups.set(key, []);
      }

      for (const p of progressRecords) {
        const student = studentById.get(p.userId);
        if (student) {
          const key = student[field] || '(not specified)';
          groups.get(key)?.push(p);
        }
      }

      byGroup = Array.from(groups.entries()).map(([key, records]) => {
        const groupModules = moduleIds.map((moduleId) => {
          const mp = records.filter((p: ProgressRow) => p.moduleId === moduleId);
          const completedCount = mp.filter((p: ProgressRow) => p.completed).length;
          const scores = mp.filter((p: ProgressRow) => p.score != null).map((p: ProgressRow) => p.score as number);
          const avgScore =
            scores.length > 0 ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 100) / 100 : 0;
          const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 10000) / 100 : 0;
          return {
            moduleId,
            moduleName: MODULE_SHORT_NAMES[moduleId],
            completedCount,
            completionRate,
            avgScore,
          };
        });
        return { name: key, modules: groupModules };
      });
    }

    return NextResponse.json({
      modules,
      period: { start: since.toISOString(), end: now.toISOString() },
      byGroup,
    });
  } catch (error) {
    logger.error('Module performance error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
