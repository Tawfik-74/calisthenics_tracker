import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveTheme, useThemeStore } from './theme';

afterEach(() => {
  useThemeStore.setState({ mode: 'system' });
  vi.unstubAllGlobals();
});

describe('useThemeStore', () => {
  it('defaults to system', () => {
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('updates the mode', () => {
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
  });
});

describe('resolveTheme', () => {
  it('returns explicit modes unchanged', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('follows the media query for system', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    expect(resolveTheme('system')).toBe('dark');
  });
});
