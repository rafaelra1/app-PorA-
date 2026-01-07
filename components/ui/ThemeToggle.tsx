import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const cycleTheme = () => {
        const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    const getIcon = () => {
        if (theme === 'system') return 'routine';
        if (resolvedTheme === 'dark') return 'dark_mode';
        return 'light_mode';
    };

    const getLabel = () => {
        if (theme === 'light') return 'Claro';
        if (theme === 'dark') return 'Escuro';
        return 'Auto';
    };

    return (
        <button
            onClick={cycleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-medium text-text-muted hover:bg-white/50 dark:hover:bg-white/10 hover:text-text-main dark:hover:text-white dark:text-gray-400"
            aria-label={`Tema atual: ${getLabel()}. Clique para alternar.`}
        >
            <span className="material-symbols-outlined">{getIcon()}</span>
            <span>Tema: {getLabel()}</span>
        </button>
    );
};

export default ThemeToggle;
