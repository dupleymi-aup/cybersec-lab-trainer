'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/routing';
import { Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';

const locales = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ru', label: 'РУ', name: 'Русский' },
  { code: 'zh', label: '中', name: '中文' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const _t = useTranslations('common');

  const switchLocale = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
  };

  return (
    <div className="bg-background/80 border-border fixed top-4 right-20 z-50 flex items-center gap-1 rounded-lg border px-2 py-1.5 shadow-sm backdrop-blur-sm">
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
