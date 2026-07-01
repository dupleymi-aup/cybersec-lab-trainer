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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">{t('recovery.redirecting')}</p>
    </div>
  );
}
