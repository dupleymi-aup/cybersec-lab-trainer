'use client';

import { useLocale } from 'next-intl';
import { resolveLocale } from './locale-utils';

export function useDateFormatter() {
  const locale = useLocale();
  const resolved = resolveLocale(locale);

  return function formatDate(date: Date | string | number, opts?: Intl.DateTimeFormatOptions): string {
    return new Date(date).toLocaleDateString(resolved, opts);
  };
}

export function useDateTimeFormatter() {
  const locale = useLocale();
  const resolved = resolveLocale(locale);

  return function formatDateTime(date: Date | string | number, opts?: Intl.DateTimeFormatOptions): string {
    return new Date(date).toLocaleString(resolved, opts);
  };
}
