import { useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

const KEY = 'vlu_theme_mode';
const listeners = new Set<(mode: ThemeMode) => void>();

function storedMode(): ThemeMode | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function getThemeMode(): ThemeMode {
  return storedMode() || 'light';
}

export function applyThemeMode(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* localStorage không khả dụng thì chỉ áp dụng cho phiên này */
  }
  listeners.forEach((l) => l(mode));
}

export function toggleThemeMode(): ThemeMode {
  const next: ThemeMode = getThemeMode() === 'dark' ? 'light' : 'dark';
  applyThemeMode(next);
  return next;
}

export function useThemeMode(): { mode: ThemeMode; toggle: () => void } {
  const [mode, setMode] = useState<ThemeMode>(getThemeMode);

  useEffect(() => {
    applyThemeMode(mode);
    listeners.add(setMode);
    return () => {
      listeners.delete(setMode);
    };
  }, [mode]);

  return { mode, toggle: toggleThemeMode };
}