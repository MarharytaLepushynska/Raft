/**
 * Theme system: light/dark/system mode and a custom accent color.
 *
 * Both are saved in localStorage and applied to `<html>` (via the `data-theme`
 * attribute and CSS variables), so they persist across reloads.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_ACCENT } from '@/theme/accents';

/** Theme choice: a fixed `light`/`dark`, or `system` (follow the OS). */
export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'raft-theme';
const ACCENT_KEY = 'raft-accent';

/** Theme state and actions exposed through useTheme. */
interface ThemeContextValue {
  mode: ThemeMode;
  accent: string;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: string) => void;
  reset: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Resolves a mode to a concrete `light`/`dark`, reading the OS preference for `system`. */
function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/** Writes the resolved theme to `<html data-theme>` so the stylesheet can react. */
function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = resolveTheme(mode);
}

/** Sets the accent CSS variables, deriving the hover/soft shades from the base color. */
function applyAccent(accent: string) {
  const root = document.documentElement.style;
  root.setProperty('--color-primary', accent);
  root.setProperty('--color-primary-hover', `color-mix(in srgb, ${accent}, #000 16%)`);
  root.setProperty('--color-primary-soft', `color-mix(in srgb, ${accent} 18%, var(--color-surface))`);
}

/** Reads the saved mode, defaulting to `system`. */
function readMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

/** Reads the saved accent, or DEFAULT_ACCENT if none. */
function readAccent(): string {
  return localStorage.getItem(ACCENT_KEY) ?? DEFAULT_ACCENT;
}

// Apply at import time (before React mounts) so there's no flash of the wrong theme.
applyTheme(readMode());
applyAccent(readAccent());

/**
 * Provides theme state and keeps `<html>` in sync.
 *
 * Re-applies the theme/accent whenever they change. While in `system` mode it
 * also listens for OS light/dark changes and updates live.
 */
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

  /** Clears the saved preferences and returns to system theme + default accent. */
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

/** Reads the theme context; throws if used outside a ThemeProvider. */
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
