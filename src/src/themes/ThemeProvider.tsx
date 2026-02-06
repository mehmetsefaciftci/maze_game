import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { THEMES, type StageTheme, type ThemeKey } from './index';

interface ThemeContextValue {
  currentTheme: StageTheme;
  setTheme: (key: ThemeKey) => void;
  themeKey: ThemeKey;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeToCssVars(theme: StageTheme) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-grid-bg', theme.colors.gridBg);
  root.style.setProperty('--color-wall', theme.colors.wall);
  root.style.setProperty('--color-floor', theme.colors.floor);
  root.style.setProperty('--color-player', theme.colors.player);
  root.style.setProperty('--color-exit', theme.colors.exit);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('gezegen');

  const currentTheme = useMemo(() => THEMES[themeKey], [themeKey]);

  useEffect(() => {
    applyThemeToCssVars(currentTheme);
  }, [currentTheme]);

  const value: ThemeContextValue = {
    currentTheme,
    setTheme: setThemeKey,
    themeKey,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
