"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";

interface UseAnalyticsFetchOptions<_T> {
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
  params = "",
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
          if (err.name === "AbortError") return;
          logger.error(`useAnalyticsFetch: Failed to fetch ${endpoint}`, { error: err });
          setError(err.message || "Ошибка загрузки данных");
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

/**
 * Custom hook for fetch-based data loading using a custom fetcher function.
 * For components that need data transformation, custom headers, or non-URL fetch logic.
 * Provides the same loading/error/cleanup guarantees as useAnalyticsFetch.
 */
export function useAnalyticsFetcher<T = unknown>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  enabled = true,
): UseAnalyticsFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFetcher = useCallback(fetcher, [...deps, refetchKey]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    stableFetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Ошибка загрузки данных",
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stableFetcher, enabled]);

  return { data, loading, error, refetch };
}

/**
 * Custom hook for mutation operations (POST/PUT/DELETE).
 * Does NOT auto-execute — call mutate() when needed.
 * Provides loading/error state and AbortController cleanup.
 */
export function useAnalyticsMutation<TResult = unknown, TBody = unknown>() {
  const [data, setData] = useState<TResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const mutate = useCallback(
    async (
      endpoint: string,
      method: "POST" | "PUT" | "DELETE" | "PATCH" = "POST",
      body?: TBody,
    ): Promise<TResult | null> => {
      // Cancel any in-flight request
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const csrfToken =
          typeof document !== "undefined"
            ? document.cookie
                .split(";")
                .find((c) => c.trim().startsWith("csrf-token="))
                ?.split("=")[1]
            : undefined;
        if (csrfToken) {
          headers["x-csrf-token"] = csrfToken;
        }

        const res = await fetch(endpoint, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        if (!res.ok) {
          let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
          try {
            const errBody = await res.json();
            if (errBody.error) errorMsg = errBody.error;
          } catch {
            // response body not JSON
          }
          throw new Error(errorMsg);
        }

        const result = await res.json();
        setData(result);
        setLoading(false);
        return result;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return null;
        const message =
          err instanceof Error ? err.message : "Ошибка выполнения";
        setError(message);
        setLoading(false);
        return null;
      }
    },
    [],
  );

  return { data, loading, error, mutate };
}
