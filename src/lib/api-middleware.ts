import { NextRequest, NextResponse } from 'next/server';
import { generateToken, getTokenPayload, type TokenPayload } from '@/lib/auth-server';
import { ROLE_HIERARCHY, hasPermission, type UserRole } from './auth-types';
import { hasCapability, hasAnyCapability, hasCapabilities, type Capability } from './capabilities';
import { prisma } from '@/lib/db';

export type { TokenPayload };

export interface AuthUser {
  id: string;
  role: string;
  group?: string;
  fullName?: string;
  tokenVersion?: number;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return request.cookies.get('auth-token')?.value || null;
}

export async function authenticate(request: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  const payload = await getTokenPayload(token);
  if (!payload) return null;
  if (payload.exp < Date.now() / 1000) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { tokenVersion: true, isBlocked: true, role: true },
  });

  if (!user || user.isBlocked) return null;
  if (user.tokenVersion !== (payload.tokenVersion ?? 0)) return null;

  return {
    id: payload.id,
    role: payload.role,
    group: payload.group,
    fullName: payload.fullName,
    tokenVersion: user.tokenVersion,
  };
}

export function requireRole(userRole: string, ...requiredRoles: string[]): boolean {
  const hierarchy = ROLE_HIERARCHY as Record<string, number>;
  const userLevel = hierarchy[userRole];
  if (userLevel === undefined) return false;
  return requiredRoles.some((requiredRole) => {
    const requiredLevel = hierarchy[requiredRole];
    if (requiredLevel === undefined) return false;
    return userLevel >= requiredLevel;
  });
}

export function requirePermission(userRole: string, permission: string): boolean {
  return hasPermission(userRole as UserRole, permission);
}

/**
 * Check if the authenticated user possesses a specific capability.
 * Returns true if the user has the capability (or is an admin).
 */
export function requireCapability(auth: AuthUser | null, capability: Capability): boolean {
  if (!auth) return false;
  return hasCapability(auth.role as UserRole, capability);
}

/**
 * Check if the authenticated user possesses ALL specified capabilities.
 */
export function requireCapabilities(auth: AuthUser | null, ...capabilities: Capability[]): boolean {
  if (!auth) return false;
  return hasCapabilities(auth.role as UserRole, ...capabilities);
}

/**
 * Check if the authenticated user possesses ANY of the specified capabilities.
 */
export function requireAnyCapability(auth: AuthUser | null, ...capabilities: Capability[]): boolean {
  if (!auth) return false;
  return hasAnyCapability(auth.role as UserRole, ...capabilities);
}

/**
 * Guard middleware — authenticate + check capability in one call.
 * Returns null on success (no error), or a NextResponse on failure.
 *
 * Usage:
 *   const guard = await withCapability(request, 'assignments:grade');
 *   if (guard) return guard; // 401 or 403
 *   const { auth } = guard;  // type-narrowed AuthUser
 */
export async function withCapability(
  request: NextRequest,
  capability: Capability,
): Promise<{ auth: AuthUser } | NextResponse> {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!hasCapability(auth.role as UserRole, capability)) return forbidden();
  return { auth };
}

/**
 * Guard middleware — authenticate + check ANY of the given capabilities.
 */
export async function withAnyCapability(
  request: NextRequest,
  ...capabilities: Capability[]
): Promise<{ auth: AuthUser } | NextResponse> {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!hasAnyCapability(auth.role as UserRole, ...capabilities)) return forbidden();
  return { auth };
}

/**
 * Guard middleware — authenticate + check ALL of the given capabilities.
 */
export async function withAllCapabilities(
  request: NextRequest,
  ...capabilities: Capability[]
): Promise<{ auth: AuthUser } | NextResponse> {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();
  if (!hasCapabilities(auth.role as UserRole, ...capabilities)) return forbidden();
  return { auth };
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** Extract client IP from request, checking standard proxy headers */
export function getClientIp(request: NextRequest): string {
  // x-forwarded-for: set by most reverse proxies (nginx, Cloudflare, Vercel)
  // Contains comma-separated IPs, leftmost is the original client
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const clientIp = forwarded.split(',')[0].trim();
    if (clientIp) return clientIp;
  }

  // x-real-ip: set by nginx as an alternative
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const MAX_RATE_LIMIT_ENTRIES = 10000;

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): { allowed: boolean; retryAfter?: number } {
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
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return { allowed: true };
}

export { generateToken };
