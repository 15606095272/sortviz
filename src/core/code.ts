import type { Order } from './order';

/** 展示用代码语言：默认 C（与 408 的 C 风格叙述接近） */
export type CodeLang = 'c' | 'cpp' | 'java' | 'python';

export const CODE_LANGS: readonly CodeLang[] = ['c', 'cpp', 'java', 'python'];

export const LANG_STORAGE_KEY = 'sortviz.lang';

/**
 * 一行真实代码。anchor = 该行对应的「语义行号」——也就是步骤流里的 codeLine，
 * 指向模块 pseudocode 骨架的行号。同一个 anchor 可以出现在多行上（例如 if 的开括号行与闭括号行）。
 */
export interface CodeLangLine {
  text: string;
  /** 降序时改用的文本（仅"随方向会变"的行需要给）；不给则降序也用 text */
  descText?: string;
  anchor?: number;
}

/** 一个模块的四语言实现。各语言按自己的习惯换行，靠 anchor 与语义行对齐。 */
export type CodeBook = Record<CodeLang, readonly CodeLangLine[]>;

export function normalizeLang(value: string | null | undefined): CodeLang {
  return value === 'cpp' || value === 'java' || value === 'python' ? value : 'c';
}

export function codeFor(book: CodeBook, lang: CodeLang): readonly CodeLangLine[] {
  return book[lang];
}

/** 按方向取该行文本：asc 恒用 text；desc 有 descText 就用它 */
export function codeText(line: CodeLangLine, order: Order): string {
  return order === 'desc' && line.descText !== undefined ? line.descText : line.text;
}

export function loadLang(storage?: Pick<Storage, 'getItem'> | null): CodeLang {
  try {
    return normalizeLang(storage?.getItem(LANG_STORAGE_KEY));
  } catch {
    return 'c';
  }
}

export function saveLang(lang: CodeLang, storage?: Pick<Storage, 'setItem'> | null): void {
  try {
    storage?.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* 存不下就算了 */
  }
}
