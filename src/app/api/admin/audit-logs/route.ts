import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized, forbidden, requireRole, checkRateLimit } from '@/lib/api-middleware';

// GET /api/admin/audit-logs - view audit logs with filtering and pagination
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 60 requests per minute
  const rateLimit = checkRateLimit(`audit-logs:${auth.id}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * Math.min(limit, 100);

  // Filters
  const action = searchParams.get('action') || undefined;
  const adminId = searchParams.get('adminId') || undefined;
  const targetId = searchParams.get('targetId') || undefined;
  const search = searchParams.get('search') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (adminId) where.adminId = adminId;
  if (targetId) where.targetId = targetId;
  if (search) {
    where.OR = [
      { adminName: { contains: search, mode: 'insensitive' as const } },
      { targetName: { contains: search, mode: 'insensitive' as const } },
      { details: { contains: search, mode: 'insensitive' as const } },
    ];
  }
  if (dateFrom || dateTo) {
    where.timestamp = {};
    if (dateFrom) (where.timestamp as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.timestamp as Record<string, unknown>).lte = new Date(dateTo);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: Math.min(limit, 100),
      include: {
        admin: {
          select: { id: true, email: true, fullName: true, role: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      adminName: log.adminName,
      action: log.action,
      targetId: log.targetId,
      targetName: log.targetName,
      details: log.details,
      timestamp: log.timestamp.toISOString(),
      admin: log.admin,
    })),
    pagination: {
      page,
      limit: Math.min(limit, 100),
      total,
      totalPages: Math.ceil(total / Math.min(limit, 100)),
    },
  });
}
