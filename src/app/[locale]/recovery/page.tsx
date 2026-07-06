'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

export default function RecoveryPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    router.push(`/${locale}/login`);
  }, [router, locale]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">{t('recovery.redirecting')}</p>
    </div>
  );
}
