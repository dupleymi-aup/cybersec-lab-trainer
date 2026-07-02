'use client';

import { Monitor, Moon, Sun, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const themes = [
  { id: 'light', label: 'Светлая', icon: Sun, color: 'from-amber-400 to-orange-500' },
  { id: 'dark', label: 'Тёмная', icon: Moon, color: 'from-indigo-400 to-purple-500' },
  { id: 'system', label: 'Системная', icon: Monitor, color: 'from-slate-400 to-gray-500' },
];

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = themes.find(t => t.id === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 shrink-0 rounded-lg bg-accent/50 hover:bg-accent border border-border/50 flex items-center justify-center transition-all hover:shadow-lg hover:shadow-violet-500/10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Сменить тему"
        aria-expanded={isOpen}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <CurrentIcon size={18} className="text-foreground" />
        </motion.div>
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
              className="absolute right-0 mt-2 w-48 rounded-xl bg-popover border border-border shadow-xl shadow-violet-500/10 overflow-hidden z-50"
            >
              <div className="p-1">
                {themes.map((t, index) => {
                  const Icon = t.icon;
                  const isSelected = theme === t.id;
                  
                  return (
                    <motion.button
                      key={t.id}
                      onClick={() => { setTheme(t.id); setIsOpen(false); }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4, backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isSelected
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                          <Icon size={14} className="text-white" />
                        </div>
                        <span>{t.label}</span>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <Check className="w-4 h-4 text-violet-500" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              
              {/* Info Footer */}
              <div className="px-3 py-2 bg-muted/30 border-t border-border">
                <p className="text-[10px] text-muted-foreground text-center">
                  {resolvedTheme === 'dark' ? '🌙 Тёмная тема активна' : '☀️ Светлая тема активна'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
