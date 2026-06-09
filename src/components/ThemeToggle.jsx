import { useTheme } from '../context/ThemeContext';

/**
 * ThemeToggle — pill-shaped button with animated track + sun/moon icon.
 * Reads and writes theme via ThemeContext.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      id="theme-toggle"
      className="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Currently ${isDark ? 'Dark' : 'Light'} — click to switch`}
    >
      {/* Sun / Moon icon */}
      <span className="text-base leading-none" aria-hidden="true">
        {isDark ? '🌙' : '☀️'}
      </span>

      {/* Animated pill track + sliding thumb */}
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb" />
      </span>

      {/* Label */}
      <span>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
