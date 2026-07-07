import { NextRequest, NextResponse } from 'next/server';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { getPrisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { parseBody } from '@/lib/utils';

/**
 * GET /api/lti/platforms/[id]
 * Get a single LTI platform
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  if (!requireRole(auth.role, 'admin', 'teacher')) return forbidden();

  const { id } = await params;

  const platform = await getPrisma().ltiPlatform.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      issuer: true,
      clientId: true,
      authUrl: true,
      tokenUrl: true,
      keysetUrl: true,
      deploymentId: true,
      publicKey: true,
      // privateKey is intentionally excluded - security sensitive
      isActive: true,
      createdAt: true,
      updatedAt: true,
      gradeSyncs: {
        select: {
          id: true,
          userId: true,
          lineitemLabel: true,
          score: true,
          scoreMaximum: true,
          status: true,
          syncedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      launchLogs: {
        select: {
          id: true,
          userId: true,
          email: true,
          launchType: true,
          success: true,
          message: true,
          launchedAt: true,
        },
        orderBy: { launchedAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!platform) {
    return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
  }

  // For teachers, exclude sensitive fields even from select
  if (auth.role !== 'admin') {
    const { gradeSyncs, launchLogs, ...safePlatform } = platform;
    return NextResponse.json({
      ...safePlatform,
      gradeSyncs,
      launchLogs,
    });
  }

  return NextResponse.json(platform);
}

/**
 * PUT /api/lti/platforms/[id]
 * Update an LTI platform (admin only)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  if (!requireRole(auth.role, 'admin')) return forbidden();

  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyResult = await parseBody<any>(request);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  try {
    const platform = await getPrisma().ltiPlatform.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.issuer !== undefined && { issuer: body.issuer }),
        ...(body.clientId !== undefined && { clientId: body.clientId }),
        ...(body.authUrl !== undefined && { authUrl: body.authUrl }),
        ...(body.tokenUrl !== undefined && { tokenUrl: body.tokenUrl }),
        ...(body.keysetUrl !== undefined && { keysetUrl: body.keysetUrl }),
        ...(body.deploymentId !== undefined && {
          deploymentId: body.deploymentId,
        }),
        ...(body.publicKey !== undefined && { publicKey: body.publicKey }),
        ...(body.privateKey !== undefined && { privateKey: body.privateKey }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(platform);
  } catch (e) {
    logger.error('Failed to update LTI platform', { error: String(e) });
    return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
  }
}

/**
 * DELETE /api/lti/platforms/[id]
 * Delete an LTI platform (admin only)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  if (!requireRole(auth.role, 'admin')) return forbidden();

  const { id } = await params;

  try {
    await getPrisma().ltiPlatform.delete({ where: { id } });

    const adminUser = await getPrisma().user.findUnique({ where: { id: auth.id } });
    await getPrisma().auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: 'lti_platform_deleted',
        targetId: id,
        targetName: id,
        details: 'LTI platform deleted',
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    logger.error('Failed to delete LTI platform', { error: String(e) });
    return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
  }
}
