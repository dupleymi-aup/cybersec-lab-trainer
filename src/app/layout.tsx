import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ThemeColorMeta from '@/components/security-trainer/ThemeColorMeta';
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';
import LocaleLangSetter from '@/components/LocaleLangSetter';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CyberSec Lab — Cybersecurity Training Platform',
  description:
    'Interactive platform for learning web application vulnerabilities: OWASP Top 10, SQL Injection, XSS, CSRF and secure coding. Software Engineering program 09.03.04.',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}>
        <LocaleLangSetter />
        <a
          href="#main-content"
          className="focus:ring-offset-background sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:outline-none"
        >
          Skip to main content
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
