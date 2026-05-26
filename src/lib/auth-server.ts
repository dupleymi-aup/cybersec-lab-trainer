import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

export interface TokenPayload {
  id: string;
  role: string;
  tokenVersion?: number;  // incremented on role/password change to revoke old tokens
  group?: string;
  fullName?: string;
  exp: number;
}

const JWT_SECRET = env.tokenSecret;
const JWT_ALGORITHM = 'HS256';

export function generateToken(userId: string, role: string, options?: { rememberMe?: boolean; group?: string; fullName?: string; tokenVersion?: number }): string {
  const { rememberMe, group, fullName, tokenVersion } = options || {};
  const expiry = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
  return jwt.sign(
    { id: userId, role, group, fullName, tokenVersion },
    JWT_SECRET,
    { algorithm: JWT_ALGORITHM, expiresIn: expiry }
  );
}

// Alias for LTI integration compatibility
export async function signJwt(payload: { id: string; role: string; group?: string; fullName?: string }): Promise<string> {
  return generateToken(payload.id, payload.role, { group: payload.group, fullName: payload.fullName });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as jwt.JwtPayload;
    if (!decoded.id || !decoded.role || !decoded.exp) return null;
    return {
      id: decoded.id as string,
      role: decoded.role as string,
      tokenVersion: decoded.tokenVersion as number | undefined,
      group: decoded.group as string | undefined,
      fullName: decoded.fullName as string | undefined,
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}

export function getTokenPayload(token: string | null): TokenPayload | null {
  if (!token) return null;
  return verifyToken(token);
}

export async function authenticate(token: string | null): Promise<{ id: string; role: string } | null> {
  const payload = getTokenPayload(token);
  if (!payload) return null;
  return { id: payload.id, role: payload.role };
}
