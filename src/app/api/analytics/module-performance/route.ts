import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseDays } from '@/lib/utils';
import { logger } from '@/lib/logger';

const MODULE_NAMES: Record<string, string> = {
  owasp: 'OWASP Top 10',
  'sql-injection': 'SQL Injection',
  xss: 'XSS',
  csrf: 'CSRF',
  auth: 'Authentication',
  'secure-coding': 'Secure Coding',
  tools: 'Tools',
  'security-headers': 'Security Headers',
};

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

    const students = await getPrisma().user.findMany({
      where: userWhere,
      select: { id: true, group: true, course: true, university: true },
    });

    const studentIds = students.map((s) => s.id);
    const totalStudents = students.length;

    const progressRecords = await getPrisma().progress.findMany({
      where: {
        userId: { in: studentIds },
        updatedAt: { gte: since },
      },
      select: { userId: true, moduleId: true, completed: true, score: true },
    });

    const moduleIds = Object.keys(MODULE_NAMES);
    const modules = moduleIds.map((moduleId) => {
      const moduleProgress = progressRecords.filter((p) => p.moduleId === moduleId);
      const completedCount = moduleProgress.filter((p) => p.completed).length;
      const scores = moduleProgress.filter((p) => p.score != null).map((p) => p.score as number);
      const avgScore =
        scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
      const avgScoreForCompleted =
        moduleProgress.filter((p) => p.completed && p.score != null).length > 0
          ? Math.round(
              (moduleProgress
                .filter((p) => p.completed && p.score != null)
                .reduce((sum, p) => sum + (p.score as number), 0) /
                moduleProgress.filter((p) => p.completed && p.score != null).length) *
                100,
            ) / 100
          : 0;
      const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 10000) / 100 : 0;

      return {
        moduleId,
        moduleName: MODULE_NAMES[moduleId] || moduleId,
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
      const studentById = new Map(students.map((s) => [s.id, s]));

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
          const mp = records.filter((p) => p.moduleId === moduleId);
          const completedCount = mp.filter((p) => p.completed).length;
          const scores = mp.filter((p) => p.score != null).map((p) => p.score as number);
          const avgScore =
            scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
          const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 10000) / 100 : 0;
          return {
            moduleId,
            moduleName: MODULE_NAMES[moduleId],
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
