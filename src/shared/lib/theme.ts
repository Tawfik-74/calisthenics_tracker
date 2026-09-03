import { useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'ct.theme',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** The concrete theme a mode resolves to right now. */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  if (typeof globalThis.matchMedia !== 'function') return 'light';
  return globalThis.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function syncThemeColorMeta(): void {
  if (typeof document === 'undefined') return;
  const surface = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-surface')
    .trim();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (surface && meta) meta.setAttribute('content', surface);
}

/** Applies `data-theme` to <html> and keeps the theme-color meta in sync. */
export function useApplyTheme(): void {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'system') delete root.dataset.theme;
    else root.dataset.theme = mode;
    syncThemeColorMeta();

    if (mode !== 'system' || typeof globalThis.matchMedia !== 'function') return;
    const mq = globalThis.matchMedia(DARK_QUERY);
    const onChange = () => syncThemeColorMeta();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);
}
