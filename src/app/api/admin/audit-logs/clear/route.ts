import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole, checkRateLimit, getClientIp } from '@/lib/api-middleware';
import { clearAuditLogsSchema } from '@/lib/validations/api';
import { logger } from '@/lib/logger';

// POST /api/admin/audit-logs/clear - clear old audit logs
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 3 per minute (dangerous operation)
  const rateLimit = checkRateLimit(`audit-clear:${auth.id}`, 3, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (e) {
    logger.error('Invalid JSON in audit logs clear', { error: String(e) });
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = clearAuditLogsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { olderThan, action, maxCount, dryRun } = parsed.data;

  // Build where clause
  const where: Record<string, unknown> = {
    timestamp: { lt: new Date(olderThan) },
  };
  if (action) {
    where.action = action;
  }

  // Count how many records match
  const count = await getPrisma().auditLog.count({ where });

  // Dry run: just return the count without deleting
  if (dryRun) {
    return NextResponse.json({
      success: true,
      deletedCount: Math.min(count, maxCount),
      totalMatching: count,
      dryRun: true,
    });
  }

  // Actually delete (capped at limit)
  // Prisma deleteMany doesn't support `take`, so find IDs first then delete
  const recordsToDelete = await getPrisma().auditLog.findMany({
    where,
    select: { id: true },
    take: maxCount,
  });

  let deletedCount = 0;
  if (recordsToDelete.length > 0) {
    const ids = recordsToDelete.map((r: { id: string }) => r.id);
    const deleteResult = await getPrisma().auditLog.deleteMany({
      where: { id: { in: ids } },
    });
    deletedCount = deleteResult.count;
  }

  // Audit log the deletion
  try {
    const adminUser = await getPrisma().user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    await getPrisma().auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: 'audit_logs_cleared',
        targetId: 'audit-logs',
        targetName: `${deletedCount} logs deleted`,
        details: `Admin ${auth.id} cleared ${deletedCount} audit logs older than ${olderThan}${action ? ` with action="${action}"` : ''} [IP: ${ip}]`,
      },
    });
  } catch (error) {
    logger.warn('Audit logging failed', { error: String(error) });
  }

  return NextResponse.json({
    success: true,
    deletedCount,
    dryRun: false,
  });
}
