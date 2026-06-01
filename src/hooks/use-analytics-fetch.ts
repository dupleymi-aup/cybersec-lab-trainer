'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseAnalyticsFetchOptions<T> {
  /** API endpoint URL (e.g., '/api/analytics/engagement') */
  endpoint: string;
  /** Query parameters (e.g., 'days=30&groupId=abc') */
  params?: string;
  /** Whether to automatically fetch data */
  enabled?: boolean;
}

interface UseAnalyticsFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching analytics data with proper cleanup and error handling.
 * Replaces the repeated pattern found in 20+ analytics components:
 * - loading/error state management
 * - AbortController for request cancellation
 * - cancelled ref to prevent state updates on unmounted components
 * - automatic cleanup on unmount
 */
export function useAnalyticsFetch<T = unknown>({
  endpoint,
  params = '',
  enabled = true,
}: UseAnalyticsFetchOptions<T>): UseAnalyticsFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    setError(null);

    const url = params ? `${endpoint}?${params}` : endpoint;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.name === 'AbortError') return;
          console.error(`useAnalyticsFetch: Failed to fetch ${endpoint}:`, err);
          setError(err.message || 'Ошибка загрузки данных');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [endpoint, params, enabled, refetchKey]);

  return { data, loading, error, refetch };
}
