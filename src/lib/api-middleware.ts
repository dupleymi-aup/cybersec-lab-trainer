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

export async function authenticate(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const token = getTokenFromRequest(request);
  const payload = getTokenPayload(token);
  if (!payload) return null;
  return { id: payload.id, role: payload.role };
}

export const ROLE_HIERARCHY: Record<string, number> = {
  student: 0,
  teacher: 1,
  admin: 2,
};

export function requireRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
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
  return request.ip || 'unknown';
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
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
