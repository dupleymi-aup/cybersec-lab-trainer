/**
 * CSRF token utilities for client-side requests.
 * Provides functions to get the current CSRF token from cookies
 * and headers to include in fetch requests.
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Get the current CSRF token from the cookie.
 * The cookie is set by the Next.js middleware.
 */
export function getCsrfToken(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Get headers object with CSRF token included.
 * Use this when making state-changing requests (POST, PUT, DELETE, PATCH).
 *
 * @param extraHeaders - Additional headers to include
 * @returns Headers object with Content-Type and X-CSRF-Token
 */
export function getCsrfHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  const token = getCsrfToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
    ...extraHeaders,
  };
}

/**
 * Make a fetch request with CSRF protection.
 * Automatically includes the CSRF token in headers for state-changing requests.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (method, body, etc.)
 * @returns The fetch response
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { method = 'GET', body, headers, ...rest } = options;

  const isStateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  const requestHeaders: Record<string, string> = {
    ...((headers as Record<string, string>) || {}),
  };

  if (isStateChanging) {
    Object.assign(requestHeaders, getCsrfHeaders());
  }

  return fetch(url, {
    method,
    headers: requestHeaders,
    body,
    ...rest,
  });
}
