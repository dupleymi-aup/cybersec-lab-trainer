import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole, checkRateLimit } from '@/lib/api-middleware';
import { RATE_WINDOW_1_MIN } from '@/lib/constants';

// GET /api/admin/stats - dashboard KPIs
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 30 requests per minute
  const rateLimit = checkRateLimit(`admin-stats:${auth.id}`, 30, RATE_WINDOW_1_MIN);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';

  // Calculate date range
  const now = new Date();
  const dateFrom = new Date();
  switch (period) {
    case '7d':
      dateFrom.setDate(now.getDate() - 7);
      break;
    case '30d':
      dateFrom.setDate(now.getDate() - 30);
      break;
    case '90d':
      dateFrom.setDate(now.getDate() - 90);
      break;
    case '1y':
      dateFrom.setFullYear(now.getFullYear() - 1);
      break;
    default:
      dateFrom.setDate(now.getDate() - 30);
  }

  // Parallel fetch all stats
  const [
    totalUsers,
    usersByRole,
    blockedUsers,
    newUsers,
    activeUsers,
    totalQuizResults,
    quizResultsInPeriod,
    avgQuizScore,
    totalQuizAttempts,
    attemptsInPeriod,
    totalLogins,
    loginsInPeriod,
    uniqueLoginsInPeriod,
    totalAuditLogs,
    auditLogsInPeriod,
    topActions,
    totalScheduledReports,
    activeScheduledReports,
    totalProgressSnapshots,
    totalLtiPlatforms,
    totalLtiLaunches,
    launchesInPeriod,
  ] = await Promise.all([
    // User stats
    getPrisma().user.count(),
    getPrisma().user.groupBy({
      by: ['role'],
      _count: true,
    }),
    getPrisma().user.count({ where: { isBlocked: true } }),
    getPrisma().user.count({ where: { createdAt: { gte: dateFrom } } }),
    getPrisma().user.count({ where: { lastLoginAt: { gte: dateFrom } } }),

    // Quiz stats
    getPrisma().quizResult.count(),
    getPrisma().quizResult.count({ where: { createdAt: { gte: dateFrom } } }),
    getPrisma().quizResult.aggregate({
      _avg: { score: true },
    }),
    getPrisma().quizAttempt.count(),
    getPrisma().quizAttempt.count({ where: { attemptedAt: { gte: dateFrom } } }),

    // Login stats
    getPrisma().loginActivity.count(),
    getPrisma().loginActivity.count({ where: { timestamp: { gte: dateFrom } } }),
    getPrisma()
      .loginActivity.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: dateFrom } },
        _count: true,
      })
      .then((results) => results.length),

    // Audit stats
    getPrisma().auditLog.count(),
    getPrisma().auditLog.count({ where: { timestamp: { gte: dateFrom } } }),
    getPrisma().auditLog.groupBy({
      by: ['action'],
      where: { timestamp: { gte: dateFrom } },
      _count: true,
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    }),

    // Reports
    getPrisma().scheduledReport.count(),
    getPrisma().scheduledReport.count({ where: { isActive: true } }),

    // Progress
    getPrisma().progressSnapshot.count(),

    // LTI stats
    getPrisma().ltiPlatform.count(),
    getPrisma().ltiLaunchLog.count(),
    getPrisma().ltiLaunchLog.count({ where: { launchedAt: { gte: dateFrom } } }),
  ]);

  // Build role breakdown
  const roleStats: Record<string, number> = {};
  for (const group of usersByRole) {
    roleStats[group.role] = group._count;
  }

  // Build top actions
  const topActionsList = topActions.map((a) => ({
    action: a.action,
    count: a._count,
  }));

  return NextResponse.json({
    period,
    dateFrom: dateFrom.toISOString(),
    dateTo: now.toISOString(),
    users: {
      total: totalUsers,
      byRole: roleStats,
      blocked: blockedUsers,
      newInPeriod: newUsers,
      activeInPeriod: activeUsers,
    },
    quizzes: {
      totalResults: totalQuizResults,
      resultsInPeriod: quizResultsInPeriod,
      averageScore: Number(avgQuizScore._avg.score?.toFixed(2)) || 0,
      totalAttempts: totalQuizAttempts,
      attemptsInPeriod: attemptsInPeriod,
    },
    logins: {
      total: totalLogins,
      inPeriod: loginsInPeriod,
      uniqueUsersInPeriod: uniqueLoginsInPeriod,
    },
    audit: {
      total: totalAuditLogs,
      inPeriod: auditLogsInPeriod,
      topActions: topActionsList,
    },
    reports: {
      total: totalScheduledReports,
      active: activeScheduledReports,
    },
    lti: {
      platforms: totalLtiPlatforms,
      totalLaunches: totalLtiLaunches,
      launchesInPeriod: launchesInPeriod,
    },
    progress: {
      totalSnapshots: totalProgressSnapshots,
    },
  });
}
