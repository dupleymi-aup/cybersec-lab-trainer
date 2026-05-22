import { NextRequest, NextResponse } from 'next/server';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const CSRF_COOKIE_NAME = 'csrf-token';

function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set CSRF token cookie on every response
  let csrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
  }

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be readable by client for double-submit pattern
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Verify CSRF token on state-changing requests
  if (!SAFE_METHODS.includes(request.method)) {
    const headerToken = request.headers.get('x-csrf-token');
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return NextResponse.json(
        { error: 'CSRF token missing or invalid' },
        { status: 403 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|offline).*)',
  ],
};
