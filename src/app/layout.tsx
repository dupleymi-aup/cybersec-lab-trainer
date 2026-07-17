import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ThemeColorMeta from '@/components/security-trainer/ThemeColorMeta';
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';
import LocaleLangSetter from '@/components/LocaleLangSetter';
import { routing } from '@/routing';
import enMessages from '@/messages/en.json';
import ruMessages from '@/messages/ru.json';
import zhMessages from '@/messages/zh.json';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

async function resolveLocale(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value;
    if (locale && routing.locales.includes(locale as (typeof routing.locales)[number])) return locale;
  } catch {
    // cookies() unavailable during static generation
  }
  return routing.defaultLocale;
}

function getMessages(locale: string): typeof enMessages {
  if (locale === 'ru') return ruMessages;
  if (locale === 'zh') return zhMessages;
  return enMessages;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const msgs = getMessages(locale);
  const header = msgs.landing?.header;
  const hero = msgs.landing?.hero;
  const title =
    header?.logo && hero?.title && hero?.titleHighlight
      ? `${header.logo} — ${hero.title} ${hero.titleHighlight}`
      : 'CyberSec Lab — Cybersecurity Training Platform';
  const description =
    hero?.subtitle || 'Interactive platform for learning web application vulnerabilities.';
  return {
    title,
    description,
    keywords: ['cybersecurity', 'OWASP', 'SQL injection', 'XSS', 'CSRF', 'training', 'software engineering'],
    icons: {
      icon: '/logo.svg',
      apple: '/icons/icon-192.svg',
      other: [
        {
          rel: 'apple-touch-icon',
          url: '/icons/icon-192.svg',
        },
      ],
    },
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'CyberSec Lab',
      startupImage: '/icons/icon-512.svg',
    },
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'msapplication-TileColor': '#1a1a2e',
      'msapplication-tap-highlight': 'no',
    },
  };
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafbfc' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await resolveLocale();
  const msgs = getMessages(locale);
  const skipText = msgs.landing?.skipToContent || 'Skip to main content';

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}>
        <LocaleLangSetter />
        <a
          href="#main-content"
          className="focus:ring-offset-background sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:outline-none"
        >
          {skipText}
        </a>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
        >
          <ServiceWorkerRegistration />
          <ThemeColorMeta />
          <ErrorBoundary>{children}</ErrorBoundary>
        </NextThemesProvider>
      </body>
    </html>
  );
}
