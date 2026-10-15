import type { ViewContext, ViewModule } from '../core/registry';
import type { ViewState } from '../core/replay';
import { COPY } from '../copy/zh';

const MAX_PER_ROW = 16;

export function createArrayView(): ViewModule {
  let host: HTMLElement | null = null;
  let cells: HTMLElement[] = [];
  let ptrs: HTMLElement[] = [];
  let auxCells: HTMLElement[] = [];
  let auxRows: HTMLElement[] = [];
  let data: number[] = [];

  function mount(target: HTMLElement, ctx: ViewContext): void {
    host = target;
    data = [...ctx.data];
    host.innerHTML = '';
    host.classList.add('array-view');
    cells = [];
    ptrs = [];
    auxCells = [];
    auxRows = [];

    for (let start = 0; start < data.length; start += MAX_PER_ROW) {
      const size = Math.min(MAX_PER_ROW, data.length - start);
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
        idx.textContent = String(index);
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
        ptrs[index] = ptr;
        auxCells[index] = auxCell;
      }
      row.append(idxRow, ptrRow);
      auxRow.append(auxLab, auxIdxRow);
      host.append(row, auxRow);
      auxRows.push(auxRow);
    }
  }

  function render(state: ViewState, _ctx: ViewContext): void {
    if (!host) return;
    const pointerLabels = new Map<number, string[]>();
    state.activeIndices.forEach((index, order) => {
      const label = order === 0 ? 'i' : 'j';
      pointerLabels.set(index, [...(pointerLabels.get(index) ?? []), label]);
    });
    for (const [index, marks] of state.marks) {
      if (marks.has('pivot')) pointerLabels.set(index, [...(pointerLabels.get(index) ?? []), 'pivot']);
    }

    for (let i = 0; i < state.data.length; i++) {
      const cell = cells[i];
      if (!cell) continue;
      cell.textContent = String(state.data[i]);
      const marks = new Set<string>(state.marks.get(i) ?? []);
      if (state.activeIndices.includes(i)) marks.add('comparing');
      // 堆排序：heapSize 是「堆内最后一个下标」，其左侧即当前堆区（虚线边框，随堆收缩）
      if (state.heapSize !== null && i <= state.heapSize) marks.add('heap');
      cell.dataset.mark = [...marks].join(' ');
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
    if (host) { host.innerHTML = ''; host.classList.remove('array-view'); }
    host = null; cells = []; ptrs = []; auxCells = []; auxRows = [];
  }

  return { kind: 'array', mount, render, destroy };
}
