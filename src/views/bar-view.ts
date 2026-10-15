import type { ViewContext, ViewModule } from '../core/registry';
import type { ViewState } from '../core/replay';

const MIN_HEIGHT_PCT = 6;   // 值为 0 或负数时也要看得见，不塌成 0

export function createBarView(): ViewModule {
  let host: HTMLElement | null = null;
  let cols: HTMLElement[] = [];
  let nums: HTMLElement[] = [];

  function mount(target: HTMLElement, ctx: ViewContext): void {
    host = target;
    host.innerHTML = '';
    host.classList.add('bar-view');
    cols = [];
    nums = [];

    const wrap = document.createElement('div');
    wrap.className = 'bars';
    ctx.data.forEach((_value, index) => {
      const box = document.createElement('div');
      box.className = 'barbox';
      box.dataset.index = String(index);
      const col = document.createElement('div');
      col.className = 'barcol';
      const num = document.createElement('span');
      num.className = 'barnum';
      col.append(num);
      box.append(col);
      wrap.append(box);
      cols[index] = col;
      nums[index] = num;
    });
    host.append(wrap);
  }

  function render(state: ViewState, _ctx: ViewContext): void {
    if (!host) return;
    const max = Math.max(1, ...state.data.map((v) => Math.abs(v)));
    for (let i = 0; i < state.data.length; i++) {
      const col = cols[i];
      if (!col) continue;
      const value = state.data[i];
      const pct = Math.max(MIN_HEIGHT_PCT, (Math.abs(value) / max) * 100);
      col.style.height = `${pct.toFixed(1)}%`;
      col.dataset.sign = value < 0 ? 'neg' : 'pos';
      const num = nums[i];
      if (num) num.textContent = String(value);
      // 标记映射与数组视图完全一致
      const marks = new Set<string>(state.marks.get(i) ?? []);
      if (state.activeIndices.includes(i)) marks.add('comparing');
      if (state.heapSize !== null && i <= state.heapSize) marks.add('heap');
      col.dataset.mark = [...marks].join(' ');
    }
  }

  function destroy(): void {
    if (host) {
      host.innerHTML = '';
      host.classList.remove('bar-view');
    }
    host = null;
    cols = [];
    nums = [];
  }

  return { kind: 'bar', mount, render, destroy };
}
