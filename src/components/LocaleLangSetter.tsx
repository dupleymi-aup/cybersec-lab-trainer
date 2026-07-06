'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { routing } from '@/routing';

const supportedLocales = routing.locales;
const defaultLang = routing.defaultLocale;

export default function LocaleLangSetter() {
  const pathname = usePathname();

  useEffect(() => {
    const segment = pathname.split('/')[1];
    if (supportedLocales.includes(segment as (typeof supportedLocales)[number])) {
      document.documentElement.lang = segment;
    } else {
      document.documentElement.lang = defaultLang;
    }
  }, [pathname]);

  return null;
}
