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
  const { setCurrentPage } = useAppStore();
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
      setTimeout(() => inputRef.current?.focus(), 50);
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
      {/* Trigger button — shown in sidebar header or dashboard */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white/50 text-sm text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Поиск...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-500">
          ⌘K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
            >
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden mx-4">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                  <Search size={18} className="text-slate-400 shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск модулей, квизов, терминов..."
                    className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-400"
                  />
                  <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {query.trim() && results.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-8">Ничего не найдено</p>
                  )}
                  {!query.trim() && (
                    <p className="text-sm text-slate-400 text-center py-8">Начните вводить для поиска</p>
                  )}
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result.page)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="text-slate-500 shrink-0">{result.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <p className="text-xs text-slate-400 truncate">{result.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400">
                  <span>⌘K — открыть</span>
                  <span>Esc — закрыть</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
