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

  // Only allow default in development
  if (process.env.NODE_ENV === 'development') {
    return 'CYBERSEC-ADMIN-2024';
  }

  return undefined;
}
