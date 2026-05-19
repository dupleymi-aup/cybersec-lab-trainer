'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const isDark = resolvedTheme === 'dark';
  const label =
    theme === 'system'
      ? 'Системная'
      : isDark
        ? 'Тёмная'
        : 'Светлая';

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 shrink-0 relative"
      onClick={cycleTheme}
      aria-label={`Сменить тему. Сейчас: ${label}`}
      title={`Тема: ${label}`}
    >
      {theme === 'system' ? (
        <Monitor size={18} />
      ) : isDark ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </Button>
  );
}
