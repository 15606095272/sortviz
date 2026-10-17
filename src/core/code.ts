import type { Order } from './order';
import type { IndexBase } from './index-base';

/** 展示用代码语言：默认 C（与 408 的 C 风格叙述接近） */
export type CodeLang = 'c' | 'cpp' | 'java' | 'python';

export const CODE_LANGS: readonly CodeLang[] = ['c', 'cpp', 'java', 'python'];

export const LANG_STORAGE_KEY = 'sortviz.lang';

/**
 * 一行真实代码。anchor = 该行对应的「语义行号」——也就是步骤流里的 codeLine，
 * 指向模块 pseudocode 骨架的行号。同一个 anchor 可以出现在多行上（例如 if 的开括号行与闭括号行）。
 */
export interface CodeLangLine {
  /** 0 基 · 升序（基准文本，四种组合的最后回落） */
  text: string;
  /** 0 基 · 降序（仅"随方向会变"的行需要给）；不给则降序也用 text */
  descText?: string;
  /** 1 基 · 升序（教材口径）；只给"下标/循环边界真的会变"的行 */
  text1?: string;
  /** 1 基 · 降序（既换进制又反方向的行才需要）；给了 text1 又给 descText 的行必须给 */
  descText1?: string;
  anchor?: number;
}

/**
 * 渲染口径：代码面板同时对齐「排序方向」与「下标进制」。
 * 行级覆盖做成二维（text / descText × 0 基 / 1 基），不复制整份代码。
 */
export interface CodeView {
  order: Order;
  base: IndexBase;
}

/** 一个模块的四语言实现。各语言按自己的习惯换行，靠 anchor 与语义行对齐。 */
export type CodeBook = Record<CodeLang, readonly CodeLangLine[]>;

export function normalizeLang(value: string | null | undefined): CodeLang {
  return value === 'cpp' || value === 'java' || value === 'python' ? value : 'c';
}

export function codeFor(book: CodeBook, lang: CodeLang): readonly CodeLangLine[] {
  return book[lang];
}

/**
 * 按「方向 + 下标进制」取该行文本，四级回落：
 * 1 基·降序 → descText1 → descText → text1 → text
 * 1 基·升序 → text1 → text
 * 0 基·降序 → descText → text
 * 0 基·升序 → text（恒等：与引入进制前逐字一致）
 */
export function codeText(line: CodeLangLine, view: CodeView): string {
  if (view.base === 1 && view.order === 'desc') return line.descText1 ?? line.descText ?? line.text1 ?? line.text;
  if (view.base === 1) return line.text1 ?? line.text;
  if (view.order === 'desc') return line.descText ?? line.text;
  return line.text;
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
