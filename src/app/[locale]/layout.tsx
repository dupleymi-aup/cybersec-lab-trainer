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
  const title = `${t('logo')} — ${tHero('title')} ${tHero('titleHighlight')}`;
  const description = tHero('subtitle');
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://cyberseclab.ru';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'CyberSec Lab',
      locale: locale === 'ru' ? 'ru_RU' : locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CyberSec Lab',
    description: 'Interactive cybersecurity training platform with labs, quizzes, and gamification',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://cyberseclab.ru',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'RUB',
    },
    author: {
      '@type': 'Organization',
      name: 'CyberSec Lab',
    },
  };

  return (
    <NextIntlClientProvider messages={messages}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <ErrorBoundary>{children}</ErrorBoundary>
    </NextIntlClientProvider>
  );
}
