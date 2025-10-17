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
    root.className = `theme-${theme}`;

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
