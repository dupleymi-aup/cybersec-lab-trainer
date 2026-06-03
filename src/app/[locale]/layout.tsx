import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {NextIntlClientProvider} from "next-intl";
import {getMessages} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/routing";
import {ThemeColorMeta} from "@/components/security-trainer/ThemeColorMeta";
import {ErrorBoundary} from "@/components/ErrorBoundary";
import {ThemeProvider as NextThemesProvider} from "next-themes";
import "@/app/globals.css";

const geistSans = Geist({variable: "--font-geist-sans", subsets: ["latin"]});
const geistMono = Geist_Mono({variable: "--font-geist-mono", subsets: ["latin"]});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const isRu = locale === "ru";
  const isZh = locale === "zh";
  return {
    title: isRu ? "CyberSec Lab -- Тренажёр по ИБ" : isZh ? "CyberSec Lab -- 网络安全培训" : "CyberSec Lab -- Cybersecurity Training",
    description: isRu ? "Интерактивная платформа для изучения уязвимостей" : isZh ? "学习Web应用程序漏洞的交互平台" : "Interactive platform for learning web vulnerabilities",
  };
}

export default async function LocaleLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-lg">
          {locale === "ru" ? "Перейти к содержимому" : locale === "zh" ? "跳转到内容" : "Skip to content"}
        </a>
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="theme">
          <NextIntlClientProvider messages={messages}>
            <ThemeColorMeta />
            <ErrorBoundary>{children}</ErrorBoundary>
          </NextIntlClientProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
