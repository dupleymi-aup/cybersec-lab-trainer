export const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  zh: 'zh-CN',
};

export function resolveLocale(locale?: string): string {
  if (!locale) return 'en-US';
  return LOCALE_MAP[locale] ?? locale;
}
