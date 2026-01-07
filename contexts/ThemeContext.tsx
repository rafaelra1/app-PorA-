import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'porai-theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
            return stored || 'light';
        }
        return 'light';
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Update resolved theme based on system preference or manual selection
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateResolvedTheme = () => {
            if (theme === 'system') {
                setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
            } else {
                setResolvedTheme(theme);
            }
        };

        updateResolvedTheme();

        // Listen for system theme changes
        mediaQuery.addEventListener('change', updateResolvedTheme);
        return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }, [theme]);

    // Apply dark class to document
    useEffect(() => {
        const root = document.documentElement;
        if (resolvedTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [resolvedTheme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
