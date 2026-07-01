'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const supportedLocales = ['en', 'ru', 'zh'];

export default function LocaleLangSetter() {
  const pathname = usePathname();

  useEffect(() => {
    const segment = pathname.split('/')[1];
    if (supportedLocales.includes(segment)) {
      document.documentElement.lang = segment;
    } else {
      document.documentElement.lang = 'ru';
    }
  }, [pathname]);

  return null;
}
