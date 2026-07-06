/**
 * Safely parse JSON from a Response object, returning a default value on failure.
 * Replaces the repetitive pattern: await res.json().catch(() => ({ error: 'Unknown error' }))
 */
export async function safeJson<T = unknown>(
  response: Response,
  fallback: T = { error: 'Invalid JSON response' } as T,
): Promise<T> {
  try {
    const text = await response.text();
    if (!text) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
