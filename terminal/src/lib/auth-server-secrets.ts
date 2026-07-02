import { randomBytes } from 'crypto';

/**
 * Server-only module for sensitive secrets.
 * NEVER import this file from client components.
 * Only use in API routes and server-side code.
 */

/**
 * Get the admin invite code from environment.
 * Returns undefined if not configured (registration disabled).
 */
export function getAdminInviteCode(): string | undefined {
  const envCode = process.env.ADMIN_INVITE_CODE;
  if (envCode) return envCode;

  if (process.env.NODE_ENV === 'development') {
    const code = randomBytes(10).toString('hex');
    // eslint-disable-next-line no-console -- intentional dev-only logging
    console.log(`[DEV] Admin invite code: ${code}`);
    return code;
  }

  return undefined;
}
