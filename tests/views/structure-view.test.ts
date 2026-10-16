import { createStructureView } from '../../src/views/structure-view';
import { createViewState, replay } from '../../src/core/replay';
import { compareStep, markStep, unmarkStep, withVars } from '../../src/core/step';
import { COPY } from '../../src/copy/zh';
import type { ViewContext } from '../../src/core/registry';

const ctx = (data: number[]): ViewContext => ({ data, algorithmId: 'quick' });

describe('结构视图', () => {
  it('callStack 里有区间时渲染递归树，且当前层被标记', () => {
    const data = [49, 38, 65, 97];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, ctx(data));
    view.render(replay(data, [markStep('range', [0, 3], 6, '划分', [0, 3])], 1), ctx(data));
    expect(host.querySelectorAll('.tree-level')).toHaveLength(1);
    expect(host.querySelector('.tree-level')!.getAttribute('data-current')).toBe('true');
    expect(host.querySelector('.tree-node')!.textContent).toContain('49');
    const empty = createViewState(data);
    view.render(empty, ctx(data));
    expect(host.querySelectorAll('.tree-level')).toHaveLength(0);
  });

  it('希尔：按当前增量分组着色并给脚注', () => {
    const data = [49, 38, 65, 97, 76, 13, 27, 49];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, { data, algorithmId: 'shell' });
    const steps = [withVars(markStep('active', [4], 3, '取下标 4'), { gap: 4 })];
    view.render(replay(data, steps, 1), { data, algorithmId: 'shell' });
    const zones = [...host.querySelectorAll('.zone')];
    expect(zones).toHaveLength(8);
    expect(zones.map((z) => z.getAttribute('data-group'))).toEqual(['0', '1', '2', '3', '0', '1', '2', '3']);
    expect(host.querySelector('.tree-footer')!.textContent).toContain('增量 d = 4');
  });

  it('已经跑起来但没有可视结构时，提示不是「尚未开始」', () => {
    const data = [49, 38, 65, 97];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, { data, algorithmId: 'radix' });
    view.render(replay(data, [compareStep(0, 1, 9, '比较')], 1), { data, algorithmId: 'radix' });
    const hint = host.querySelector('.hint')!;
    expect(hint.textContent).toBe(COPY.hintNoStructure);
    expect(hint.textContent).not.toContain('尚未开始');
  });

  it('三种结构都不成立时渲染占位提示，进入划分后消失', () => {
    const data = [49, 38, 65, 97];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, ctx(data));
    view.render(createViewState(data), ctx(data));
    expect(host.querySelector('.hint')!.textContent).toBe(COPY.hintStructure);
    view.render(replay(data, [markStep('range', [0, 3], 6, '划分', [0, 3])], 1), ctx(data));
    expect(host.querySelector('.hint')).toBeNull();
  });

  it('嵌套区间渲染成多层，弹栈后层数减少', () => {
    const data = [49, 38, 65, 97];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, ctx(data));
    const steps = [
      markStep('range', [0, 3], 6, '外层', [0, 3]),
      markStep('range', [0, 1], 6, '内层', [0, 1]),
    ];
    view.render(replay(data, steps, 2), ctx(data));
    expect(host.querySelectorAll('.tree-level')).toHaveLength(2);
    view.render(replay(data, [...steps, unmarkStep('range', [0, 1], 12)], 3), ctx(data));
    expect(host.querySelectorAll('.tree-level')).toHaveLength(1);
  });

  it('heapSize 存在时渲染完全二叉树，父节点索引为 floor((i-1)/2)', () => {
    const data = [97, 76, 65, 38, 49, 13, 27, 49];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, ctx(data));
    view.render(replay(data, [markStep('heap', [0, 7], 5, '堆大小 7', [0, 7])], 1), ctx(data));
    const nodes = [...host.querySelectorAll('.heap-node')];
    expect(nodes).toHaveLength(8);
    expect(nodes[0].textContent).toContain('97');
    expect(nodes[1].getAttribute('data-parent')).toBe('0');
    expect(nodes[7].getAttribute('data-parent')).toBe('3');
  });

  it('堆：按二叉树几何排布，父子之间连线数 = 节点数 - 1', () => {
    const data = [97, 76, 65, 49, 49, 13, 27, 38];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, { data, algorithmId: 'heap' });
    const steps = [markStep('heap', [0, 1, 2, 3, 4, 5, 6, 7], 6, '建堆', [0, 7])];
    view.render(replay(data, steps, 1), { data, algorithmId: 'heap' });
    const nodes = [...host.querySelectorAll('.heap-node')] as HTMLElement[];
    const edges = [...host.querySelectorAll('.heap-edge')];
    expect(nodes).toHaveLength(8);
    expect(edges).toHaveLength(7);
    expect(host.querySelectorAll('.tree-level')).toHaveLength(0);
    expect(host.querySelector('.tree-footer')!.textContent).toContain('8 个节点 / 4 层');
  });

  it('堆：每个节点的中心 x 符合 (slot+0.5)/2^level，且父节点中心 = 两孩子中点', () => {
    const data = [97, 76, 65, 49, 49, 13, 27, 38];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, { data, algorithmId: 'heap' });
    view.render(replay(data, [markStep('heap', [0, 1, 2, 3, 4, 5, 6, 7], 6, '建堆', [0, 7])], 1), { data, algorithmId: 'heap' });
    const nodes = [...host.querySelectorAll('.heap-node')] as HTMLElement[];
    const pctOf = (el: HTMLElement) => Number(el.style.left.replace('%', ''));
    nodes.forEach((node, i) => {
      const level = Math.floor(Math.log2(i + 1));
      const slot = i - (2 ** level - 1);
      expect(pctOf(node), `node ${i}`).toBeCloseTo(((slot + 0.5) / 2 ** level) * 100, 6);
      expect(node.style.top).toBe(`${level * 58}px`);
    });
    // 父(x) = 两个孩子(x) 的中点 —— 树形布局的核心不变量
    for (let i = 0; i + 2 < nodes.length; i++) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (right >= nodes.length) break;
      expect(pctOf(nodes[i]), `parent of ${left}/${right}`).toBeCloseTo((pctOf(nodes[left]) + pctOf(nodes[right])) / 2, 6);
    }
  });

  it('堆：连线从父节点底部连到子节点顶部', () => {
    const data = [97, 76, 65, 49];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, { data, algorithmId: 'heap' });
    view.render(replay(data, [markStep('heap', [0, 1, 2, 3], 6, '建堆', [0, 3])], 1), { data, algorithmId: 'heap' });
    const nodes = [...host.querySelectorAll('.heap-node')] as HTMLElement[];
    const edges = [...host.querySelectorAll('.heap-edge')] as SVGLineElement[];
    expect(edges).toHaveLength(3);
    for (const line of edges) {
      const child = Number(line.dataset.child);
      const parent = Number(line.dataset.parent);
      expect(line.getAttribute('x1')).toBe(nodes[parent].style.left);
      expect(line.getAttribute('x2')).toBe(nodes[child].style.left);
      expect(line.getAttribute('y1')).toBe(`${Number(nodes[parent].style.top.replace('px', '')) + 30}px`);
      expect(line.getAttribute('y2')).toBe(nodes[child].style.top);
    }
  });

  it('堆：节点下方显示数组下标，且跟随 0 基/1 基开关', () => {
    const data = [97, 76, 65, 49];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, { data, algorithmId: 'heap' });
    const steps = [markStep('heap', [0, 1, 2, 3], 6, '建堆', [0, 3])];
    view.render(replay(data, steps, 1), { data, algorithmId: 'heap' });
    expect([...host.querySelectorAll('.heap-idx')].map((n) => n.textContent)).toEqual(['0', '1', '2', '3']);
    view.render(replay(data, steps, 1), { data, algorithmId: 'heap', indexBase: 1 });
    expect([...host.querySelectorAll('.heap-idx')].map((n) => n.textContent)).toEqual(['1', '2', '3', '4']);
    // 下标必须是独立元素，数量与节点一致（节点自身 overflow:hidden 会裁掉 ::after）
    expect(host.querySelectorAll('.heap-idx')).toHaveLength(host.querySelectorAll('.heap-node').length);
  });

  it('堆：换出的元素不再渲染（只剩堆区内的节点与连线）', () => {
    const data = [97, 76, 65, 49, 49, 13, 27, 38];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, { data, algorithmId: 'heap' });
    view.render(replay(data, [markStep('heap', [0, 1, 2, 3], 6, '堆大小 4', [0, 3])], 1), { data, algorithmId: 'heap' });
    expect(host.querySelectorAll('.heap-node')).toHaveLength(4);
    expect(host.querySelectorAll('.heap-edge')).toHaveLength(3);
  });

  it('只有 sorted 标记时渲染有序区/无序区条', () => {
    const data = [13, 27, 65, 97];
    const host = document.createElement('div');
    const view = createStructureView();
    view.mount(host, ctx(data));
    view.render(replay(data, [markStep('sorted', [0, 1], 1, '有序区')], 1), ctx(data));
    const zones = [...host.querySelectorAll('.zone')];
    expect(zones).toHaveLength(4);
    expect(zones[0].getAttribute('data-zone')).toBe('sorted');
    expect(zones[3].getAttribute('data-zone')).toBe('unsorted');
  });
});
