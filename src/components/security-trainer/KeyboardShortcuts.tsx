'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['1', '2', '3', '4'], desc: 'Выбрать ответ в квизе' },
  { keys: ['↑', '↓'], desc: 'Навигация по вариантам' },
  { keys: ['Enter'], desc: 'Подтвердить ответ / Далее' },
  { keys: ['Esc'], desc: 'Выйти из квиза' },
  { keys: ['Ctrl', 'K'], desc: 'Глобальный поиск' },
  { keys: ['?'], desc: 'Показать шорткаты' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      setOpen((p) => !p);
    }
    if (e.key === 'Escape' && open) {
      setOpen(false);
    }
  }, [open]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Floating hint button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 w-9 h-9 rounded-full bg-slate-800 text-white shadow-lg flex items-center justify-center hover:bg-slate-700 transition-colors opacity-60 hover:opacity-100"
        title="Шорткаты (?)"
      >
        <Keyboard size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] z-50 bg-card border rounded-xl shadow-2xl max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Keyboard size={18} className="text-slate-500" />
                  <h2 className="font-semibold">Клавиатурные шорткаты</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Shortcuts list */}
              <div className="overflow-y-auto p-4 space-y-2">
                {SHORTCUTS.map((sc, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <span className="text-sm text-slate-600">{sc.desc}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((key, j) => (
                        <span key={j} className="inline-flex items-center gap-1">
                          {j > 0 && <span className="text-slate-300 text-xs">+</span>}
                          <kbd className={`inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-md text-xs font-mono font-medium border ${
                            key === 'Ctrl' || key === 'Cmd'
                              ? 'bg-slate-100 border-slate-300 text-slate-700'
                              : key === 'Enter'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}>
                            {key === 'Ctrl' ? <><Command size={12} className="mr-0.5" />K</> : key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t text-center text-[11px] text-slate-400">
                Нажмите <kbd className="inline-flex items-center justify-center px-1.5 h-5 rounded text-[10px] font-mono bg-slate-100 border border-slate-200 mx-1">?</kbd> чтобы открыть/закрыть
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
