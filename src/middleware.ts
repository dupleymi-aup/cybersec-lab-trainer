import { NextRequest, NextResponse } from 'next/server';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Public endpoints that should not require CSRF validation
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/recovery',
  '/api/auth/recovery/verify',
  '/api/auth/recovery/reset',
  '/api/health',
  '/api/admin/health',
  '/api/docs',
  '/api/lti',
];

function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(publicPath => pathname.startsWith(publicPath));
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set CSRF token cookie on every response
  let csrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
  }

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be readable by client JS for double-submit pattern
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Verify CSRF token on state-changing requests (skip public endpoints)
  if (!SAFE_METHODS.includes(request.method) && !isPublicPath(request.nextUrl.pathname)) {
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
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
