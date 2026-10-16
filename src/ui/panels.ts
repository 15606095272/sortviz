import type { CodeLine, Complexity } from '../core/registry';
import type { ViewState } from '../core/replay';
import type { Stats } from '../core/step';
import type { CodeBook, CodeLang } from '../core/code';
import { codeFor } from '../core/code';
import { COPY } from '../copy/zh';
import { formatIndex, rewriteIndices, type IndexBase } from '../core/index-base';

export interface VarEntry { label: string; value: string }

/** 固定渲染键序：保证面板条目顺序稳定，不随步骤跳来跳去 */
const VAR_ORDER = ['i', 'j', 'mid', 'low', 'high', 'pivot', 'key', 'minIndex', 'gap', 'k', 'width', 'lo', 'hi', 'place', 'root', 'child', 'heapSize', 'depth', 'placed'];

/**
 * 纯函数：把 ViewState 里的变量值（算法步骤用 withVars 带出的真值）渲染成「变量 → 值」列表。
 * 真值优先：算法没带出的量不再从解说文本里猜数字，只对公共量做兜底推导
 * （递归深度 ← 调用栈深度，堆大小 ← 堆区右界 + 1，已就位 ← 有序集大小）。
 */
/** 这些键存的是「下标」，切到 1 基时要 +1；其余键（pivot/key/增量/段长/堆大小…）是值或计数，不换算 */
const INDEX_KEYS = new Set(['i', 'j', 'mid', 'low', 'high', 'minIndex', 'k', 'lo', 'hi', 'root', 'child']);

export function deriveVars(state: ViewState, _algorithmId: string, indexBase: IndexBase = 0): VarEntry[] {
  const labels = COPY.varLabels as Record<string, string>;
  const label = (key: string): string => labels[key] ?? key;
  const entries: VarEntry[] = [];
  for (const key of VAR_ORDER) {
    const value = state.vars[key];
    if (key === 'placed' || key === 'depth' || key === 'heapSize') continue;   // 公共量单独处理
    if (value !== undefined) {
      const shown = INDEX_KEYS.has(key) ? formatIndex(value, indexBase) : value;
      entries.push({ label: label(key), value: String(shown) });
    }
  }
  // 公共量：算法没带就自己推（递归深度从 callStack，已就位从 sorted，堆大小从 heapSize+1）
  if (state.callStack.length > 0) entries.push({ label: label('depth'), value: String(state.callStack.length) });
  if (state.heapSize !== null) entries.push({ label: label('heapSize'), value: String(state.heapSize + 1) });
  entries.push({ label: label('placed'), value: String(state.sorted.size) });
  return entries;
}

/** 伪代码：每行一个 .ln，行号在 <b> 里，缩进 = 2 空格 × indent，命中行加 .hl（恰好一行） */
export function renderPseudocode(host: HTMLElement, pseudocode: readonly CodeLine[], activeLine: number): void {
  host.innerHTML = '';
  for (const line of pseudocode) {
    const span = document.createElement('span');
    span.className = line.line === activeLine ? 'ln hl' : 'ln';
    const num = document.createElement('b');
    num.textContent = String(line.line);
    span.append(num, document.createTextNode(' '.repeat(line.indent * 2) + line.text));
    host.append(span);
  }
}

/**
 * 真实代码：每行一个 .ln，行号在 <b> 里（沿用 renderPseudocode 的 DOM 契约：.ln / .ln b / .ln.hl）。
 * 高亮规则：把 anchor === 当前语义行号的真实行**全部**标 hl —— 一个语义行常对应多行真实代码
 * （例如 `while (...) {` 与它的 `}` 都算「比较/循环」这一行）。
 */
export function renderCode(host: HTMLElement, book: CodeBook, lang: CodeLang, codeLine: number | undefined): void {
  host.innerHTML = '';
  codeFor(book, lang).forEach((entry, i) => {
    const row = document.createElement('span');
    row.className = 'ln';
    if (codeLine !== undefined && entry.anchor === codeLine) row.classList.add('hl');
    const num = document.createElement('b');
    num.textContent = String(i + 1);        // 展示序号 1..n，与 anchor（语义行号）无关
    row.append(num, document.createTextNode(entry.text));
    host.append(row);
  });
}

function statChip(label: string, value: string): HTMLElement {
  const chip = document.createElement('span');
  chip.className = 'stat';
  const strong = document.createElement('b');
  strong.textContent = value;
  chip.append(document.createTextNode(`${label} `), strong);
  return chip;
}

/** 变量区：一行小卡片，键值用 deriveVars 的推导结果 */
export function renderVars(host: HTMLElement, state: ViewState, algorithmId: string, indexBase: IndexBase = 0): void {
  host.innerHTML = '';
  for (const entry of deriveVars(state, algorithmId, indexBase)) host.append(statChip(entry.label, entry.value));
}

/** 计数器区：比较 / 交换 / 移动（408 口径：交换 = 3 移动） */
export function renderCounters(host: HTMLElement, stats: Stats): void {
  host.innerHTML = '';
  host.append(
    statChip(COPY.counters.compare, String(stats.compare)),
    statChip(COPY.counters.swap, String(stats.swap)),
    statChip(COPY.counters.move, String(stats.move)),
  );
}

/** 当前动作说明（文本直接来自步骤的 note；1 基展示时把 a[k] / A[k] 形式的下标 +1） */
export function renderActionNote(host: HTMLElement, note: string, indexBase: IndexBase = 0): void {
  host.textContent = rewriteIndices(note, indexBase);
}

/** 复杂度区：平均 / 最坏 / 空间 / 稳定性 四行 */
export function renderComplexity(host: HTMLElement, complexity: Complexity, stable: boolean): void {
  host.innerHTML = '';
  const rows: [string, string][] = [
    [COPY.complexityAvg, complexity.avg],
    [COPY.complexityWorst, complexity.worst],
    [COPY.complexitySpace, complexity.space],
    [COPY.complexityStable, stable ? COPY.complexityStable : COPY.complexityUnstable],
  ];
  for (const [label, value] of rows) {
    const row = document.createElement('div');
    row.className = 'cxrow';
    const key = document.createElement('span');
    key.className = 'k';
    key.textContent = label;
    const strong = document.createElement('b');
    strong.textContent = value;
    row.append(key, strong);
    host.append(row);
  }
}
