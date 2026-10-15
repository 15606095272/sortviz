import type { ViewContext, ViewModule } from '../core/registry';
import type { ViewState } from '../core/replay';
import { COPY } from '../copy/zh';
import { formatIndex, type IndexBase } from '../core/index-base';

export const MAX_PER_ROW = 16;
export const MIN_PER_ROW = 4;
/** 每格占位宽 / 列间距：与 theme.css 的 --cell-w(58px) 和 .idxrow 的列间距保持一致 */
const CELL_WIDTH = 58;
const CELL_GAP = 12;
/** jsdom / 隐藏容器下 clientWidth 为 0 时用兜底值，保证默认仍是 16 格一行 */
const FALLBACK_WIDTH = 1200;

/** 按容器宽度算每行放几格（格宽 + 间距固定），下限 MIN_PER_ROW、上限 MAX_PER_ROW */
export function cellsPerRow(containerWidth: number, cellWidth = CELL_WIDTH, gap = CELL_GAP): number {
  const fit = Math.floor((containerWidth + gap) / (cellWidth + gap));
  return Math.min(MAX_PER_ROW, Math.max(MIN_PER_ROW, fit));
}

export function createArrayView(): ViewModule {
  let host: HTMLElement | null = null;
  let cells: HTMLElement[] = [];
  let idxNums: HTMLElement[] = [];
  let ptrs: HTMLElement[] = [];
  let auxCells: HTMLElement[] = [];
  let auxRows: HTMLElement[] = [];
  let data: number[] = [];
  /** 当前每行格数：由宿主宽度算出，宽度变化时重建行（总格数不变，只改换行位置） */
  let perRow = MAX_PER_ROW;
  /** 最近一次 render 的状态与上下文：重建行后要按它重渲染，否则宽高变化会丢状态 */
  let lastState: ViewState | null = null;
  let lastCtx: ViewContext | null = null;
  let ro: ResizeObserver | null = null;

  function resetRefs(): void {
    cells = [];
    idxNums = [];
    ptrs = [];
    auxCells = [];
    auxRows = [];
  }

  /** 按当前 perRow 把格子铺进宿主（调用方负责先清空宿主 / 调 resetRefs） */
  function buildRows(ctx: ViewContext): void {
    if (!host) return;
    const base: IndexBase = ctx.indexBase ?? 0;

    for (let start = 0; start < data.length; start += perRow) {
      const size = Math.min(perRow, data.length - start);
      const row = document.createElement('div');
      row.className = 'cellrow';
      const idxRow = document.createElement('div');
      idxRow.className = 'idxrow';
      const ptrRow = document.createElement('div');
      ptrRow.className = 'ptrs';

      // 同块的辅助数组行（归并/基数用）：无 aux 步骤时整行 hidden
      const auxRow = document.createElement('div');
      auxRow.className = 'auxrow';
      auxRow.hidden = true;
      const auxLab = document.createElement('div');
      auxLab.className = 'auxlab';
      auxLab.textContent = COPY.auxArray;
      const auxIdxRow = document.createElement('div');
      auxIdxRow.className = 'idxrow';

      for (let k = 0; k < size; k++) {
        const index = start + k;
        const box = document.createElement('div');
        box.className = 'cellbox';
        const idx = document.createElement('div');
        idx.className = 'idxnum';
        idx.textContent = String(formatIndex(index, base));
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = String(index);
        const ptr = document.createElement('div');
        ptr.className = 'ptr';
        ptr.dataset.index = String(index);
        box.append(idx, cell);
        idxRow.append(box);
        ptrRow.append(ptr);

        // 辅助格子：无 idxnum、无 ptr，只存引用
        const auxBox = document.createElement('div');
        auxBox.className = 'auxbox';
        const auxCell = document.createElement('div');
        auxCell.className = 'auxcell';
        auxCell.dataset.index = String(index);
        auxBox.append(auxCell);
        auxIdxRow.append(auxBox);

        cells[index] = cell;
        idxNums[index] = idx;
        ptrs[index] = ptr;
        auxCells[index] = auxCell;
      }
      row.append(idxRow, ptrRow);
      auxRow.append(auxLab, auxIdxRow);
      host.append(row, auxRow);
      auxRows.push(auxRow);
    }
  }

  /** 宿主宽度变化：换行位置重建行，再按最近状态重渲染（格数与标记都不丢） */
  function rebuildRows(): void {
    if (!host || !lastCtx) return;
    const keep = lastState;
    const keepCtx = lastCtx;
    host.innerHTML = '';
    resetRefs();
    buildRows(keepCtx);
    if (keep) render(keep, keepCtx);
  }

  function mount(target: HTMLElement, ctx: ViewContext): void {
    host = target;
    data = [...ctx.data];
    lastCtx = ctx;
    lastState = null;
    host.innerHTML = '';
    host.classList.add('array-view');
    resetRefs();
    // clientWidth 在 jsdom / 隐藏容器里恒为 0：0 或负数一律退回兜底宽度（默认 16 格一行）
    perRow = cellsPerRow(target.clientWidth || FALLBACK_WIDTH);
    buildRows(ctx);

    // jsdom 没有 ResizeObserver —— 必须判存在，否则测试环境直接崩
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (!host) return;
        const next = cellsPerRow(host.clientWidth || FALLBACK_WIDTH);
        if (next === perRow) return;
        perRow = next;
        rebuildRows();
      });
      ro.observe(target);
    }
  }

  function render(state: ViewState, ctx: ViewContext): void {
    if (!host) return;
    lastState = state;
    lastCtx = ctx;
    const base: IndexBase = ctx.indexBase ?? 0;
    const pointerLabels = new Map<number, string[]>();
    state.activeIndices.forEach((index, order) => {
      const label = order === 0 ? 'i' : 'j';
      pointerLabels.set(index, [...(pointerLabels.get(index) ?? []), label]);
    });
    for (const [index, marks] of state.marks) {
      if (marks.has('pivot')) pointerLabels.set(index, [...(pointerLabels.get(index) ?? []), 'pivot']);
    }

    // 当前作用域（越界淡化用，独立于 data-mark 的算法标记语义）：
    // 堆排序进行中以堆为准（heapSize 是堆内最后一个下标），否则看递归栈最后一层；
    // 两者都没有时 scope 为 null = 全部在范围内，谁也不淡化。
    const scope: [number, number] | null =
      state.heapSize !== null
        ? [0, state.heapSize]
        : state.callStack.length > 0
          ? state.callStack[state.callStack.length - 1]
          : null;

    for (let i = 0; i < state.data.length; i++) {
      const cell = cells[i];
      if (!cell) continue;
      // 下标文本随开关换算（切进制不必重新 mount）；data-index 仍是 0 基的 DOM 契约
      const idxNum = idxNums[i];
      if (idxNum) idxNum.textContent = String(formatIndex(i, base));
      cell.textContent = String(state.data[i]);
      const marks = new Set<string>(state.marks.get(i) ?? []);
      if (state.activeIndices.includes(i)) marks.add('comparing');
      // 堆排序：heapSize 是「堆内最后一个下标」，其左侧即当前堆区（虚线边框，随堆收缩）
      if (state.heapSize !== null && i <= state.heapSize) marks.add('heap');
      cell.dataset.mark = [...marks].join(' ');
      // 递归区间 / 堆区之外的格子淡化：与 data-mark 分开，免得污染算法标记语义
      cell.dataset.faded = scope && (i < scope[0] || i > scope[1]) ? '1' : '0';
      const ptr = ptrs[i];
      if (ptr) {
        // 每个指针一个彩色药丸：颜色由 theme.css 按 pl-i / pl-j / pl-pivot 给
        ptr.textContent = '';
        for (const label of pointerLabels.get(i) ?? []) {
          const pill = document.createElement('span');
          pill.className = `pl pl-${label}`;
          pill.textContent = label;
          ptr.append(pill);
        }
      }
    }

    // 辅助数组行：无 aux 步骤（state.aux === null）时整行隐藏
    const aux = state.aux;
    for (const auxRow of auxRows) auxRow.hidden = aux === null;
    if (aux) {
      for (let i = 0; i < auxCells.length; i++) {
        const auxCell = auxCells[i];
        if (!auxCell) continue;
        const value = aux[i];
        // 未写的槽位是 null（applyStep 建数组时 fill(null)）：渲染成空串，不显示 0/undefined
        auxCell.textContent = value === null || value === undefined ? '' : String(value);
      }
    }
  }

  function destroy(): void {
    // 先解绑观察者，免得销毁后回调又去碰已清空的宿主
    if (ro) { ro.disconnect(); ro = null; }
    if (host) { host.innerHTML = ''; host.classList.remove('array-view'); }
    host = null;
    resetRefs();
    data = [];
    lastState = null;
    lastCtx = null;
  }

  return { kind: 'array', mount, render, destroy };
}
