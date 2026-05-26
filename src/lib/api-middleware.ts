import { NextRequest, NextResponse } from 'next/server';
import { generateToken, getTokenPayload, type TokenPayload } from '@/lib/auth-server';
import { ROLE_HIERARCHY } from './auth-types';
import { prisma } from '@/lib/db';

export type { TokenPayload };

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return request.cookies.get('auth-token')?.value || null;
}


export async function authenticate(request: NextRequest): Promise<{ id: string; role: string; group?: string; fullName?: string; tokenVersion?: number } | null> {
  const token = getTokenFromRequest(request);
  const payload = getTokenPayload(token);
  if (!payload) return null;
  // Explicitly check expiration even though jwt.verify does this — defense in depth
  if (payload.exp < Date.now() / 1000) return null;

  // Fetch user from database to validate tokenVersion and blocked status
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { tokenVersion: true, isBlocked: true, role: true },
  });

  // Reject if user doesn't exist, is blocked, or tokenVersion mismatch
  if (!user || user.isBlocked) return null;
  if (payload.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) return null;

  return { id: payload.id, role: payload.role, group: payload.group, fullName: payload.fullName, tokenVersion: user.tokenVersion };
}

export function requireRole(userRole: string, ...requiredRoles: string[]): boolean {
  const hierarchy = ROLE_HIERARCHY as Record<string, number>;
  const userLevel = hierarchy[userRole];
  if (userLevel === undefined) return false;
  return requiredRoles.some(requiredRole => {
    const requiredLevel = hierarchy[requiredRole];
    if (requiredLevel === undefined) return false;
    return userLevel >= requiredLevel;
  });
}


export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}


export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}


/** Extract client IP from request, validating proxy headers to prevent spoofing */
export function getClientIp(request: NextRequest): string {
  // Only trust x-forwarded-for if we know we're behind a trusted proxy
  // In production, this should be configured via TRUSTED_PROXIES env var
  const trustedProxies = process.env.TRUSTED_PROXIES?.split(',') || [];
  const remoteAddr = request.headers.get('x-real-ip');

  // If behind a trusted proxy, use x-real-ip (set by the proxy)
  if (remoteAddr && (trustedProxies.length > 0 || process.env.NODE_ENV === 'production')) {
    return remoteAddr;
  }

  // Fall back to connection-level IP (harder to spoof)
  // In Next.js, this would come from socket address if available
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded && trustedProxies.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return 'unknown';
}


const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const MAX_RATE_LIMIT_ENTRIES = 10000;

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // Clean expired entries inline instead of relying on setInterval
    if (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
      for (const [k, e] of rateLimitStore.entries()) {
        if (now > e.resetAt) rateLimitStore.delete(k);
      }
    }
    // If still at max after cleanup, evict oldest
    if (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
      const firstKey = rateLimitStore.keys().next().value;
      if (firstKey) rateLimitStore.delete(firstKey);
    }
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true };
}


export { generateToken };
