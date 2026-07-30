import { NextRequest, NextResponse } from 'next/server';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { getPrisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/lti/platforms
 * List all LTI platforms (admin/teacher only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) return unauthorized();

    if (!requireRole(auth.role, 'admin', 'teacher')) return forbidden();

    const platforms = await getPrisma().ltiPlatform.findMany({
      select: {
        id: true,
        name: true,
        issuer: true,
        clientId: true,
        authUrl: true,
        tokenUrl: true,
        keysetUrl: true,
        deploymentId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            gradeSyncs: true,
            launchLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(platforms);
  } catch (error) {
    logger.error('Failed to list LTI platforms', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/lti/platforms
 * Create a new LTI platform (admin only)
 */
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  if (!requireRole(auth.role, 'admin')) return forbidden();

  try {
    const body = await request.json();
    const { name, issuer, clientId, authUrl, tokenUrl, keysetUrl, deploymentId, publicKey, privateKey } = body;

    if (!name || !issuer || !clientId || !authUrl || !tokenUrl || !keysetUrl || !deploymentId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: name, issuer, clientId, authUrl, tokenUrl, keysetUrl, deploymentId',
        },
        { status: 400 },
      );
    }

    // Validate URL schemes to prevent javascript:/data: URLs
    const urlFields = { authUrl, tokenUrl, keysetUrl };
    for (const [fieldName, urlValue] of Object.entries(urlFields)) {
      try {
        const parsed = new URL(urlValue as string);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return NextResponse.json({ error: `${fieldName} must use http: or https: protocol` }, { status: 400 });
        }
      } catch (e) {
        logger.error('Invalid JSON in platforms POST', { error: String(e) });
        return NextResponse.json({ error: `${fieldName} is not a valid URL` }, { status: 400 });
      }
    }

    const platform = await getPrisma().ltiPlatform.create({
      data: {
        name,
        issuer,
        clientId,
        authUrl,
        tokenUrl,
        keysetUrl,
        deploymentId,
        publicKey: publicKey || '',
        privateKey: privateKey || null,
      },
    });

    // Log audit
    const adminUser = await getPrisma().user.findUnique({ where: { id: auth.id } });
    await getPrisma().auditLog.create({
      data: {
        id: crypto.randomUUID(),
        adminId: auth.id,
        adminName: adminUser?.fullName || adminUser?.email || 'Unknown',
        action: 'lti_platform_created',
        targetId: platform.id,
        targetName: platform.name,
        details: `LTI platform created: ${name}`,
      },
    });

    return NextResponse.json(platform, { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Platform with this issuer or client ID already exists' }, { status: 409 });
    }
    logger.error('Failed to create LTI platform', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
