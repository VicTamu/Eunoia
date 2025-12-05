import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'blue' | 'green' | 'purple';

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
    const saved = localStorage.getItem('eunoia-theme');
    return (saved as Theme) || 'light';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('eunoia-theme', theme);

    // Apply theme to document root
    const root = document.documentElement;
    // Remove any existing theme-* class and add the current one without
    // disturbing other classes that might be present on <html>.
    const currentThemeClass = `theme-${theme}`;
    const existingThemeClass = Array.from(root.classList).find((c) => c.startsWith('theme-'));
    if (existingThemeClass && existingThemeClass !== currentThemeClass) {
      root.classList.remove(existingThemeClass);
    }
    if (!root.classList.contains(currentThemeClass)) {
      root.classList.add(currentThemeClass);
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const colors = {
        light: '#ffffff',
        dark: '#1f2937',
        blue: '#3b82f6',
        green: '#10b981',
        purple: '#8b5cf6',
      };
      metaThemeColor.setAttribute('content', colors[theme]);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme,
    isDark,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
