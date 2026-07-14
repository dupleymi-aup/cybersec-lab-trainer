import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { parseDays } from '@/lib/utils';
import { logger } from '@/lib/logger';

// In-memory response cache with 30s TTL
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 30_000; // 30 seconds

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
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();
    if (!requireRole(auth.role, 'admin')) return forbidden('Требуется роль администратора');

    const { searchParams } = new URL(request.url);
    const days = parseDays(searchParams);
    const groupId = searchParams.get('groupId');

    // Check cache
    const cacheKey = `${days}-${groupId || ''}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    const userWhere = groupId ? { role: 'student' as const, group: groupId } : { role: 'student' as const };

    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevSince = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

    const students = await getPrisma().user.findMany({
      where: userWhere,
      select: { id: true, fullName: true, group: true, lastLoginAt: true },
    });

    const studentIds = students.map((s) => s.id);
    const totalStudents = students.length;

    // Current period data
    const activeStudents = students.filter((s) => s.lastLoginAt && s.lastLoginAt >= since).length;
    const activePercentage = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 10000) / 100 : 0;

    const progressRecords = await getPrisma().progress.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, moduleId: true, completed: true, score: true },
    });

    const quizResults = await getPrisma().quizResult.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, percentage: true, score: true, total: true },
    });

    const quizAttempts = await getPrisma().quizAttempt.findMany({
      where: { userId: { in: studentIds }, attemptedAt: { gte: since } },
      select: { userId: true, correct: true },
    });

    // Compute metrics
    const totalModules = 8;
    const totalCompleted = progressRecords.filter((p) => p.completed).length;
    const avgCompletionRate =
      totalStudents > 0 ? Math.round((totalCompleted / (totalStudents * totalModules)) * 10000) / 100 : 0;

    const avgQuizScore =
      quizResults.length > 0
        ? Math.round((quizResults.reduce((sum, q) => sum + q.percentage, 0) / quizResults.length) * 10) / 10
        : 0;

    // Engagement score (composite 0-100)
    const activityFactor = Math.min(25, Math.round((activePercentage / 100) * 25));
    const completionFactor = Math.min(25, Math.round((avgCompletionRate / 100) * 25));
    const quizFactor = Math.min(25, Math.round((avgQuizScore / 100) * 25));
    const attemptsPerStudent = totalStudents > 0 ? quizAttempts.length / totalStudents : 0;
    const attemptsFactor = Math.min(25, Math.round(Math.min(attemptsPerStudent / 10, 1) * 25));
    const engagementScore = activityFactor + completionFactor + quizFactor + attemptsFactor;

    const kpis = {
      totalStudents,
      activeStudents,
      activePercentage,
      avgCompletionRate,
      avgQuizScore,
      totalModulesCompleted: totalCompleted,
      totalQuizAttempts: quizAttempts.length,
      engagementScore,
    };

    // Previous period data
    const prevActiveStudents = students.filter(
      (s) => s.lastLoginAt && s.lastLoginAt >= prevSince && s.lastLoginAt < since,
    ).length;
    const prevActivePercentage =
      totalStudents > 0 ? Math.round((prevActiveStudents / totalStudents) * 10000) / 100 : 0;

    const prevProgress = await getPrisma().progress.findMany({
      where: {
        userId: { in: studentIds },
        updatedAt: { gte: prevSince, lt: since },
      },
      select: { completed: true },
    });

    const prevQuizResults = await getPrisma().quizResult.findMany({
      where: {
        userId: { in: studentIds },
        updatedAt: { gte: prevSince, lt: since },
      },
      select: { percentage: true },
    });

    const prevCompleted = prevProgress.filter((p) => p.completed).length;
    const prevAvgCompletionRate =
      totalStudents > 0 ? Math.round((prevCompleted / (totalStudents * totalModules)) * 10000) / 100 : 0;
    const prevAvgQuizScore =
      prevQuizResults.length > 0
        ? Math.round((prevQuizResults.reduce((sum, q) => sum + q.percentage, 0) / prevQuizResults.length) * 10) / 10
        : 0;

    const prevActivityFactor = Math.min(25, Math.round((prevActivePercentage / 100) * 25));
    const prevCompletionFactor = Math.min(25, Math.round((prevAvgCompletionRate / 100) * 25));
    const prevQuizFactor = Math.min(25, Math.round((prevAvgQuizScore / 100) * 25));
    const prevEngagementScore =
      prevActivityFactor +
      prevCompletionFactor +
      prevQuizFactor +
      Math.min(25, Math.round((prevQuizResults.length / Math.max(totalStudents, 1) / 10) * 25));

    const previousKpis = {
      totalStudents,
      activeStudents: prevActiveStudents,
      activePercentage: prevActivePercentage,
      avgCompletionRate: prevAvgCompletionRate,
      avgQuizScore: prevAvgQuizScore,
      totalModulesCompleted: prevCompleted,
      totalQuizAttempts: prevQuizResults.length,
      engagementScore: prevEngagementScore,
    };

    // Trends
    function ti(current: number, previous: number): 'up' | 'down' | 'stable' {
      const diff = current - previous;
      if (diff > 2) return 'up';
      if (diff < -2) return 'down';
      return 'stable';
    }

    const trends = {
      students: 'stable' as const,
      activity: ti(activePercentage, prevActivePercentage),
      completion: ti(avgCompletionRate, prevAvgCompletionRate),
      quizScore: ti(avgQuizScore, prevAvgQuizScore),
    };

    // Pre-index records by userId for O(1) lookups
    const progressByUser = new Map<string, typeof progressRecords>();
    const quizByUser = new Map<string, typeof quizResults>();
    for (const p of progressRecords) {
      if (!progressByUser.has(p.userId)) progressByUser.set(p.userId, []);
      progressByUser.get(p.userId)?.push(p);
    }
    for (const q of quizResults) {
      if (!quizByUser.has(q.userId)) quizByUser.set(q.userId, []);
      quizByUser.get(q.userId)?.push(q);
    }

    // Module distribution - index by moduleId first
    const progressByModule = new Map<string, typeof progressRecords>();
    for (const p of progressRecords) {
      if (!progressByModule.has(p.moduleId)) progressByModule.set(p.moduleId, []);
      progressByModule.get(p.moduleId)?.push(p);
    }

    const moduleDistribution = Object.keys(MODULE_NAMES).map((moduleId) => {
      const mp = progressByModule.get(moduleId) || [];
      const completed = mp.filter((p) => p.completed).length;
      const completionRate = totalStudents > 0 ? Math.round((completed / totalStudents) * 10000) / 100 : 0;
      const scores = mp.filter((p) => p.score != null).map((p) => p.score as number);
      const avgScore =
        scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
      return {
        moduleId,
        moduleName: MODULE_NAMES[moduleId],
        completionRate,
        avgScore,
      };
    });

    // Score distribution
    const studentScores = students.map((student) => {
      const studentQuizzes = quizByUser.get(student.id) || [];
      return studentQuizzes.length > 0
        ? studentQuizzes.reduce((sum, q) => sum + q.percentage, 0) / studentQuizzes.length
        : -1; // not attempted
    });

    const scoreDistribution = {
      excellent: studentScores.filter((s) => s >= 90).length,
      good: studentScores.filter((s) => s >= 70 && s < 90).length,
      average: studentScores.filter((s) => s >= 50 && s < 70).length,
      poor: studentScores.filter((s) => s >= 0 && s < 50).length,
      notAttempted: studentScores.filter((s) => s < 0).length,
    };

    // Top performers
    const studentPerformance = students.map((student) => {
      const studentQuizzes = quizByUser.get(student.id) || [];
      const avgScore =
        studentQuizzes.length > 0
          ? studentQuizzes.reduce((sum, q) => sum + q.percentage, 0) / studentQuizzes.length
          : 0;
      const studentProgress = (progressByUser.get(student.id) || []).filter((p) => p.completed).length;
      const compositeScore = Math.round((avgScore * 0.6 + (studentProgress / totalModules) * 100 * 0.4) * 10) / 10;
      return {
        userId: student.id,
        fullName: student.fullName,
        group: student.group,
        score: compositeScore,
      };
    });

    const topPerformers = studentPerformance.sort((a, b) => b.score - a.score).slice(0, 10);

    // Recent activity (simplified - last 20 events from various sources)
    const recentActivity: Array<{
      type: string;
      userId: string;
      fullName: string;
      timestamp: string;
      details: string;
    }> = [];

    const recentLogins = await getPrisma().loginActivity.findMany({
      where: { userId: { in: studentIds }, timestamp: { gte: since } },
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: { userId: true, timestamp: true, success: true },
    });

    for (const login of recentLogins) {
      if (login.userId) {
        const student = students.find((s) => s.id === login.userId);
        if (student) {
          recentActivity.push({
            type: 'login',
            userId: login.userId,
            fullName: student.fullName,
            timestamp: login.timestamp.toISOString(),
            details: login.success ? 'Успешный вход' : 'Неудачный вход',
          });
        }
      }
    }

    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const response = {
      kpis,
      trends,
      previousKpis,
      moduleDistribution,
      scoreDistribution,
      topPerformers,
      recentActivity: recentActivity.slice(0, 20),
    };

    // Store in cache
    cache.set(cacheKey, { data: response, expiresAt: Date.now() + CACHE_TTL });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Comprehensive summary error:', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
