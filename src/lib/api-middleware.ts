import { NextRequest, NextResponse } from 'next/server';
import { generateToken, getTokenPayload, type TokenPayload } from '@/lib/auth-server';

export type { TokenPayload };

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return request.cookies.get('auth-token')?.value || null;
}

export async function authenticate(request: NextRequest): Promise<{ id: string; role: string; group?: string; fullName?: string } | null> {
  const token = getTokenFromRequest(request);
  const payload = getTokenPayload(token);
  if (!payload) return null;
  // Explicitly check expiration even though jwt.verify does this — defense in depth
  if (payload.exp < Date.now() / 1000) return null;
  return { id: payload.id, role: payload.role, group: payload.group, fullName: payload.fullName };
}

export const ROLE_HIERARCHY: Record<string, number> = {
  student: 0,
  teacher: 1,
  admin: 2,
};

export function requireRole(userRole: string, ...requiredRoles: string[]): boolean {
  const userLevel = ROLE_HIERARCHY[userRole];
  if (userLevel === undefined) return false;
  return requiredRoles.some(requiredRole => {
    const requiredLevel = ROLE_HIERARCHY[requiredRole];
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

/** Extract client IP from request, checking proxy headers */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
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
