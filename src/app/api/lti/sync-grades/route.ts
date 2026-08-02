import { NextRequest, NextResponse } from 'next/server';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { getPrisma } from '@/lib/db';
import { syncGradesToPlatform } from '@/lib/lti-utils';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const syncGradesSchema = z.object({
  platformId: z.string().min(1).max(128),
  userId: z.string().min(1).max(128),
  moduleId: z.string().min(1).max(128),
  score: z.number().min(0).max(10000).optional(),
  maximumScore: z.number().min(1).max(10000).optional(),
  label: z.string().max(256).optional(),
});

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
    const parsed = syncGradesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { platformId, userId, moduleId, score, maximumScore, label } = parsed.data;

    // Teachers can only sync grades for students in their group
    if (auth.role !== 'admin') {
      const targetUser = await getPrisma().user.findUnique({ where: { id: userId }, select: { group: true, role: true } });
      if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (targetUser.role !== 'student') return NextResponse.json({ error: 'Can only sync grades for students' }, { status: 403 });
      const teacher = await getPrisma().user.findUnique({ where: { id: auth.id }, select: { group: true } });
      if (!teacher || teacher.group !== targetUser.group) return forbidden();
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
