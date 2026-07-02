'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore, type PageType } from '@/lib/store';
import { modules, quizCategories } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, LayoutDashboard, Database, FileText, Link, Lock, Code, Shield, HelpCircle, BookOpen, Trophy, GraduationCap } from 'lucide-react';

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

const pageNavItems: { id: PageType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Главная', icon: <LayoutDashboard size={16} /> },
  { id: 'achievements', label: 'Достижения', icon: <Trophy size={16} /> },
  { id: 'quiz', label: 'Квизы', icon: <HelpCircle size={16} /> },
  { id: 'profile', label: 'Профиль', icon: <GraduationCap size={16} /> },
];

export default function GlobalSearch() {
  const setCurrentPage = useAppStore(s => s.setCurrentPage);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K shortcut
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

  // Focus input when opened
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

    // Navigation
    for (const nav of pageNavItems) {
      if (nav.label.toLowerCase().includes(q)) {
        items.push({ id: `nav-${nav.id}`, title: nav.label, subtitle: 'Навигация', icon: nav.icon, page: nav.id });
      }
    }

    // Modules
    for (const mod of modules) {
      if (mod.title.toLowerCase().includes(q) || mod.description.toLowerCase().includes(q)) {
        items.push({
          id: `mod-${mod.id}`,
          title: mod.title,
          subtitle: `Модуль · ${mod.difficulty}`,
          icon: iconMap[mod.icon] || <BookOpen size={16} />,
          page: mod.id as PageType,
        });
      }
    }

    // Quiz categories
    for (const cat of quizCategories) {
      if (cat.name.toLowerCase().includes(q)) {
        items.push({
          id: `quiz-${cat.id}`,
          title: cat.name,
          subtitle: `Квиз · ${cat.count} вопросов`,
          icon: <HelpCircle size={16} />,
          page: 'quiz',
        });
      }
    }

    return items.slice(0, 20);
  }, [query]);

  const handleSelect = (page: PageType) => {
    setCurrentPage(page);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-accent/30 hover:bg-accent/50 text-sm text-muted-foreground transition-all hover:shadow-lg hover:shadow-violet-500/5"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Search size={14} className="text-violet-500" />
        <span className="flex-1 text-left">Поиск...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[10px] font-mono text-violet-600 dark:text-violet-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
            >
              <div className="bg-card rounded-2xl shadow-2xl shadow-violet-500/10 border border-border overflow-hidden mx-4">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border/50 bg-gradient-to-r from-violet-500/5 to-emerald-500/5">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Search size={18} className="text-violet-500 shrink-0" />
                  </motion.div>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск модулей, квизов, терминов..."
                    className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground/60"
                  />
                  <motion.button 
                    type="button" 
                    onClick={() => setOpen(false)} 
                    aria-label="Закрыть поиск" 
                    className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={16} />
                  </motion.button>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {query.trim() && results.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-12"
                    >
                      <Search size={48} className="text-muted-foreground/20 mb-4" />
                      <p className="text-sm text-muted-foreground text-center">Ничего не найдено</p>
                      <p className="text-xs text-muted-foreground/60 text-center mt-1">Попробуйте другой запрос</p>
                    </motion.div>
                  )}
                  {!query.trim() && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-12"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-emerald-500/10 flex items-center justify-center mb-4">
                        <Search size={24} className="text-violet-500" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">Начните вводить для поиска</p>
                      <p className="text-xs text-muted-foreground/60 text-center mt-1">Найдите модули, квизы и термины</p>
                    </motion.div>
                  )}
                  {results.map((result, index) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleSelect(result.page)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent/50 transition-all group"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-muted-foreground shrink-0 p-2 rounded-lg bg-accent/30 group-hover:bg-violet-500/10 transition-colors">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{result.title}</p>
                        <p className="text-xs text-muted-foreground/70 truncate">{result.subtitle}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} className="text-muted-foreground rotate-45" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-accent border border-border font-mono">⌘K</kbd>
                      <span>открыть</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-accent border border-border font-mono">Esc</kbd>
                      <span>закрыть</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-violet-500">
                    <Search size={10} />
                    <span>Global Search</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
