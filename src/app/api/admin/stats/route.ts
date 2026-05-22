import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole, checkRateLimit } from '@/lib/api-middleware';

// GET /api/admin/stats - dashboard KPIs
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 30 requests per minute
  const rateLimit = checkRateLimit(`admin-stats:${auth.id}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';

  // Calculate date range
  const now = new Date();
  const dateFrom = new Date();
  switch (period) {
    case '7d': dateFrom.setDate(now.getDate() - 7); break;
    case '30d': dateFrom.setDate(now.getDate() - 30); break;
    case '90d': dateFrom.setDate(now.getDate() - 90); break;
    case '1y': dateFrom.setFullYear(now.getFullYear() - 1); break;
    default: dateFrom.setDate(now.getDate() - 30);
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
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: true,
    }),
    prisma.user.count({ where: { isBlocked: true } }),
    prisma.user.count({ where: { createdAt: { gte: dateFrom } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: dateFrom } } }),

    // Quiz stats
    prisma.quizResult.count(),
    prisma.quizResult.count({ where: { createdAt: { gte: dateFrom } } }),
    prisma.quizResult.aggregate({
      _avg: { score: true },
    }),
    prisma.quizAttempt.count(),
    prisma.quizAttempt.count({ where: { createdAt: { gte: dateFrom } } }),

    // Login stats
    prisma.loginActivity.count(),
    prisma.loginActivity.count({ where: { timestamp: { gte: dateFrom } } }),
    prisma.loginActivity.groupBy({
      by: ['userId'],
      where: { timestamp: { gte: dateFrom } },
      _count: true,
    }).then(results => results.length),

    // Audit stats
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { timestamp: { gte: dateFrom } } }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { timestamp: { gte: dateFrom } },
      _count: true,
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    }),

    // Reports
    prisma.scheduledReport.count(),
    prisma.scheduledReport.count({ where: { isActive: true } }),

    // Progress
    prisma.progressSnapshot.count(),

    // LTI stats
    prisma.ltiPlatform.count(),
    prisma.ltiLaunchLog.count(),
    prisma.ltiLaunchLog.count({ where: { timestamp: { gte: dateFrom } } }),
  ]);

  // Build role breakdown
  const roleStats: Record<string, number> = {};
  for (const group of usersByRole) {
    roleStats[group.role] = group._count;
  }

  // Build top actions
  const topActionsList = topActions.map(a => ({
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
