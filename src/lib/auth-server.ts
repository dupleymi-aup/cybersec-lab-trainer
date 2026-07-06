import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export interface TokenPayload {
  id: string;
  role: string;
  tokenVersion?: number;
  group?: string;
  fullName?: string;
  exp: number;
}

const JWT_SECRET = new TextEncoder().encode(env.tokenSecret);
const JWT_ALGORITHM = "HS256";

export async function generateToken(
  userId: string,
  role: string,
  options?: {
    rememberMe?: boolean;
    group?: string;
    fullName?: string;
    tokenVersion?: number;
  },
): Promise<string> {
  const { rememberMe, group, fullName, tokenVersion } = options || {};
  const expiry = rememberMe ? "30d" : "7d";
  return new SignJWT({ id: userId, role, group, fullName, tokenVersion })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setExpirationTime(expiry)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function signJwt(payload: {
  id: string;
  role: string;
  group?: string;
  fullName?: string;
}): Promise<string> {
  return generateToken(payload.id, payload.role, {
    group: payload.group,
    fullName: payload.fullName,
  });
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });
    if (!payload.id || !payload.role || !payload.exp) return null;
    return {
      id: payload.id as string,
      role: payload.role as string,
      tokenVersion: payload.tokenVersion as number | undefined,
      group: payload.group as string | undefined,
      fullName: payload.fullName as string | undefined,
      exp: payload.exp as number,
    };
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      logger.warn("verifyToken failed", { error: e });
    return null;
  }
}

export async function getTokenPayload(
  token: string | null,
): Promise<TokenPayload | null> {
  if (!token) return null;
  return verifyToken(token);
}

export async function authenticate(
  token: string | null,
): Promise<{ id: string; role: string } | null> {
  const payload = await getTokenPayload(token);
  if (!payload) return null;
  return { id: payload.id, role: payload.role };
}
