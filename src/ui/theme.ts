export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'sortviz.theme';

/** 只认 'dark'，其它（含 null/乱写）一律回退浅色 */
export function normalizeTheme(value: string | null | undefined): Theme {
  return value === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme;
}

/** 读偏好；storage 不可用（隐私模式、无 localStorage）时静默回退浅色 */
export function loadTheme(storage?: Pick<Storage, 'getItem'> | null): Theme {
  try {
    return normalizeTheme(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'light';
  }
}

/** 存偏好；存不下也不影响使用 */
export function saveTheme(theme: Theme, storage?: Pick<Storage, 'setItem'> | null): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* 忽略 */
  }
}
