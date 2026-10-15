import type { ViewContext, ViewModule } from '../core/registry';
import type { ViewState } from '../core/replay';

const MAX_PER_ROW = 16;

export function createArrayView(): ViewModule {
  let host: HTMLElement | null = null;
  let cells: HTMLElement[] = [];
  let ptrs: HTMLElement[] = [];
  let data: number[] = [];

  function mount(target: HTMLElement, ctx: ViewContext): void {
    host = target;
    data = [...ctx.data];
    host.innerHTML = '';
    host.classList.add('array-view');
    cells = [];
    ptrs = [];

    for (let start = 0; start < data.length; start += MAX_PER_ROW) {
      const size = Math.min(MAX_PER_ROW, data.length - start);
      const row = document.createElement('div');
      row.className = 'cellrow';
      const idxRow = document.createElement('div');
      idxRow.className = 'idxrow';
      const ptrRow = document.createElement('div');
      ptrRow.className = 'ptrs';

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
        cells[index] = cell;
        ptrs[index] = ptr;
      }
      row.append(idxRow, ptrRow);
      host.append(row);
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
      cell.dataset.mark = [...marks].join(' ');
      const ptr = ptrs[i];
      if (ptr) ptr.textContent = (pointerLabels.get(i) ?? []).join(' ');
    }
  }

  function destroy(): void {
    if (host) { host.innerHTML = ''; host.classList.remove('array-view'); }
    host = null; cells = []; ptrs = [];
  }

  return { kind: 'array', mount, render, destroy };
}
