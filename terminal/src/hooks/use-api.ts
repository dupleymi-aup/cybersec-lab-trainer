'use client';

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { getCsrfHeaders } from '@/lib/csrf-client';
import { getAuthHeaders } from '@/lib/store';

type ApiQueryKey = readonly [string, Record<string, string | undefined>?];

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers as Record<string, string> || {}),
      },
    });
    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody.error) errorMsg = errBody.error;
      } catch {
        // ignore parse errors
      }
      throw new Error(errorMsg);
    }
    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export function useApiQuery<T>(
  queryKey: ApiQueryKey,
  options?: Omit<UseQueryOptions<T, Error, T, ApiQueryKey>, 'queryKey' | 'queryFn'>,
) {
  const [url] = queryKey;
  return useQuery<T, Error, T, ApiQueryKey>({
    queryKey,
    queryFn: ({ signal }) => {
      const controller = signal ? new AbortController() : undefined;
      if (signal) {
        signal.addEventListener('abort', () => controller?.abort());
      }
      return apiRequest<T>(url, { signal: controller?.signal });
    },
    ...options,
  });
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>,
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const body = variables !== undefined ? JSON.stringify(variables) : undefined;
      const csrfHeaders = getCsrfHeaders();
      const authHeaders = await getAuthHeaders();
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...csrfHeaders,
        },
        body,
      });
      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody.error) errorMsg = errBody.error;
        } catch {
          // ignore parse errors
        }
        throw new Error(errorMsg);
      }
      return res.json();
    },
    ...options,
  });
}

export function useApiInvalidate() {
  const queryClient = useQueryClient();
  return (queryKey: ApiQueryKey) => queryClient.invalidateQueries({ queryKey });
}

export function createApiQueryKey(url: string, params?: Record<string, string | undefined>): ApiQueryKey {
  return [url, params] as const;
}
