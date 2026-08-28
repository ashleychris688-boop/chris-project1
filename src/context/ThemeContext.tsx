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
 * Compact Header Theme Toggle Button
 */
export const HeaderThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
        isDark
          ? 'bg-slate-900/80 border-slate-700 text-amber-300 hover:text-amber-200 hover:border-amber-400/50 hover:bg-slate-800'
          : 'bg-white/90 border-slate-300 text-slate-800 hover:text-indigo-900 hover:border-indigo-400 hover:bg-slate-100 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to High-Contrast Light Mode (Daylight/Office)' : 'Switch to Dark Mode (Deep Navy & Gold)'}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
          <span className="hidden xl:inline text-xs font-semibold text-amber-200">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-700" />
          <span className="hidden xl:inline text-xs font-semibold text-slate-800">Dark Mode</span>
        </>
      )}
    </button>
  );
};

/**
 * Detailed Segmented Settings Theme Selector
 */
export const SettingsThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {/* Dark Theme Option */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
          theme === 'dark'
            ? 'bg-slate-950 border-[#C9A227] ring-2 ring-[#C9A227]/40 shadow-lg'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-slate-900 text-[#C9A227] border border-[#C9A227]/40">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-white block">Dark Mode</span>
                <span className="text-[11px] text-amber-300/80 font-mono">Deep Navy & Gold</span>
              </div>
            </div>
            {theme === 'dark' && (
              <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-[#C9A227] text-slate-950">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Optimized for low-light environments, late-night file reviews, and prolonged registry work with reduced eye strain.
          </p>
        </div>

        {/* Visual Mini Preview */}
        <div className="mt-3 p-2 bg-[#081729] rounded-lg border border-slate-800 flex items-center gap-2 text-[10px] text-slate-300 font-mono">
          <span className="w-2 h-2 rounded-full bg-[#C9A227]"></span>
          <span className="text-white font-bold">LFR/2026/0142</span>
          <span className="text-emerald-400 ml-auto">● Active</span>
        </div>
      </button>

      {/* High-Contrast Light Theme Option */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
          theme === 'light'
            ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/40 shadow-xl'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 border border-amber-300">
                <Sun className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <span className={`font-bold text-sm block ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  High-Contrast Light Mode
                </span>
                <span className="text-[11px] text-indigo-600 font-mono font-semibold">Daylight & Bright Office</span>
              </div>
            </div>
            {theme === 'light' && (
              <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                Active
              </span>
            )}
          </div>
          <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            High-contrast crisp white background with bold typography and sharp borders for well-lit court offices and daylight printing.
          </p>
        </div>

        {/* Visual Mini Preview */}
        <div className="mt-3 p-2 bg-slate-100 rounded-lg border border-slate-300 flex items-center gap-2 text-[10px] text-slate-800 font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          <span className="text-slate-900 font-bold">LFR/2026/0142</span>
          <span className="text-emerald-700 font-bold ml-auto">● Active</span>
        </div>
      </button>
    </div>
  );
};
