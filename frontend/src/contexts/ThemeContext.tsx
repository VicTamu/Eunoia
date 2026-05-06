import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'blue' | 'ocean' | 'green';

const VALID_THEMES: Theme[] = ['blue', 'ocean', 'green'];
const LEGACY_THEME_MAP: Record<string, Theme> = {
  light: 'blue',
  purple: 'blue',
  dark: 'ocean',
};
const THEME_META_COLORS: Record<Theme, string> = {
  blue: '#f8f5ef',
  ocean: '#eef6fb',
  green: '#10b981',
};

const normalizeTheme = (value: string | null): Theme => {
  if (value && value in LEGACY_THEME_MAP) {
    return LEGACY_THEME_MAP[value];
  }

  if (value && VALID_THEMES.includes(value as Theme)) {
    return value as Theme;
  }

  return 'blue';
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('eunoia-theme');
    return normalizeTheme(savedTheme);
  });

  const isDark = false;

  useEffect(() => {
    localStorage.setItem('eunoia-theme', theme);

    const root = document.documentElement;
    const currentThemeClass = `theme-${theme}`;
    const existingThemeClass = Array.from(root.classList).find((className) =>
      className.startsWith('theme-'),
    );

    if (existingThemeClass && existingThemeClass !== currentThemeClass) {
      root.classList.remove(existingThemeClass);
    }

    if (!root.classList.contains(currentThemeClass)) {
      root.classList.add(currentThemeClass);
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', THEME_META_COLORS[theme]);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
