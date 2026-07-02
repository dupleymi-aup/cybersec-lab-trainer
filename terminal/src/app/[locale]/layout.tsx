import type {Metadata} from "next";
import {NextIntlClientProvider} from "next-intl";
import {getMessages} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const isRu = locale === "ru";
  const isZh = locale === "zh";
  return {
    title: isRu ? "CyberSec Lab — Тренажёр по ИБ" : isZh ? "CyberSec Lab — 网络安全培训" : "CyberSec Lab — Cybersecurity Training",
    description: isRu ? "Интерактивная платформа для изучения уязвимостей" : isZh ? "学习 Web 应用程序漏洞的交互平台" : "Interactive platform for learning web vulnerabilities",
  };
}

export default async function LocaleLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}