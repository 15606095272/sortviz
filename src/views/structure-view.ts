import type { ViewContext, ViewModule } from '../core/registry';
import type { ViewState } from '../core/replay';
import { COPY } from '../copy/zh';
import { formatIndex, type IndexBase } from '../core/index-base';

export function createStructureView(): ViewModule {
  let host: HTMLElement | null = null;

  function mount(target: HTMLElement, _ctx: ViewContext): void {
    host = target;
    host.innerHTML = '';
    host.classList.add('structure-view');
  }

  function render(state: ViewState, ctx: ViewContext): void {
    if (!host) return;
    host.innerHTML = '';

    if (state.heapSize !== null) { renderHeap(host, state, ctx.indexBase ?? 0); return; }
    if (state.callStack.length > 0) { renderRecursionTree(host, state); return; }
    // 希尔排序：显示当前增量下的分组（组内做插入排序），比等有序区形成更能说明问题
    const gap = state.vars['gap'];
    if (ctx.algorithmId === 'shell' && gap !== undefined) { renderGroups(host, state, gap); return; }
    if (state.sorted.size > 0) { renderZones(host, state); return; }
    // 三种结构都没出现：第 0 步给「尚未开始」，跑起来之后给「无结构视图」的准确提示
    renderHint(host, state);
  }

  /** 希尔：按当前增量分组着色（下标 i 属于第 i % gap 组） */
  function renderGroups(root: HTMLElement, state: ViewState, gap: number): void {
    state.data.forEach((value, i) => {
      const zone = document.createElement('div');
      zone.className = 'zone';
      zone.dataset.group = String(i % gap);
      zone.textContent = String(value);
      root.append(zone);
    });
    const footer = document.createElement('div');
    footer.className = 'tree-footer';
    footer.textContent = COPY.shellGroupFooter.replace('{gap}', String(gap));
    root.append(footer);
  }

  function renderHint(root: HTMLElement, state: ViewState): void {
    const hint = document.createElement('p');
    hint.className = 'hint';
    // lastCodeLine 为 0 才是真的「还没开始」；已经跑起来却无可视结构时，别再说「尚未开始」
    hint.textContent = state.lastCodeLine === 0 ? COPY.hintStructure : COPY.hintNoStructure;
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

  const HEAP_NODE_H = 30;   // 与 CSS 里 .heap-node 的高度保持一致
  const HEAP_ROW_GAP = 28;

  /** 完全二叉树的经典几何：下标 i 在第 floor(log2(i+1)) 层，中心 x = ((slot+0.5)/2^level)*100% */
  function heapGeometry(index: number): { level: number; slot: number; pct: number; top: number } {
    const level = Math.floor(Math.log2(index + 1));
    const slot = index - (2 ** level - 1);
    return {
      level,
      slot,
      pct: ((slot + 0.5) / 2 ** level) * 100,
      top: level * (HEAP_NODE_H + HEAP_ROW_GAP),
    };
  }

  function renderHeap(root: HTMLElement, state: ViewState, indexBase: IndexBase = 0): void {
    const size = state.heapSize ?? state.data.length - 1;
    const count = Math.max(0, Math.min(size + 1, state.data.length));
    if (count === 0) return;

    const levels = Math.floor(Math.log2(count)) + 1;
    const slots = 2 ** (levels - 1);
    const tree = document.createElement('div');
    tree.className = 'heap-tree';
    tree.dataset.size = String(count);
    tree.dataset.levels = String(levels);
    tree.style.height = `${(levels - 1) * (HEAP_NODE_H + HEAP_ROW_GAP) + HEAP_NODE_H}px`;
    tree.style.setProperty('--heap-slots', String(slots));

    // 连线先入，节点后入 —— 节点要盖在连线之上
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'heap-edges');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    for (let i = 1; i < count; i++) {
      const parent = Math.floor((i - 1) / 2);
      const pg = heapGeometry(parent);
      const cg = heapGeometry(i);
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('class', 'heap-edge');
      line.setAttribute('x1', `${pg.pct}%`);
      line.setAttribute('y1', `${pg.top + HEAP_NODE_H}px`);
      line.setAttribute('x2', `${cg.pct}%`);
      line.setAttribute('y2', `${cg.top}px`);
      line.dataset.child = String(i);
      line.dataset.parent = String(parent);
      svg.append(line);
    }
    tree.append(svg);

    for (let i = 0; i < count; i++) {
      const g = heapGeometry(i);
      const node = document.createElement('div');
      node.className = 'heap-node';
      node.dataset.index = String(i);
      node.dataset.level = String(g.level);
      if (i > 0) node.dataset.parent = String(Math.floor((i - 1) / 2));
      node.style.left = `${g.pct}%`;
      node.style.top = `${g.top}px`;
      node.textContent = String(state.data[i]);
      tree.append(node);

      // 下标标签做成独立元素挂在节点下方：节点本身有 overflow:hidden（防长数字溢出），
      // 用 ::after 画会被裁掉；同时下标要跟随 0 基/1 基开关，所以由这里按 formatIndex 渲染。
      const label = document.createElement('span');
      label.className = 'heap-idx';
      label.textContent = String(formatIndex(i, indexBase));
      label.style.left = `${g.pct}%`;
      label.style.top = `${g.top + HEAP_NODE_H}px`;
      tree.append(label);
    }
    root.append(tree);

    const footer = document.createElement('div');
    footer.className = 'tree-footer';
    footer.textContent = COPY.heapFooter.replace('{count}', String(count)).replace('{levels}', String(levels));
    root.append(footer);
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
