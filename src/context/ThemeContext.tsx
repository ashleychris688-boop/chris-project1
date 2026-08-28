import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'lawfirm_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'dark'; // Default dark mode as base
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        toggleTheme,
        setTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Compact Header Theme Toggle Button - Crafted with clean pill geometry and clear icon status
 */
export const HeaderThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative px-2.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm select-none ${
        isDark
          ? 'bg-slate-900/90 border-slate-700 hover:border-amber-400/60 text-amber-300 hover:bg-slate-800'
          : 'bg-slate-800/90 border-slate-600 hover:border-amber-300 text-amber-200 hover:bg-slate-700'
      } ${className}`}
      title={isDark ? 'Switch to High-Contrast Light Mode (Daylight/Office)' : 'Switch to Dark Mode (Deep Navy & Gold)'}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="hidden xl:inline text-[11px] font-semibold tracking-wide text-amber-200">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
          <span className="hidden xl:inline text-[11px] font-semibold tracking-wide text-slate-100">Dark Mode</span>
        </>
      )}
    </button>
  );
};

/**
 * Detailed Segmented Settings Theme Selector with crisp card architecture
 */
export const SettingsThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Dark Theme Option */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer relative flex flex-col justify-between ${
          theme === 'dark'
            ? 'bg-slate-950 border-[#C9A227] ring-2 ring-[#C9A227]/50 shadow-lg'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
        }`}
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-slate-900 text-[#C9A227] border border-[#C9A227]/40 shadow-inner">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-white block">Dark Mode</span>
                <span className="text-[10px] text-amber-300/90 font-mono">Deep Navy & Gold</span>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded bg-[#C9A227] text-slate-950 shadow-sm">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Optimized for low-light courtrooms, late-night file reviews, and prolonged registry operations.
          </p>
        </div>

        {/* Visual Mini Preview */}
        <div className="mt-3.5 p-2 bg-[#081729] rounded-lg border border-slate-800 flex items-center justify-between text-[10px] text-slate-300 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C9A227]"></span>
            <span className="text-white font-bold">LFR/2026/0142</span>
          </div>
          <span className="text-emerald-400 font-semibold">● Active File</span>
        </div>
      </button>

      {/* High-Contrast Light Theme Option */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer relative flex flex-col justify-between ${
          theme === 'light'
            ? 'bg-white border-[#C9A227] ring-2 ring-[#C9A227]/50 shadow-lg'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
        }`}
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 shadow-inner">
                <Sun className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <span className={`font-bold text-sm block ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  High-Contrast Light Mode
                </span>
                <span className="text-[10px] text-amber-700 font-mono font-semibold">Daylight & Bright Office</span>
              </div>
            </div>
            {theme === 'light' && (
              <span className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded bg-amber-600 text-white shadow-sm">
                Active
              </span>
            )}
          </div>
          <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            High-contrast crisp white background with bold typography and sharp borders for well-lit offices.
          </p>
        </div>

        {/* Visual Mini Preview */}
        <div className="mt-3.5 p-2 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-between text-[10px] text-slate-800 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span className="text-slate-900 font-bold">LFR/2026/0142</span>
          </div>
          <span className="text-emerald-700 font-bold">● Active File</span>
        </div>
      </button>
    </div>
  );
};
