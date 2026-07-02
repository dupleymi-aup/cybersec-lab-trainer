import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';
import { getAdminActionStats, getRecentAdminActions } from '@/lib/admin-actions-utils';

/**
 * GET /api/admin-actions
 * Admin-only: List all admin actions with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get('actionType');
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const adminId = searchParams.get('adminId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const stats = searchParams.get('stats') === 'true';
    const recent = searchParams.get('recent') === 'true';

    // Return statistics
    if (stats) {
      const statsData = await getAdminActionStats(adminId || auth.id);
      return NextResponse.json(statsData);
    }

    // Return recent actions
    if (recent) {
      const actions = await getRecentAdminActions(limit);
      return NextResponse.json({ actions });
    }

    const where: Record<string, string> = {};

    if (actionType) where.actionType = actionType;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (adminId) where.adminId = adminId;

    const skip = (page - 1) * limit;

    const [actions, total] = await Promise.all([
      prisma.adminAction.findMany({
        where,
        include: { admin: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminAction.count({ where }),
    ]);

    return NextResponse.json({
      actions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/admin-actions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

