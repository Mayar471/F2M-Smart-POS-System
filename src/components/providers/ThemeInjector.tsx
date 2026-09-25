'use client';
import { useEffect } from 'react';
import { getStoredTheme, getThemeCssVars } from '@/lib/theme';

export function ThemeInjector() {
  useEffect(() => {
    async function injectTheme() {
      const theme = await getStoredTheme();
      if (theme) {
        const cssVars = getThemeCssVars(theme);
        const root = document.documentElement;
        const style = document.createElement('style');
        style.textContent = `:root { ${cssVars} }`;
        root.appendChild(style);
      }
    }
    injectTheme();
  }, []);

  return null;
}
