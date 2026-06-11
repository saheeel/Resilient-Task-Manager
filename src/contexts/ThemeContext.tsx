import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'rtm_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  });
  const resolvedTheme = themeMode;

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.toggle('theme-dark', resolvedTheme === 'dark');
    body.classList.toggle('theme-dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setThemeMode = (mode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setThemeModeState(mode);
  };

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      setThemeMode,
    }),
    [resolvedTheme, themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
