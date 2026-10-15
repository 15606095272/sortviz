import type { CodeLine, Complexity } from '../core/registry';
import type { ViewState } from '../core/replay';
import type { MarkLabel, Stats } from '../core/step';
import { COPY } from '../copy/zh';

export interface VarEntry { label: string; value: string }

/** 取不到的量一律显示占位符，绝不从解说文本里猜数字 */
const DASH = '—';

/** 算法态变量名（COPY 只管界面固定文案，这些是推导结果的字段名，集中在此以免散落到处） */
const VAR = {
  depth: '递归深度',
  placed: '已就位',
  heapSize: '堆大小',
  pivot: 'pivot',
  low: 'low',
  high: 'high',
  j: 'j',
  i: 'i（空位）',
  key: 'key',
} as const;

function markedIndex(state: ViewState, label: MarkLabel): number | null {
  for (const [index, marks] of state.marks) {
    if (marks.has(label)) return index;
  }
  return null;
}

function valueAt(state: ViewState, index: number | null): string {
  if (index === null) return DASH;
  const value = state.data[index];
  return value === undefined ? DASH : String(value);
}

function activeAt(state: ViewState, order: number): string {
  const value = state.activeIndices[order];
  return value === undefined ? DASH : String(value);
}

/**
 * 纯函数：把步骤流能证明的量推导成「变量 → 值」列表。
 * 只读 ViewState，取不到的显示 '—'，不解析 lastNote。
 */
export function deriveVars(state: ViewState, algorithmId: string): VarEntry[] {
  const out: VarEntry[] = [];
  if (state.callStack.length > 0) out.push({ label: VAR.depth, value: String(state.callStack.length) });
  out.push({ label: VAR.placed, value: String(state.sorted.size) });

  const top = state.callStack.length > 0 ? state.callStack[state.callStack.length - 1] : null;

  switch (algorithmId) {
    case 'quick':
      out.push({ label: VAR.pivot, value: valueAt(state, markedIndex(state, 'pivot')) });
      out.push({ label: VAR.low, value: top ? String(top[0]) : DASH });
      out.push({ label: VAR.high, value: top ? String(top[1]) : DASH });
      out.push({ label: VAR.j, value: activeAt(state, 0) });
      break;
    case 'insertion':
      out.push({ label: VAR.key, value: valueAt(state, markedIndex(state, 'active')) });
      out.push({ label: VAR.j, value: activeAt(state, 0) });
      out.push({ label: VAR.i, value: activeAt(state, 1) });
      break;
    case 'bubble':
      out.push({ label: VAR.j, value: activeAt(state, 0) });
      break;
    default:
      break;
  }

  if (state.heapSize !== null) out.push({ label: VAR.heapSize, value: String(state.heapSize) });
  return out;
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

function statChip(label: string, value: string): HTMLElement {
  const chip = document.createElement('span');
  chip.className = 'stat';
  const strong = document.createElement('b');
  strong.textContent = value;
  chip.append(document.createTextNode(`${label} `), strong);
  return chip;
}

/** 变量区：一行小卡片，键值用 deriveVars 的推导结果 */
export function renderVars(host: HTMLElement, state: ViewState, algorithmId: string): void {
  host.innerHTML = '';
  for (const entry of deriveVars(state, algorithmId)) host.append(statChip(entry.label, entry.value));
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

/** 当前动作说明（文本直接来自步骤的 note） */
export function renderActionNote(host: HTMLElement, note: string): void {
  host.textContent = note;
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
