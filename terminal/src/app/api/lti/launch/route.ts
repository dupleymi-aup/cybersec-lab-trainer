import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyLtiLaunch, type LtiClaims } from '@/lib/lti-utils';
import { logger } from '@/lib/logger';

import { DEFAULT_APP_URL } from '@/lib/constants';
/**
 * POST /api/lti/launch
 * Handle LTI 1.3 launch from Moodle/other LMS
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const idToken = formData.get('id_token') as string;
    const _state = formData.get('state') as string;

    if (!idToken) {
      return NextResponse.json({ error: 'Missing id_token' }, { status: 400 });
    }

    // Extract issuer from the token to find the platform
    let issuer = '';
    try {
      const parts = idToken.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      issuer = payload.iss || '';
    } catch (e) {
      logger.error('LTI launch failed', { error: String(e) });
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
    let claims: LtiClaims | null = null;
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

      // Don't leak internal error details to client
      return NextResponse.json(
        { error: 'LTI launch verification failed. Please try again or contact your instructor.' },
        { status: 401 }
      );
    }

    // Extract user info from claims
    const email = claims.email || claims.sub;
    const name = claims.name || email;
    const roles = claims.roles || [];

    // Determine role from LTI roles
    // Security: auto-provisioned users are capped to student/teacher only.
    // Admin role requires manual approval — even if LTI claims say "administrator",
    // we cap it to teacher to prevent privilege escalation from compromised/misconfigured LMS.
    const isTeacher = roles.some((r) =>
      r.toLowerCase().includes('instructor') ||
      r.toLowerCase().includes('teacher'),
    );
    const role = isTeacher ? 'teacher' : 'student';

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

    // Build redirect URL without token in query string to prevent token leakage
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
    const redirectUrl = `${appUrl}/lti-callback?platform=${platform.id}`;

    const response = NextResponse.json({
      success: true,
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });

    // Set httpOnly cookie for XSS protection
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    logger.error('LTI launch error', { error: String(error) });
    return NextResponse.json(
      { error: 'LTI launch failed. Contact your instructor if this persists.' },
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

    const keys: Array<Record<string, unknown>> = [];
    for (const platform of platforms) {
      try {
        const jwk = await parsePublicKeyToJWK(platform.publicKey, platform.id);
        keys.push(jwk);
      } catch (e) {
        logger.error('Failed to parse public key to JWK', { error: String(e), platformId: platform.id });
        // Skip invalid keys
      }
    }

    return NextResponse.json({ keys });
  } catch (e) {
    logger.error('Failed to get LTI platforms keys', { error: String(e) });
    return NextResponse.json({ keys: [] });
  }
}

async function parsePublicKeyToJWK(pem: string, kid: string) {
  const { importSPKI, exportJWK } = await import('jose');
  const key = await importSPKI(pem, 'RS256');
  const exported = await exportJWK(key);
  return {
    kty: exported.kty,
    n: exported.n,
    e: exported.e,
    kid,
    use: 'sig' as const,
    alg: 'RS256' as const,
  };
}
