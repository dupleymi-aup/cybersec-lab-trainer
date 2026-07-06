import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NextResponse } from "next/server";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseDays(
  searchParams: URLSearchParams,
  fallback = 30,
  max = 365,
): number {
  const raw = parseInt(searchParams.get("days") || String(fallback), 10);
  if (Number.isNaN(raw) || raw < 1) return 1;
  return Math.min(raw, max);
}

type ParseBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export async function parseBody<T = Record<string, unknown>>(
  request: Request,
): Promise<ParseBodyResult<T>> {
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: data as T };
}
