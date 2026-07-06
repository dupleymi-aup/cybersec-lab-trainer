import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
