"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/routing";
import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";

const locales = [
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "РУ", name: "Русский" },
  { code: "zh", label: "中", name: "中文" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const _t = useTranslations("common");

  const switchLocale = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
  };

  return (
    <div className="fixed top-4 right-20 z-50 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-sm">
      <Globe className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
      {locales.map((l) => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          className={
            "px-2 py-1 text-xs font-medium rounded-md transition-colors " +
            (locale === l.code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent")
          }
          aria-label={l.name}
          title={l.name}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
