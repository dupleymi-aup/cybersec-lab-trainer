import { exportJWK, generateKeyPair, importSPKI, SignJWT, jwtVerify, type JWK } from 'jose';
import { prisma } from '@/lib/db';

export interface LtiClaims {
  sub: string;
  name: string;
  email: string;
  roles: string[];
  'https://purl.imsglobal.org/spec/lti/claim/target_link_uri'?: string;
  'https://purl.imsglobal.org/spec/lti/claim/deployment_id'?: string;
  'https://purl.imsglobal.org/spec/lti/claim/message_type'?: string;
  'https://purl.imsglobal.org/spec/lti/claim/version'?: string;
  'https://purl.imsglobal.org/spec/lti/claim/resource_link'?: {
    id: string;
    title?: string;
  };
  'https://purl.imsglobal.org/spec/lti/claim/lis'?: {
    person_sourcedid?: string;
    course_offering_sourcedid?: string;
  };
  'https://purl.imsglobal.org/spec/lti/claim/context'?: {
    id: string;
    label?: string;
    title?: string;
  };
  'https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice'?: {
    context_memberships_url: string;
    service_versions: string[];
  };
  'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'?: {
    scope: string[];
    lineitems: string;
    lineitem: string;
  };
}

export interface PlatformKey {
  kid: string;
  key: string; // PEM public key
}

const JWKS_CACHE = new Map<string, { keys: JWK[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate RSA key pair for LTI tool
 */
export async function generateToolKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const pubKey = new Uint8Array(await crypto.subtle.exportKey('spki', publicKey));
  const privKey = new Uint8Array(await crypto.subtle.exportKey('pkcs8', privateKey));

  return {
    publicKey: Buffer.from(pubKey).toString('base64'),
    privateKey: Buffer.from(privKey).toString('base64'),
  };
}

/**
 * Fetch JWKS from LTI platform
 */
export async function fetchPlatformJwks(keysetUrl: string): Promise<JWK[]> {
  const cached = JWKS_CACHE.get(keysetUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.keys;
  }

  const response = await fetch(keysetUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS from ${keysetUrl}: ${response.status}`);
  }

  const jwks = await response.json();
  JWKS_CACHE.set(keysetUrl, { keys: jwks.keys, timestamp: Date.now() });
  return jwks.keys;
}

/**
 * Verify LTI 1.3 launch JWT
 */
export async function verifyLtiLaunch(
  idToken: string,
  issuer: string,
  keysetUrl: string,
  clientId: string,
  deploymentId: string,
): Promise<LtiClaims> {
  const jwks = await fetchPlatformJwks(keysetUrl);

  let result;
  let verified = false;

  for (const key of jwks) {
    try {
      result = await jwtVerify(idToken, key);
      verified = true;
      break;
    } catch {
      // Try next key
    }
  }

  if (!verified || !result) {
    throw new Error('Invalid LTI launch token');
  }

  const payload = result.payload as unknown as LtiClaims;

  // Validate required claims
  if (payload.iss !== issuer) {
    throw new Error(`Issuer mismatch: expected ${issuer}, got ${payload.iss}`);
  }

  if (!payload.sub) {
    throw new Error('Missing sub claim');
  }

  const deploymentClaim =
    payload['https://purl.imsglobal.org/spec/lti/claim/deployment_id'];
  if (deploymentClaim !== deploymentId) {
    throw new Error(`Deployment ID mismatch: expected ${deploymentId}, got ${deploymentClaim}`);
  }

  const messageType =
    payload['https://purl.imsglobal.org/spec/lti/claim/message_type'];
  if (messageType !== 'LtiResourceLinkRequest' && messageType !== 'LtiDeepLinkingRequest') {
    throw new Error(`Invalid LTI message type: ${messageType}`);
  }

  return payload;
}

/**
 * Sign a JWT for AGS grade passback
 */
export async function signAgsToken(
  privateKeyPem: string,
  tokenUrl: string,
  clientId: string,
): Promise<string> {
  const privateKey = await importSPKI(privateKeyPem, 'RS256');

  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    sub: clientId,
    iss: clientId,
    aud: tokenUrl,
    iat: now,
    exp: now + 3600,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: 'RS256' })
    .sign(privateKey);
}

/**
 * Sync grades to Moodle via AGS
 */
export async function syncGradesToPlatform(
  platformId: string,
  userId: string,
  moduleId: string,
  score: number,
  maximumScore: number,
  label: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const platform = await prisma.ltiPlatform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      return { success: false, error: 'Platform not found' };
    }

    if (!platform.privateKey) {
      return { success: false, error: 'Platform private key not configured' };
    }

    const agsToken = await signAgsToken(platform.privateKey, platform.tokenUrl, platform.clientId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const lineitemUrl = `${platform.tokenUrl}/lineitems`;

    // Create lineitem if needed
    const lineitemResponse = await fetch(lineitemUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${agsToken}`,
        'Content-Type': 'application/vnd.ims.lis.v2.lineitem+json',
      },
      body: JSON.stringify({
        scoreMaximum: maximumScore,
        label,
        resourceId: moduleId,
        tag: moduleId,
      }),
    });

    if (!lineitemResponse.ok) {
      const error = await lineitemResponse.text();
      return { success: false, error: `Failed to create lineitem: ${error}` };
    }

    const lineitem = await lineitemResponse.json();
    const lineitemId = lineitem.id;

    // Send score
    const scoresUrl = `${lineitemId}/scores`;
    const scoreResponse = await fetch(scoresUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${agsToken}`,
        'Content-Type': 'application/vnd.ims.lis.v1.score+json',
      },
      body: JSON.stringify({
        userId: user.email,
        scoreGiven: score,
        scoreMaximum: maximumScore,
        activityProgress: 'Completed',
        gradingProgress: 'FullyGraded',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!scoreResponse.ok) {
      const error = await scoreResponse.text();
      return { success: false, error: `Failed to send score: ${error}` };
    }

    // Log the sync
    await prisma.ltiGradeSync.create({
      data: {
        platformId,
        userId,
        lineitemId,
        lineitemLabel: label,
        score,
        scoreMaximum: maximumScore,
        status: 'synced',
        syncedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Fetch members from Moodle NRPS
 */
export async function fetchNrpsMembers(
  contextMembershipsUrl: string,
  tokenUrl: string,
  clientId: string,
  privateKeyPem: string,
): Promise<Array<{ userId: string; email: string; name: string; status: string }>> {
  try {
    const agsToken = await signAgsToken(privateKeyPem, tokenUrl, clientId);

    const response = await fetch(contextMembershipsUrl, {
      headers: {
        Authorization: `Bearer ${agsToken}`,
        Accept: 'application/vnd.ims.lti-nrps.v2.membershipcontainer+json',
      },
    });

    if (!response.ok) {
      throw new Error(`NRPS fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return (data.members || []).map((member: Record<string, unknown>) => ({
      userId: (member.user_id as string) || '',
      email: (member.email as string) || '',
      name: (member.name as string) || '',
      status: (member.status as string) || 'Active',
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`NRPS sync failed: ${message}`);
  }
}
