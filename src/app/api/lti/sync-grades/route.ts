import { NextRequest, NextResponse } from 'next/server';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { getPrisma } from '@/lib/db';
import { syncGradesToPlatform } from '@/lib/lti-utils';
import { logger } from '@/lib/logger';

/**
 * POST /api/lti/sync-grades
 * Trigger grade sync to LTI platform for a specific user and module
 */
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  if (!requireRole(auth.role, 'teacher', 'admin')) return forbidden();

  try {
    const body = await request.json();
    const { platformId, userId, moduleId, score, maximumScore, label } = body;

    if (!platformId || !userId || !moduleId) {
      return NextResponse.json({ error: 'Missing required fields: platformId, userId, moduleId' }, { status: 400 });
    }

    const result = await syncGradesToPlatform(
      platformId,
      userId,
      moduleId,
      score ?? 100,
      maximumScore ?? 100,
      label || `Module: ${moduleId}`,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error, status: 'failed' }, { status: 400 });
    }

    return NextResponse.json({ status: 'synced' });
  } catch (error) {
    logger.error('LTI grade sync error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/lti/sync-grades
 * Get grade sync status for a platform
 */
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  if (!requireRole(auth.role, 'teacher', 'admin')) return forbidden();

  const { searchParams } = new URL(request.url);
  const platformId = searchParams.get('platformId');

  if (!platformId) {
    // Return all platforms with sync stats
    const platforms = await getPrisma().ltiPlatform.findMany({
      include: {
        _count: {
          select: { gradeSyncs: true },
        },
        gradeSyncs: {
          select: {
            status: true,
            syncedAt: true,
          },
          orderBy: { syncedAt: 'desc' },
          take: 10,
        },
      },
    });

    return NextResponse.json(platforms);
  }

  const syncs = await getPrisma().ltiGradeSync.findMany({
    where: { platformId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(syncs);
}
