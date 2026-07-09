import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/routing';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing.header' });
  const tHero = await getTranslations({ locale, namespace: 'landing.hero' });
  return {
    title: `${t('logo')} -- ${tHero('title')} ${tHero('titleHighlight')}`,
    description: tHero('subtitle'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </NextIntlClientProvider>
  );
}
