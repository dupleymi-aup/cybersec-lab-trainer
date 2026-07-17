import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { Role } from '@prisma/client';
import { authenticate, unauthorized, forbidden, requireRole, checkRateLimit, getClientIp } from '@/lib/api-middleware';
import { validateUuid } from '@/lib/validate-uuid';
import { logger } from '@/lib/logger';

type BulkAction = 'block' | 'unblock' | 'delete' | 'role_change';

interface BulkRequestBody {
  userIds: string[];
  action: BulkAction;
  role?: string;
}

// POST /api/admin/users/bulk - bulk operations on users
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!requireRole(auth.role, 'admin')) return forbidden();

  // Rate limit: 5 bulk operations per minute
  const rateLimit = checkRateLimit(`bulk:${auth.id}`, 5, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter: rateLimit.retryAfter }, { status: 429 });
  }

  let body: BulkRequestBody;
  try {
    body = await request.json();
  } catch (e) {
    logger.error('Invalid JSON in bulk users operation', { error: String(e) });
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { userIds, action, role } = body;

  // Validation
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'userIds array is required and must not be empty' }, { status: 400 });
  }
  if (userIds.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 users per bulk operation' }, { status: 400 });
  }
  if (!['block', 'unblock', 'delete', 'role_change'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be: block, unblock, delete, role_change' },
      { status: 400 },
    );
  }
  if (action === 'role_change' && !role) {
    return NextResponse.json({ error: 'role is required for role_change action' }, { status: 400 });
  }
  if (action === 'role_change' && role && !['student', 'teacher', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role. Must be: student, teacher, admin' }, { status: 400 });
  }

  // Prevent self-action
  if (userIds.includes(auth.id)) {
    return NextResponse.json({ error: 'Cannot perform bulk operations on yourself' }, { status: 403 });
  }

  // Prevent last admin deletion
  if (action === 'delete') {
    const adminCount = await getPrisma().user.count({ where: { role: 'admin' } });
    const adminsToDelete = await getPrisma().user.count({
      where: { id: { in: userIds }, role: 'admin' },
    });
    if (adminCount - adminsToDelete < 1) {
      return NextResponse.json({ error: 'Cannot delete the last administrator' }, { status: 403 });
    }
  }

  // Validate UUID format for all IDs
  const invalidIds = userIds.filter((id) => !validateUuid(id));
  if (invalidIds.length > 0) {
    return NextResponse.json({ error: 'Invalid user ID format', invalidIds: invalidIds.slice(0, 5) }, { status: 400 });
  }

  // Fetch target users for audit logging
  const targetUsers = await getPrisma().user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, fullName: true, role: true },
  });

  const foundIds = new Set(targetUsers.map((u) => u.id));
  const missingIds = userIds.filter((id) => !foundIds.has(id));

  let resultCount = 0;

  try {
    switch (action) {
      case 'block': {
        const result = await getPrisma().user.updateMany({
          where: { id: { in: userIds } },
          data: { isBlocked: true, tokenVersion: { increment: 1 } },
        });
        resultCount = result.count;
        break;
      }

      case 'unblock': {
        const result = await getPrisma().user.updateMany({
          where: { id: { in: userIds } },
          data: { isBlocked: false, tokenVersion: { increment: 1 } },
        });
        resultCount = result.count;
        break;
      }

      case 'delete': {
        const deleteResult = await getPrisma().user.deleteMany({
          where: { id: { in: userIds } },
        });
        resultCount = deleteResult.count;
        break;
      }

      case 'role_change': {
        const targetRole = role as Role;
        const result = await getPrisma().user.updateMany({
          where: { id: { in: userIds } },
          data: { role: targetRole, tokenVersion: { increment: 1 } },
        });
        resultCount = result.count;
        break;
      }
    }

    // Audit log the bulk operation
    try {
      const adminUser = await getPrisma().user.findUnique({
        where: { id: auth.id },
      });
      const ip = getClientIp(request);
      await getPrisma().auditLog.create({
        data: {
          id: crypto.randomUUID(),
          adminId: auth.id,
          adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
          action: `bulk_${action}`,
          targetId: userIds.join(','),
          targetName: `${resultCount} users`,
          details: `Admin ${auth.id} performed bulk ${action} on ${resultCount} users${missingIds.length > 0 ? ` (${missingIds.length} not found)` : ''} [IP: ${ip}]`,
        },
      });
    } catch (error) {
      logger.warn('Audit logging failed', { error });
    }

    return NextResponse.json({
      success: true,
      action,
      processed: resultCount,
      notFound: missingIds.length,
      missingIds: missingIds.slice(0, 10),
    });
  } catch (error) {
    logger.error('Bulk users operation failed', {
      error: String(error),
      action: body?.action,
    });
    return NextResponse.json(
      {
        error: 'Bulk operation failed',
        details: 'An internal error occurred. Please try again later.',
      },
      { status: 500 },
    );
  }
}
