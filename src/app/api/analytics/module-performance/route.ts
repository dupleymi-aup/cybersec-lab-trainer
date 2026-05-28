import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';

const MODULE_NAMES: Record<string, string> = {
  'owasp': 'OWASP Top 10',
  'sql-injection': 'SQL-инъекции',
  'xss': 'XSS',
  'csrf': 'CSRF',
  'auth': 'Аутентификация',
  'secure-coding': 'Безопасный код',
  'tools': 'Инструменты',
  'security-headers': 'Security Headers',
};

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const groupBy = searchParams.get('groupBy');
  const groupId = searchParams.get('groupId');
  const userWhere = groupId ? { role: 'student' as const, group: groupId } : { role: 'student' as const };

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const students = await prisma.user.findMany({
    where: userWhere,
    select: { id: true, group: true, course: true, university: true },
  });

  const studentIds = students.map((s) => s.id);
  const totalStudents = students.length;

  const progressRecords = await prisma.progress.findMany({
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
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100 : 0;
    const avgScoreForCompleted = moduleProgress.filter((p) => p.completed && p.score != null).length > 0
      ? Math.round(moduleProgress.filter((p) => p.completed && p.score != null).reduce((sum, p) => sum + (p.score as number), 0) / moduleProgress.filter((p) => p.completed && p.score != null).length * 100) / 100
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
    // Pre-index students by id for O(1) lookup
    const studentById = new Map(students.map(s => [s.id, s]));

    for (const s of students) {
      const key = s[field] || '(не указано)';
      if (!groups.has(key)) groups.set(key, []);
    }

    for (const p of progressRecords) {
      const student = studentById.get(p.userId);
      if (student) {
        const key = student[field] || '(не указано)';
        groups.get(key)?.push(p);
      }
    }

    byGroup = Array.from(groups.entries()).map(([key, records]) => {
      const groupModules = moduleIds.map((moduleId) => {
        const mp = records.filter((p) => p.moduleId === moduleId);
        const completedCount = mp.filter((p) => p.completed).length;
        const scores = mp.filter((p) => p.score != null).map((p) => p.score as number);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100 : 0;
        const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 10000) / 100 : 0;
        return { moduleId, moduleName: MODULE_NAMES[moduleId], completedCount, completionRate, avgScore };
      });
      return { name: key, modules: groupModules };
    });
  }

  return NextResponse.json({
    modules,
    period: { start: since.toISOString(), end: now.toISOString() },
    byGroup,
  });
}
