'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname, routing } from '@/routing';
import { Globe } from 'lucide-react';

const localeMeta: Record<string, { label: string; name: string }> = {
  en: { label: 'EN', name: 'English' },
  ru: { label: 'РУ', name: 'Русский' },
  zh: { label: '中', name: '中文' },
};

const locales = routing.locales
  .filter((code) => code in localeMeta)
  .map((code) => ({ code, ...localeMeta[code] }));

export default function LanguageSwitcher({
  variant = 'floating',
}: {
  variant?: 'floating' | 'header';
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
  };

  const position =
    variant === 'floating'
      ? 'fixed top-16 right-4 z-50 hidden sm:block lg:hidden'
      : '';

  return (
    <div className={`bg-background/80 border-border flex items-center gap-1 rounded-lg border px-2 py-1.5 shadow-sm backdrop-blur-sm ${position}`}>
      <Globe className="text-muted-foreground h-4 w-4" aria-hidden="true" />
      {locales.map((l) => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          className={
            'rounded-md px-2 py-1 text-xs font-medium transition-colors ' +
            (locale === l.code
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent')
          }
          aria-label={l.name}
          title={l.name}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
