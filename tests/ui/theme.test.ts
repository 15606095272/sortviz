import { applyTheme, loadTheme, normalizeTheme, saveTheme, THEME_STORAGE_KEY } from '../../src/ui/theme';

describe('主题切换', () => {
  it('normalizeTheme：只认 dark，其余回退 light', () => {
    expect(normalizeTheme('dark')).toBe('dark');
    expect(normalizeTheme('light')).toBe('light');
    expect(normalizeTheme(null)).toBe('light');
    expect(normalizeTheme(undefined)).toBe('light');
    expect(normalizeTheme('rose')).toBe('light');
  });

  it('applyTheme 写到 html 的 data-theme 上', () => {
    const root = document.createElement('html');
    applyTheme('dark', root);
    expect(root.dataset.theme).toBe('dark');
    applyTheme('light', root);
    expect(root.dataset.theme).toBe('light');
  });

  it('loadTheme 从存储里恢复', () => {
    const store = new Map<string, string>([[THEME_STORAGE_KEY, 'dark']]);
    expect(loadTheme({ getItem: (k: string) => store.get(k) ?? null })).toBe('dark');
  });

  it('loadTheme：存储里是乱值时回退浅色', () => {
    expect(loadTheme({ getItem: () => 'neon' })).toBe('light');
  });

  it('loadTheme：storage 抛异常时静默回退浅色', () => {
    expect(
      loadTheme({
        getItem: () => {
          throw new Error('SecurityError');
        },
      }),
    ).toBe('light');
  });

  it('saveTheme 写入存储键；抛异常时不冒泡', () => {
    const written: Array<[string, string]> = [];
    saveTheme('dark', { setItem: (k, v) => written.push([k, v]) });
    expect(written).toEqual([[THEME_STORAGE_KEY, 'dark']]);
    expect(() =>
      saveTheme('dark', {
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      }),
    ).not.toThrow();
  });
});
