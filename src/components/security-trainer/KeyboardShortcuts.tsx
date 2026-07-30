'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function KeyboardShortcuts() {
  const t = useTranslations('common.keyboardShortcuts');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);

  const SHORTCUTS = [
    { keys: ['1', '2', '3', '4'], desc: t('selectAnswer') },
    { keys: ['↑', '↓'], desc: t('navigateOptions') },
    { keys: ['Enter'], desc: t('confirmAnswer') },
    { keys: ['Esc'], desc: t('exitQuiz') },
    { keys: ['Ctrl', 'K'], desc: t('globalSearch') },
    { keys: ['?'], desc: t('showShortcuts') },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    },
    [open],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Floating hint button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white opacity-60 shadow-lg transition-colors hover:bg-slate-700 hover:opacity-100 dark:bg-slate-700"
        title={t('buttonTitle')}
        aria-label={t('buttonTitle')}
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
              className="bg-card fixed inset-4 z-50 flex max-h-[80vh] flex-col rounded-xl border shadow-2xl md:inset-auto md:top-1/2 md:left-1/2 md:w-[420px] md:-translate-x-1/2 md:-translate-y-1/2"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <Keyboard size={18} className="text-muted-foreground" />
                  <h2 className="font-semibold">{t('title')}</h2>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="hover:bg-muted rounded p-1 transition-colors" aria-label={tc('close')}>
                  <X size={16} />
                </button>
              </div>

              {/* Shortcuts list */}
              <div className="space-y-2 overflow-y-auto p-4">
                {SHORTCUTS.map((sc, i) => (
                  <div key={i} className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-2">
                    <span className="text-muted-foreground text-sm">{sc.desc}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((key, j) => (
                        <span key={j} className="inline-flex items-center gap-1">
                          {j > 0 && <span className="text-xs text-slate-300">+</span>}
                          <kbd
                            className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border px-2 font-mono text-xs font-medium ${
                              key === 'Ctrl' || key === 'Cmd'
                                ? 'bg-muted border-border text-foreground/70'
                                : key === 'Enter'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'bg-secondary border-border text-muted-foreground'
                            }`}
                          >
                            {key === 'Ctrl' ? (
                              <>
                                <Command size={12} className="mr-0.5" />K
                              </>
                            ) : (
                              key
                            )}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t p-3 text-center text-[11px] text-slate-400">
                {t('pressQuestionMark')}
                <kbd className="bg-muted border-border mx-1 inline-flex h-5 items-center justify-center rounded border px-1.5 font-mono text-[10px]">
                  ?
                </kbd>{' '}
                {t('toToggle')}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
