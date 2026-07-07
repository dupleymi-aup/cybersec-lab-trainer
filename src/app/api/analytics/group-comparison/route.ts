import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseDays } from '@/lib/utils';

const MODULE_NAMES: Record<string, string> = {
  owasp: 'OWASP Top 10',
  'sql-injection': 'SQL-инъекции',
  xss: 'XSS',
  csrf: 'CSRF',
  auth: 'Аутентификация',
  'secure-coding': 'Безопасный код',
  tools: 'Инструменты',
  'security-headers': 'Security Headers',
};

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'teacher')) return forbidden();

  const { searchParams } = new URL(request.url);
  const days = parseDays(searchParams);
  const dimension = searchParams.get('dimension') || 'group';

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

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

  const studentIds = students.map((s) => s.id);

  const progressRecords = await getPrisma().progress.findMany({
    where: { userId: { in: studentIds }, updatedAt: { gte: since } },
    select: { userId: true, moduleId: true, completed: true, score: true },
  });

  const quizResults = await getPrisma().quizResult.findMany({
    where: { userId: { in: studentIds }, updatedAt: { gte: since } },
    select: { userId: true, percentage: true },
  });

  const quizAttempts = await getPrisma().quizAttempt.findMany({
    where: { userId: { in: studentIds }, attemptedAt: { gte: since } },
    select: { userId: true, category: true, correct: true },
  });

  const field = dimension as 'group' | 'course' | 'university';
  const groups = new Map<
    string,
    {
      students: typeof students;
      progress: typeof progressRecords;
      quizResults: typeof quizResults;
      quizAttempts: typeof quizAttempts;
    }
  >();

  for (const s of students) {
    const key = s[field] || '(не указано)';
    if (!groups.has(key))
      groups.set(key, {
        students: [],
        progress: [],
        quizResults: [],
        quizAttempts: [],
      });
    const group = groups.get(key);
    if (group) {
      group.students.push(s);
    }
  }

  for (const p of progressRecords) {
    const student = students.find((s) => s.id === p.userId);
    if (student) {
      const key = student[field] || '(не указано)';
      groups.get(key)?.progress.push(p);
    }
  }

  for (const q of quizResults) {
    const student = students.find((s) => s.id === q.userId);
    if (student) {
      const key = student[field] || '(не указано)';
      groups.get(key)?.quizResults.push(q);
    }
  }

  for (const q of quizAttempts) {
    const student = students.find((s) => s.id === q.userId);
    if (student) {
      const key = student[field] || '(не указано)';
      groups.get(key)?.quizAttempts.push(q);
    }
  }

  const totalModules = 8;
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const dimensions = Array.from(groups.entries()).map(([name, data]) => {
    const studentCount = data.students.length;
    const activeStudents = data.students.filter((s) => s.lastLoginAt && s.lastLoginAt >= thirtyDaysAgo).length;
    const activeRate = studentCount > 0 ? Math.round((activeStudents / studentCount) * 10000) / 100 : 0;

    const completedModules = data.progress.filter((p) => p.completed).length;
    const avgModulesCompleted = studentCount > 0 ? Math.round((completedModules / studentCount) * 100) / 100 : 0;
    const avgCompletionRate =
      studentCount > 0 ? Math.round((completedModules / (studentCount * totalModules)) * 10000) / 100 : 0;

    const avgQuizScore =
      data.quizResults.length > 0
        ? Math.round((data.quizResults.reduce((sum, q) => sum + q.percentage, 0) / data.quizResults.length) * 10) / 10
        : 0;

    const totalQuizAttempts = data.quizAttempts.length;

    // Calculate achievement rate (simplified: students with any progress completion)
    const studentsWithProgress = new Set(data.progress.filter((p) => p.completed).map((p) => p.userId)).size;
    const achievementRate = studentCount > 0 ? Math.round((studentsWithProgress / studentCount) * 10000) / 100 : 0;

    // Find top and weakest modules
    const moduleStats = Object.keys(MODULE_NAMES).map((moduleId) => {
      const mp = data.progress.filter((p) => p.moduleId === moduleId);
      const completed = mp.filter((p) => p.completed).length;
      return {
        moduleId,
        completed,
        rate: studentCount > 0 ? completed / studentCount : 0,
      };
    });

    moduleStats.sort((a, b) => b.rate - a.rate);
    const topModule = moduleStats[0]?.moduleId ? MODULE_NAMES[moduleStats[0].moduleId] || moduleStats[0].moduleId : '-';
    const weakestModule = moduleStats[moduleStats.length - 1]?.moduleId
      ? MODULE_NAMES[moduleStats[moduleStats.length - 1].moduleId] || moduleStats[moduleStats.length - 1].moduleId
      : '-';

    return {
      name,
      studentCount,
      activeStudents,
      activeRate,
      avgModulesCompleted,
      avgCompletionRate,
      avgQuizScore,
      totalQuizAttempts,
      achievementRate,
      topModule,
      weakestModule,
    };
  });

  // Rankings
  const byCompletion = [...dimensions]
    .sort((a, b) => b.avgCompletionRate - a.avgCompletionRate)
    .map((d) => ({ name: d.name, value: d.avgCompletionRate }));
  const byQuizScore = [...dimensions]
    .sort((a, b) => b.avgQuizScore - a.avgQuizScore)
    .map((d) => ({ name: d.name, value: d.avgQuizScore }));
  const byActivity = [...dimensions]
    .sort((a, b) => b.activeRate - a.activeRate)
    .map((d) => ({ name: d.name, value: d.activeRate }));

  return NextResponse.json({
    dimensions,
    rankings: { byCompletion, byQuizScore, byActivity },
  });
}
