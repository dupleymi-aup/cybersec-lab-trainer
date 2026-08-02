'use client';

import { memo, useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

export default memo(function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const tc = useTranslations('common');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0" disabled>
        <Monitor size={18} />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const label = theme === 'system' ? tc('systemTheme') : isDark ? tc('darkTheme') : tc('lightTheme');

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 shrink-0"
      onClick={cycleTheme}
      aria-label={`${tc('switchTheme')} ${label}`}
      title={`${tc('currentTheme')}: ${label}`}
    >
      {theme === 'system' ? <Monitor size={18} /> : isDark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
});
