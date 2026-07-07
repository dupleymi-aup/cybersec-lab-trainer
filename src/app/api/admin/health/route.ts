import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireCapability, checkRateLimit } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';

// GET /api/admin/health — system health check
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireCapability(auth, 'system:health')) return forbidden();

  // Rate limit: 30 per minute
  const rateLimit = checkRateLimit(`health:${auth.id}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
  }

  const checks: Record<
    string,
    {
      status: 'ok' | 'warn' | 'error';
      details?: string | Record<string, unknown>;
    }
  > = {};
  let overallStatus: 'ok' | 'warn' | 'error' = 'ok';

  // 1. Database connectivity
  try {
    const start = Date.now();
    await getPrisma().$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    checks.database = {
      status: latency > 500 ? 'warn' : 'ok',
      details: { latencyMs: latency },
    };
  } catch (e) {
    logger.error('Admin health check failed', { error: String(e) });
    checks.database = {
      status: 'error',
      details: 'Database connection failed',
    };
    overallStatus = 'error';
  }

  // 2. Table record counts
  try {
    const [users, auditLogs, quizResults, progress, loginActivity, announcements] = await Promise.all([
      getPrisma().user.count(),
      getPrisma().auditLog.count(),
      getPrisma().quizResult.count(),
      getPrisma().progress.count(),
      getPrisma().loginActivity.count(),
      getPrisma().announcement.count(),
    ]);
    checks.tables = {
      status: 'ok',
      details: {
        users,
        auditLogs,
        quizResults,
        progress,
        loginActivity,
        announcements,
      },
    };
  } catch (e) {
    logger.error('Admin health check failed', { error: String(e) });
    checks.tables = { status: 'error', details: 'Could not read table counts' };
    if (overallStatus !== 'error') overallStatus = 'warn';
  }

  // 3. Environment variables
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
  checks.environment = {
    status: missingEnvVars.length > 0 ? 'warn' : 'ok',
    details: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      missingVars: missingEnvVars.length > 0 ? missingEnvVars : undefined,
      hasAdminInviteCode: !!process.env.ADMIN_INVITE_CODE,
    },
  };
  if (missingEnvVars.length > 0 && overallStatus !== 'error') overallStatus = 'warn';

  // 4. Memory usage
  const memUsage = process.memoryUsage();
  const memMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
  };
  checks.memory = {
    status: memMB.heapUsed > 500 ? 'warn' : 'ok',
    details: memMB,
  };
  if (memMB.heapUsed > 500 && overallStatus !== 'error') overallStatus = 'warn';

  // 5. Rate limit status (current in-memory store size)
  checks.rateLimits = {
    status: 'ok',
    details: { note: 'Rate limits are tracked in-memory per endpoint' },
  };

  // 6. Recent errors — check for failed login attempts in last hour
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const failedLogins = await getPrisma().loginActivity.count({
      where: { success: false, timestamp: { gte: oneHourAgo } },
    });
    checks.security = {
      status: failedLogins > 20 ? 'warn' : 'ok',
      details: { failedLoginsLastHour: failedLogins },
    };
    if (failedLogins > 20 && overallStatus !== 'error') overallStatus = 'warn';
  } catch (e) {
    logger.error('Admin health check failed', { error: String(e) });
    checks.security = {
      status: 'warn',
      details: 'Could not check login activity',
    };
  }

  // 7. System info
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeFormatted =
    days > 0 ? `${days}d ${hours}h ${minutes}m` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  checks.system = {
    status: 'ok',
    details: {
      uptimeSeconds: Math.round(uptimeSeconds),
      uptimeFormatted,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  };

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    uptimeFormatted,
    checks,
  });
}
