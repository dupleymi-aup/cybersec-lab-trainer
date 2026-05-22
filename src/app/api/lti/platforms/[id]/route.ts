import { NextRequest, NextResponse } from 'next/server';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';

/**
 * GET /api/lti/platforms/[id]
 * Get a single LTI platform
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  if (!requireRole(auth.role, 'admin', 'teacher')) return forbidden();

  const { id } = await params;

  const platform = await prisma.ltiPlatform.findUnique({
    where: { id },
    include: {
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

  return NextResponse.json(platform);
}

/**
 * PUT /api/lti/platforms/[id]
 * Update an LTI platform (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  if (!requireRole(auth.role, 'admin')) return forbidden();

  const { id } = await params;
  const body = await request.json();

  try {
    const platform = await prisma.ltiPlatform.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.issuer !== undefined && { issuer: body.issuer }),
        ...(body.clientId !== undefined && { clientId: body.clientId }),
        ...(body.authUrl !== undefined && { authUrl: body.authUrl }),
        ...(body.tokenUrl !== undefined && { tokenUrl: body.tokenUrl }),
        ...(body.keysetUrl !== undefined && { keysetUrl: body.keysetUrl }),
        ...(body.deploymentId !== undefined && { deploymentId: body.deploymentId }),
        ...(body.publicKey !== undefined && { publicKey: body.publicKey }),
        ...(body.privateKey !== undefined && { privateKey: body.privateKey }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(platform);
  } catch {
    return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
  }
}

/**
 * DELETE /api/lti/platforms/[id]
 * Delete an LTI platform (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  if (!requireRole(auth.role, 'admin')) return forbidden();

  const { id } = await params;

  try {
    await prisma.ltiPlatform.delete({ where: { id } });

    const adminUser = await prisma.user.findUnique({ where: { id: auth.id } });
    await prisma.auditLog.create({
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
  } catch {
    return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
  }
}
