'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore, type PageType } from '@/lib/store';
import { modules, quizCategories } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  LayoutDashboard,
  Database,
  FileText,
  Link,
  Lock,
  Code,
  Shield,
  HelpCircle,
  BookOpen,
  Trophy,
  GraduationCap,
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  page: PageType;
}

const iconMap: Record<string, React.ReactNode> = {
  Database: <Database size={16} />,
  FileText: <FileText size={16} />,
  Link: <Link size={16} />,
  Lock: <Lock size={16} />,
  Code: <Code size={16} />,
  Shield: <Shield size={16} />,
  HelpCircle: <HelpCircle size={16} />,
};

export default function GlobalSearch() {
  const t = useTranslations('globalSearch');
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const pageNavItems: { id: PageType; label: string; icon: React.ReactNode }[] = useMemo(
    () => [
      { id: 'dashboard', label: t('home'), icon: <LayoutDashboard size={16} /> },
      { id: 'achievements', label: t('achievements'), icon: <Trophy size={16} /> },
      { id: 'quiz', label: t('quizzes'), icon: <HelpCircle size={16} /> },
      { id: 'profile', label: t('profile'), icon: <GraduationCap size={16} /> },
    ],
    [t],
  );

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    for (const nav of pageNavItems) {
      if (nav.label.toLowerCase().includes(q)) {
        items.push({ id: `nav-${nav.id}`, title: nav.label, subtitle: t('navigation'), icon: nav.icon, page: nav.id });
      }
    }

    for (const mod of modules) {
      if (mod.title.toLowerCase().includes(q) || mod.description.toLowerCase().includes(q)) {
        items.push({
          id: `mod-${mod.id}`,
          title: mod.title,
          subtitle: `${t('module')} · ${mod.difficulty}`,
          icon: iconMap[mod.icon] || <BookOpen size={16} />,
          page: mod.id as PageType,
        });
      }
    }

    for (const cat of quizCategories) {
      if (cat.name.toLowerCase().includes(q)) {
        items.push({
          id: `quiz-${cat.id}`,
          title: cat.name,
          subtitle: `${t('quiz')} · ${cat.count}`,
          icon: <HelpCircle size={16} />,
          page: 'quiz',
        });
      }
    }

    return items.slice(0, 20);
  }, [query, pageNavItems, t]);

  const handleSelect = (page: PageType) => {
    setCurrentPage(page);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border-border bg-card/50 hover:border-border hover:text-muted-foreground flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-400 transition-colors"
      >
        <Search size={14} />
        <span className="flex-1 text-left">{t('placeholder')}</span>
        <kbd className="bg-muted text-muted-foreground hidden items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] md:inline-flex">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[15vh] left-1/2 z-50 w-full max-w-lg -translate-x-1/2"
            >
              <div className="bg-card border-border mx-4 overflow-hidden rounded-xl border shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                  <Search size={18} className="shrink-0 text-slate-400" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('searchModules')}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t('closeSearch')}
                    className="hover:text-muted-foreground text-slate-400"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {query.trim() && results.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-400">{t('nothingFound')}</p>
                  )}
                  {!query.trim() && <p className="py-8 text-center text-sm text-slate-400">{t('startTyping')}</p>}
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result.page)}
                      className="hover:bg-secondary flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
                    >
                      <span className="text-muted-foreground shrink-0">{result.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{result.title}</p>
                        <p className="truncate text-xs text-slate-400">{result.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
                  <span>⌘K — {t('openShortcut')}</span>
                  <span>Esc — {t('closeShortcut')}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
