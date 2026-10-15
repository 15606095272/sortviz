import type { ViewContext, ViewModule } from '../core/registry';
import type { ViewState } from '../core/replay';
import { COPY } from '../copy/zh';

export function createStructureView(): ViewModule {
  let host: HTMLElement | null = null;

  function mount(target: HTMLElement, _ctx: ViewContext): void {
    host = target;
    host.innerHTML = '';
    host.classList.add('structure-view');
  }

  function render(state: ViewState, _ctx: ViewContext): void {
    if (!host) return;
    host.innerHTML = '';

    if (state.heapSize !== null) { renderHeap(host, state); return; }
    if (state.callStack.length > 0) { renderRecursionTree(host, state); return; }
    if (state.sorted.size > 0) { renderZones(host, state); return; }
    // 第 0 步三种结构都还没出现（快排要等进入划分、插入/冒泡要等有序区标记），
    // 否则右侧就是一张空白卡；给一句占位说明，第一眼不至于像坏了。
    renderHint(host);
  }

  function renderHint(root: HTMLElement): void {
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = COPY.hintStructure;
    root.append(hint);
  }

  function renderRecursionTree(root: HTMLElement, state: ViewState): void {
    state.callStack.forEach(([lo, hi], depth) => {
      if (depth > 0) root.append(Object.assign(document.createElement('div'), { className: 'connector' }));
      const level = document.createElement('div');
      level.className = 'tree-level';
      if (depth === state.callStack.length - 1) level.dataset.current = 'true';
      const node = document.createElement('div');
      node.className = 'tree-node';
      node.textContent = `[${state.data.slice(lo, hi + 1).join(' ')}]`;
      const cap = document.createElement('small');
      cap.textContent = depth === state.callStack.length - 1 ? `当前划分 [${lo}, ${hi}]` : `外层区间 [${lo}, ${hi}]`;
      node.append(cap);
      level.append(node);
      root.append(level);
    });
    const footer = document.createElement('div');
    footer.className = 'tree-footer';
    footer.textContent = `${COPY.treeDepth} ${state.callStack.length} · ${COPY.treeSplitHint}`;
    root.append(footer);
  }

  function renderHeap(root: HTMLElement, state: ViewState): void {
    // 按「层」分行排布：第 d 层最多 2^d 个节点，这样才看得出完全二叉树的形状
    // （早先直接把节点顺序 append 进 flex 容器，结果塌成一竖列，没有任何树形）
    const size = (state.heapSize ?? state.data.length - 1);
    let index = 0;
    let level = 0;
    while (index <= size && index < state.data.length) {
      if (level > 0) {
        const connector = document.createElement('div');
        connector.className = 'connector';
        root.append(connector);
      }
      const row = document.createElement('div');
      row.className = 'tree-level';
      const count = Math.min(2 ** level, size - index + 1);
      for (let k = 0; k < count; k++) {
        const node = document.createElement('div');
        node.className = 'heap-node';
        node.dataset.index = String(index);
        if (index > 0) node.dataset.parent = String(Math.floor((index - 1) / 2));
        node.textContent = String(state.data[index]);
        row.append(node);
        index += 1;
      }
      root.append(row);
      level += 1;
    }
  }

  function renderZones(root: HTMLElement, state: ViewState): void {
    state.data.forEach((value, i) => {
      const zone = document.createElement('div');
      zone.className = 'zone';
      zone.dataset.zone = state.sorted.has(i) ? 'sorted' : 'unsorted';
      zone.textContent = String(value);
      root.append(zone);
    });
  }

  function destroy(): void {
    if (host) { host.innerHTML = ''; host.classList.remove('structure-view'); }
    host = null;
  }

  return { kind: 'structure', mount, render, destroy };
}
