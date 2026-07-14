import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseDays } from '@/lib/utils';
import { CORE_MODULE_IDS } from '@/lib/module-constants';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireRole(auth.role, 'teacher')) return forbidden();

    const { searchParams } = new URL(request.url);
    const _days = parseDays(searchParams);
    const groupId = searchParams.get('groupId') || '';
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get all students
    const students = await getPrisma().user.findMany({
      where: { role: 'student', ...(groupId && { group: groupId }) },
      select: { id: true, fullName: true, group: true },
    });

    const studentIds = new Set(students.map((s) => s.id));

    // 1. Students with 0 logins in last 30 days
    const activeLoginIds = new Set(
      (
        await getPrisma().loginActivity.findMany({
          where: {
            userId: { in: Array.from(studentIds) },
            success: true,
            timestamp: { gte: thirtyDaysAgo },
          },
          select: { userId: true },
          distinct: ['userId'],
        })
      ).map((l) => l.userId),
    );
    const inactiveStudents = students.filter((s) => !activeLoginIds.has(s.id));

    // 2. Students who started modules but have no quiz results
    const progressWithStarts = await getPrisma().progress.findMany({
      where: { userId: { in: Array.from(studentIds) }, moduleId: { not: '' } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const quizResultIds = new Set(
      (
        await getPrisma().quizResult.findMany({
          where: { userId: { in: Array.from(studentIds) } },
          select: { userId: true },
          distinct: ['userId'],
        })
      ).map((q) => q.userId),
    );
    const startedIds = new Set(progressWithStarts.map((p) => p.userId));
    const missingQuizStudents = students.filter((s) => startedIds.has(s.id) && !quizResultIds.has(s.id));

    // 3. Modules with 0 completions
    const completedModules = await getPrisma().progress.findMany({
      where: { userId: { in: Array.from(studentIds) }, completed: true },
      select: { moduleId: true },
      distinct: ['moduleId'],
    });
    const completedModuleIds = new Set(completedModules.map((p) => p.moduleId));
    const zeroCompletionModules = CORE_MODULE_IDS.filter((m) => !completedModuleIds.has(m));

    // 4. Progress entries not updated in 60+ days
    const staleProgress = await getPrisma().progress.findMany({
      where: {
        userId: { in: Array.from(studentIds) },
        updatedAt: { lt: sixtyDaysAgo },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const staleStudentIds = new Set(staleProgress.map((p) => p.userId));
    const staleStudents = students.filter((s) => staleStudentIds.has(s.id));

    // 5. Quiz results with 0% score
    const failedQuizzes = await getPrisma().quizResult.count({
      where: { userId: { in: Array.from(studentIds) }, percentage: 0 },
    });

    // Compute health score
    const criticalCount = 0;
    const warningCount = inactiveStudents.length + zeroCompletionModules.length;
    const infoCount = missingQuizStudents.length + staleStudents.length;
    const healthScore = Math.max(0, 100 - (criticalCount * 20 + warningCount * 10 + infoCount * 2));

    const issues = [
      {
        type: 'inactive-students',
        severity: 'warning' as const,
        title: 'Неактивные студенты',
        description: 'Студенты без входов за последние 30 дней',
        count: inactiveStudents.length,
        affectedStudents: inactiveStudents
          .slice(0, 20)
          .map((s) => ({ id: s.id, fullName: s.fullName, group: s.group })),
      },
      {
        type: 'missing-quiz',
        severity: 'info' as const,
        title: 'Отсутствуют квизы',
        description: 'Студенты начали модули, но не проходили квизы',
        count: missingQuizStudents.length,
        affectedStudents: missingQuizStudents
          .slice(0, 20)
          .map((s) => ({ id: s.id, fullName: s.fullName, group: s.group })),
      },
      {
        type: 'zero-completion-modules',
        severity: 'warning' as const,
        title: 'Модули без завершений',
        description: 'Модули, которые никто не завершил',
        count: zeroCompletionModules.length,
        affectedModules: zeroCompletionModules,
      },
      {
        type: 'stale-progress',
        severity: 'info' as const,
        title: 'Устаревший прогресс',
        description: 'Прогресс не обновлялся более 60 дней',
        count: staleStudents.length,
        affectedStudents: staleStudents
          .slice(0, 20)
          .map((s) => ({ id: s.id, fullName: s.fullName, group: s.group })),
      },
      {
        type: 'failed-quizzes',
        severity: 'warning' as const,
        title: 'Квизы с 0%',
        description: 'Квизы, пройденные с нулевым результатом',
        count: failedQuizzes,
      },
    ].filter((issue) => issue.count > 0);

    return NextResponse.json({
      healthScore,
      issues,
      summary: {
        totalStudents: students.length,
        activeStudents: students.length - inactiveStudents.length,
        totalModules: CORE_MODULE_IDS.length,
        completedModules: completedModuleIds.size,
        totalQuizzes: await getPrisma().quizResult.count({
          where: { userId: { in: Array.from(studentIds) } },
        }),
      },
    });
  } catch (error) {
    logger.error('Data quality error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
