import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'earth' | 'cherry' | 'azurite' | 'oceanic' | 'mineral' | 'autumn' | 'industrial';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme') as Theme;
        if (saved && ['light', 'dark', 'earth', 'cherry', 'azurite', 'oceanic', 'mineral', 'autumn', 'industrial'].includes(saved)) {
            return saved;
        }
        return 'azurite'; // Default theme is now Ejecutivo (azurite)
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove old themes
        root.classList.remove('dark', 'theme-earth', 'theme-cherry', 'theme-azurite', 'theme-oceanic', 'theme-pastel', 'theme-mineral', 'theme-autumn', 'theme-industrial');

        // Add current theme if not light
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme !== 'light') {
            root.classList.add(`theme-${theme}`);
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    return { theme, setTheme };
}
