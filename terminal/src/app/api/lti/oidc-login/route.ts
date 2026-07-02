import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * POST /api/lti/oidc-login
 * Step 1 of LTI 1.3 launch: OIDC login initiation
 * Moodle sends a login_hint and target_link_uri, we redirect to the platform's auth URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      iss, // issuer (platform URL)
      login_hint,
      target_link_uri,
      client_id,
      lti_message_hint,
      state,
      nonce,
    } = body;

    if (!iss || !login_hint || !target_link_uri) {
      return NextResponse.json(
        { error: 'Missing required OIDC login parameters: iss, login_hint, target_link_uri' },
        { status: 400 },
      );
    }

    // Find the platform by issuer
    const platform = await prisma.ltiPlatform.findFirst({
      where: { issuer: iss, isActive: true },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'No active LTI platform found for the provided issuer' },
        { status: 404 },
      );
    }

    // Use platform-specific client_id if provided, otherwise use stored one
    const effectiveClientId = client_id || platform.clientId;

    // Build the OIDC auth request URL
    const authUrl = new URL(platform.authUrl);
    authUrl.searchParams.set('scope', 'openid');
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('client_id', effectiveClientId);
    authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/lti/launch`);
    authUrl.searchParams.set('login_hint', login_hint);
    authUrl.searchParams.set('state', state || crypto.randomUUID());
    authUrl.searchParams.set('nonce', nonce || crypto.randomUUID());
    authUrl.searchParams.set('response_mode', 'form_post');
    authUrl.searchParams.set('prompt', 'none');

    if (lti_message_hint) {
      authUrl.searchParams.set('lti_message_hint', lti_message_hint);
    }

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state: authUrl.searchParams.get('state'),
    });
  } catch (error) {
    logger.error('LTI OIDC login error', { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/lti/oidc-login
 * Handle GET OIDC login request (Moodle may send as GET)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const body = {
    iss: searchParams.get('iss') || '',
    login_hint: searchParams.get('login_hint') || '',
    target_link_uri: searchParams.get('target_link_uri') || '',
    client_id: searchParams.get('client_id') || undefined,
    lti_message_hint: searchParams.get('lti_message_hint') || undefined,
    state: searchParams.get('state') || undefined,
    nonce: searchParams.get('nonce') || undefined,
  };

  // Inline the POST logic for GET requests
  try {
    if (!body.iss || !body.login_hint || !body.target_link_uri) {
      return NextResponse.json(
        { error: 'Missing required OIDC login parameters: iss, login_hint, target_link_uri' },
        { status: 400 },
      );
    }

    const platform = await prisma.ltiPlatform.findFirst({
      where: { issuer: body.iss, isActive: true },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'No active LTI platform found for the provided issuer' },
        { status: 404 },
      );
    }

    const effectiveClientId = body.client_id || platform.clientId;
    const authUrl = new URL(platform.authUrl);
    authUrl.searchParams.set('scope', 'openid');
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('client_id', effectiveClientId);
    authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/lti/launch`);
    authUrl.searchParams.set('login_hint', body.login_hint);
    authUrl.searchParams.set('state', body.state || crypto.randomUUID());
    authUrl.searchParams.set('nonce', body.nonce || crypto.randomUUID());
    authUrl.searchParams.set('response_mode', 'form_post');
    authUrl.searchParams.set('prompt', 'none');

    if (body.lti_message_hint) {
      authUrl.searchParams.set('lti_message_hint', body.lti_message_hint);
    }

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state: authUrl.searchParams.get('state'),
    });
  } catch (error) {
    logger.error('LTI OIDC login error', { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
