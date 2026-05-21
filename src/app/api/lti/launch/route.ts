import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyLtiLaunch, LtiClaims } from '@/lib/lti-utils';

/**
 * POST /api/lti/launch
 * Handle LTI 1.3 launch from Moodle/other LMS
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const idToken = formData.get('id_token') as string;
    const state = formData.get('state') as string;

    if (!idToken) {
      return NextResponse.json({ error: 'Missing id_token' }, { status: 400 });
    }

    // Extract issuer from the token to find the platform
    let issuer = '';
    try {
      const parts = idToken.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      issuer = payload.iss || '';
    } catch {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    // Find the platform by issuer
    const platform = await prisma.ltiPlatform.findFirst({
      where: { issuer, isActive: true },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'LTI platform not found or inactive' },
        { status: 404 },
      );
    }

    // Verify the launch token
    let claims: LtiClaims;
    try {
      claims = await verifyLtiLaunch(
        idToken,
        platform.issuer,
        platform.keysetUrl,
        platform.clientId,
        platform.deploymentId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Log failed launch
      await prisma.ltiLaunchLog.create({
        data: {
          platformId: platform.id,
          email: claims?.email || '',
          launchType: 'full',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || '',
          success: false,
          message,
        },
      });

      return NextResponse.json({ error: `Launch verification failed: ${message}` }, { status: 401 });
    }

    // Extract user info from claims
    const email = claims.email || claims.sub;
    const name = claims.name || email;
    const roles = claims.roles || [];

    // Determine role from LTI roles
    const isTeacher = roles.some((r) =>
      r.toLowerCase().includes('instructor') ||
      r.toLowerCase().includes('teacher'),
    );
    const isAdmin = roles.some((r) =>
      r.toLowerCase().includes('administrator'),
    );
    const role = isAdmin ? 'admin' : isTeacher ? 'teacher' : 'student';

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Auto-provision user from LTI launch
      const userId = crypto.randomUUID();
      // Generate a random password for LTI users (they authenticate via LMS)
      const randomPassword = crypto.randomUUID();
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          phone: `lti-${userId.slice(0, 8)}`, // Placeholder phone
          fullName: name,
          role,
          passwordHash,
        },
      });
    } else {
      // Update user info
      await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: name,
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      });
    }

    // Extract resource link info
    const resourceLink =
      claims['https://purl.imsglobal.org/spec/lti/claim/resource_link'];
    const messageType =
      claims['https://purl.imsglobal.org/spec/lti/claim/message_type'];

    // Log successful launch
    await prisma.ltiLaunchLog.create({
      data: {
        platformId: platform.id,
        userId: user.id,
        email: user.email,
        launchType: messageType === 'LtiDeepLinkingRequest' ? 'deep-link' : 'full',
        resourceId: resourceLink?.id || '',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        success: true,
        message: `LTI launch: ${messageType}`,
      },
    });

    // Generate our own JWT token for the user
    const { signJwt } = await import('@/lib/auth-server');
    const token = await signJwt({ id: user.id, role: user.role });

    // Build redirect URL with token
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${appUrl}/?lti_token=${token}&lti_platform=${platform.id}`;

    return NextResponse.json({
      success: true,
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('LTI launch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/lti/jwks
 * Expose our public JWKS for LTI platforms to verify our tokens (AGS)
 */
export async function GET() {
  try {
    // Return public keys for all active platforms
    const platforms = await prisma.ltiPlatform.findMany({
      where: { isActive: true },
      select: { id: true, publicKey: true },
    });

    const keys = [];
    for (const platform of platforms) {
      try {
        const jwk = await parsePublicKeyToJWK(platform.publicKey, platform.id);
        keys.push(jwk);
      } catch {
        // Skip invalid keys
      }
    }

    return NextResponse.json({ keys });
  } catch {
    return NextResponse.json({ keys: [] });
  }
}

async function parsePublicKeyToJWK(pem: string, kid: string) {
  const { importSPKI, exportJWK } = await import('jose');
  const key = await importSPKI(pem, 'RS256');
  const jwk = await exportJWK(key);
  return {
    ...jwk,
    kid,
    use: 'sig',
    alg: 'RS256',
  };
}
