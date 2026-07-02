import { NextResponse } from 'next/server';

/**
 * Cookie configuration for JWT auth tokens.
 * httpOnly: prevents XSS access to the token
 * secure: only sent over HTTPS in production
 * sameSite: strict CSRF protection
 */
const COOKIE_NAME = 'auth-token';

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
}

const isProduction = process.env.NODE_ENV === 'production';

export function getAuthCookieOptions(rememberMe?: boolean): CookieOptions {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 // 30 days
    : 7 * 24 * 60 * 60; // 7 days

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

/**
 * Create a NextResponse cookie setter for the auth token.
 */
export function setAuthCookie(response: NextResponse, token: string, rememberMe?: boolean): void {
  response.cookies.set(COOKIE_NAME, token, getAuthCookieOptions(rememberMe));
}

/**
 * Create a NextResponse cookie deleter for the auth token.
 */
export function deleteAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export { COOKIE_NAME };
