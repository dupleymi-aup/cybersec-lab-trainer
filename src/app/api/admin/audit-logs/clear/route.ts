import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole, checkRateLimit, getClientIp } from '@/lib/api-middleware';

interface ClearRequestBody {
  olderThan?: string;
  action?: string;
  maxCount?: number;
  dryRun?: boolean;
}

// POST /api/admin/audit-logs/clear - clear old audit logs
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 3 per minute (dangerous operation)
  const rateLimit = checkRateLimit(`audit-clear:${auth.id}`, 3, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
      { status: 429 }
    );
  }

  let body: ClearRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { olderThan, action, maxCount, dryRun } = body;

  // Safety: NEVER allow clearing all logs without a date filter
  if (!olderThan) {
    return NextResponse.json(
      { error: 'olderThan date filter is required. Cannot clear all audit logs without a date constraint.' },
      { status: 400 }
    );
  }

  // Validate olderThan is a valid ISO date
  const olderThanDate = new Date(olderThan);
  if (isNaN(olderThanDate.getTime())) {
    return NextResponse.json({ error: 'Invalid olderThan date format. Use ISO 8601 format.' }, { status: 400 });
  }

  // Validate and cap maxCount
  let limit = maxCount ?? 1000;
  if (typeof limit !== 'number' || limit < 1) {
    return NextResponse.json({ error: 'maxCount must be a positive number' }, { status: 400 });
  }
  if (limit > 5000) {
    limit = 5000;
  }

  // Build where clause
  const where: Record<string, unknown> = {
    timestamp: { lt: olderThanDate },
  };
  if (action) {
    where.action = action;
  }

  // Count how many records match
  const count = await prisma.auditLog.count({ where });

  // Dry run: just return the count without deleting
  if (dryRun) {
    return NextResponse.json({
      success: true,
      deletedCount: Math.min(count, limit),
      totalMatching: count,
      dryRun: true,
    });
  }

  // Actually delete (capped at limit)
  // Prisma deleteMany doesn't support `take`, so find IDs first then delete
  const recordsToDelete = await prisma.auditLog.findMany({
    where,
    select: { id: true },
    take: limit,
  });

  let deletedCount = 0;
  if (recordsToDelete.length > 0) {
    const ids = recordsToDelete.map(r => r.id);
    const deleteResult = await prisma.auditLog.deleteMany({
      where: { id: { in: ids } },
    });
    deletedCount = deleteResult.count;
  }

  // Audit log the deletion
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
    const ip = getClientIp(request);
    await prisma.auditLog.create({
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
    // Audit logging is best-effort
    if (process.env.NODE_ENV === 'development') {
      console.warn('Audit logging failed:', error);
    }
  }

  return NextResponse.json({
    success: true,
    deletedCount,
    dryRun: false,
  });
}
