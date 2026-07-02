'use client';

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) {
      meta.content = resolvedTheme === "dark" ? "#1a1a2e" : "#fafbfc";
    }
  }, [resolvedTheme]);

  return null;
}

export default ThemeColorMeta;
