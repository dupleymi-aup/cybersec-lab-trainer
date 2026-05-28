/**
 * Environment variable validation.
 * Validates required env vars at startup.
 */

export interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  appUrl: string;
  databaseUrl: string;
  tokenSecret: string;
}

function validateEnv(): EnvConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be development, production, or test.`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    new URL(appUrl);
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[env.ts] validateEnv failed:", e);
    throw new Error(`Invalid NEXT_PUBLIC_APP_URL: ${appUrl}. Must be a valid URL.`);
  }

  const databaseUrl = process.env.DATABASE_URL || '';
  if (!databaseUrl && ['production', 'development'].includes(nodeEnv)) {
    console.warn('DATABASE_URL not set. Database features will be disabled. Set DATABASE_URL in .env to enable Prisma.');
  }

  const tokenSecret = process.env.TOKEN_SECRET || 'dev-secret-change-in-production';
  if (nodeEnv === 'production' && tokenSecret === 'dev-secret-change-in-production') {
    throw new Error('TOKEN_SECRET must be set in production. Generate a random 32+ character string.');
  }

  return { nodeEnv, appUrl, databaseUrl, tokenSecret };
}

export const env = validateEnv();
