import { createContext, useContext, useState, useEffect } from 'react';

// ─── Context ───────────────────────────────────────────────────────
const ThemeContext = createContext(null);

// ─── Provider ──────────────────────────────────────────────────────
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('quiz_theme') || 'dark'
  );

  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');
    document.body.classList.toggle('theme-dark',  theme === 'dark');
    localStorage.setItem('quiz_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(v => (v === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
