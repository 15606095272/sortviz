import { createStructureView } from '../../src/views/structure-view';
import { createViewState, replay } from '../../src/core/replay';
import { markStep, unmarkStep } from '../../src/core/step';
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
    // 8 个节点应分成 4 层（1 / 2 / 4 / 1）——防止又塌成一竖列
    const rows = [...host.querySelectorAll('.tree-level')];
    expect(rows.map((r) => r.querySelectorAll('.heap-node').length)).toEqual([1, 2, 4, 1]);
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
