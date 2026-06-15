import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_ACCENT } from '@/theme/accents';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'raft-theme';
const ACCENT_KEY = 'raft-accent';

interface ThemeContextValue {
  mode: ThemeMode;
  accent: string;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: string) => void;
  reset: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = resolveTheme(mode);
}

function applyAccent(accent: string) {
  const root = document.documentElement.style;
  root.setProperty('--color-primary', accent);
  root.setProperty('--color-primary-hover', `color-mix(in srgb, ${accent}, #000 16%)`);
  root.setProperty('--color-primary-soft', `color-mix(in srgb, ${accent} 18%, var(--color-surface))`);
}

function readMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function readAccent(): string {
  return localStorage.getItem(ACCENT_KEY) ?? DEFAULT_ACCENT;
}

applyTheme(readMode());
applyAccent(readAccent());

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readMode);
  const [accent, setAccentState] = useState<string>(readAccent);

  useEffect(() => {
    applyTheme(mode);
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  const setMode = (next: ThemeMode) => {
    localStorage.setItem(THEME_KEY, next);
    setModeState(next);
  };

  const setAccent = (next: string) => {
    localStorage.setItem(ACCENT_KEY, next);
    setAccentState(next);
  };

  const reset = () => {
    localStorage.removeItem(THEME_KEY);
    localStorage.removeItem(ACCENT_KEY);
    setModeState('system');
    setAccentState(DEFAULT_ACCENT);
  };

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent, reset }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
