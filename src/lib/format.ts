'use client';

import { useLocale } from 'next-intl';

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  zh: 'zh-CN',
};

function resolveLocale(locale: string): string {
  return LOCALE_MAP[locale] ?? locale;
}

export function useDateFormatter() {
  const locale = useLocale();
  const resolved = resolveLocale(locale);

  return function formatDate(
    date: Date | string | number,
    opts?: Intl.DateTimeFormatOptions,
  ): string {
    return new Date(date).toLocaleDateString(resolved, opts);
  };
}

export function useDateTimeFormatter() {
  const locale = useLocale();
  const resolved = resolveLocale(locale);

  return function formatDateTime(
    date: Date | string | number,
    opts?: Intl.DateTimeFormatOptions,
  ): string {
    return new Date(date).toLocaleString(resolved, opts);
  };
}
