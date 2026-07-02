"use client";

import {useLocale} from "next-intl";
import {useRouter, usePathname} from "@/routing";
import {Globe, ChevronDown, Check} from "lucide-react";
import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";

const locales = [
  {code: "en", label: "EN", name: "English", flag: "🇬🇧", native: "English"},
  {code: "ru", label: "RU", name: "Русский", flag: "🇷🇺", native: "Русский"},
  {code: "zh", label: "ZH", name: "中文", flag: "🇨🇳", native: "中文"},
];

export default function LanguageSwitcher({ variant = "landing" }: { variant?: "landing" | "dashboard" }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const switchLocale = (newLocale: string) => {
    router.push(pathname, {locale: newLocale});
    setIsOpen(false);
  };

  const currentLocale = locales.find(l => l.code === locale) || locales[0];

  // Dashboard variant - more compact
  if (variant === "dashboard") {
    return (
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-accent/50 hover:bg-accent border border-border/50 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Выбрать язык"
          aria-expanded={isOpen}
          title="Выбрать язык / Select language"
        >
          <Globe className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs font-bold text-foreground">{currentLocale.label}</span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[-1]"
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 rounded-xl bg-popover border border-border shadow-xl shadow-violet-500/10 overflow-hidden z-50"
              >
                <div className="p-1">
                  {locales.map((l, index) => (
                    <motion.button
                      key={l.code}
                      onClick={() => switchLocale(l.code)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4, backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        locale === l.code
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      aria-label={l.name}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{l.flag}</span>
                        <div className="text-left">
                          <p className="text-sm font-medium">{l.native}</p>
                          <p className="text-xs text-muted-foreground">{l.name}</p>
                        </div>
                      </div>
                      {locale === l.code && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <Check className="w-4 h-4 text-violet-500" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Landing variant - full featured
  return (
    <div className="fixed top-4 right-4 md:right-20 z-50">
      <div className="relative">
        {/* Language Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/90 backdrop-blur-md border border-border/50 shadow-lg shadow-violet-500/5 hover:border-violet-500/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Select language"
          aria-expanded={isOpen}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Globe className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </motion.div>
          <span className="text-xs font-bold text-foreground">{currentLocale.label}</span>
          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[-1]"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Menu */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-44 rounded-xl bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl shadow-violet-500/10 overflow-hidden"
              >
                <div className="p-1">
                  {locales.map((l, index) => (
                    <motion.button
                      key={l.code}
                      onClick={() => switchLocale(l.code)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4, backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        locale === l.code
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      aria-label={l.name}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{l.flag}</span>
                        <span>{l.native}</span>
                      </div>
                      {locale === l.code && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <Check className="w-4 h-4 text-violet-500" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
                
                {/* Footer */}
                <div className="px-3 py-2 bg-violet-500/5 border-t border-violet-500/10">
                  <p className="text-[10px] text-muted-foreground text-center">
                    {locale === 'ru' ? 'Выберите язык' : locale === 'zh' ? '选择语言' : 'Select language'}
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
