import { createArrayView } from '../../src/views/array-view';
import { createViewState, replay } from '../../src/core/replay';
import { markStep, compareStep, swapStep, auxWriteStep } from '../../src/core/step';
import { COPY } from '../../src/copy/zh';
import type { ViewContext } from '../../src/core/registry';

const ctx = (data: number[]): ViewContext => ({ data, algorithmId: 'quick' });

// 数组视图现在还会挂出「辅助数组行」（.cellrow.auxrow），里面同样是 .cell；
// 与主数组有关的断言一律用 MAIN_CELL 限定主行，避免把辅助格子也算进去。
const MAIN_ROW = '.cellrow:not(.auxrow)';
const MAIN_CELL = `${MAIN_ROW} .cell`;

describe('数组视图', () => {
  it('挂载后每格一个元素，下标从 0 开始', () => {
    const host = document.createElement('div');
    const view = createArrayView();
    const data = [49, 38, 65];
    view.mount(host, ctx(data));
    view.render(createViewState(data), ctx(data));
    expect(host.querySelectorAll(MAIN_CELL)).toHaveLength(3);
    expect([...host.querySelectorAll('.idxnum')].map((n) => n.textContent)).toEqual(['0', '1', '2']);
    expect([...host.querySelectorAll(MAIN_CELL)].map((n) => n.textContent)).toEqual(['49', '38', '65']);
  });

  it('超过 16 个元素时换行，每行 ≤ 16 格', () => {
    const host = document.createElement('div');
    const data = Array.from({ length: 20 }, (_, i) => i + 1);
    const view = createArrayView();
    view.mount(host, ctx(data));
    view.render(createViewState(data), ctx(data));
    const rows = host.querySelectorAll(MAIN_ROW);
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelectorAll('.cell')).toHaveLength(16);
    expect(rows[1].querySelectorAll('.cell')).toHaveLength(4);
  });

  it('把 ViewState 的标记映射到 data-mark 属性', () => {
    const host = document.createElement('div');
    const data = [49, 38, 65];
    const view = createArrayView();
    view.mount(host, ctx(data));
    const steps = [markStep('pivot', [0], 7, 'pivot'), compareStep(1, 2, 9, '比较')];
    view.render(replay(data, steps, 2), ctx(data));
    const cells = [...host.querySelectorAll(MAIN_CELL)];
    expect(cells[0].getAttribute('data-mark')).toContain('pivot');
    expect(cells[1].getAttribute('data-mark')).toContain('comparing');
    expect(cells[2].getAttribute('data-mark')).toContain('comparing');
  });

  it('交换步骤后格子数值随之变化', () => {
    const host = document.createElement('div');
    const data = [49, 38];
    const view = createArrayView();
    view.mount(host, ctx(data));
    view.render(replay(data, [swapStep(0, 1, 11, '交换')], 1), ctx(data));
    expect([...host.querySelectorAll(MAIN_CELL)].map((n) => n.textContent)).toEqual(['38', '49']);
  });

  it('activeIndices 渲染成指针标签', () => {
    const host = document.createElement('div');
    const data = [49, 38, 65];
    const view = createArrayView();
    view.mount(host, ctx(data));
    view.render(replay(data, [compareStep(0, 1, 9, '比较')], 1), ctx(data));
    expect([...host.querySelectorAll('.ptr')].map((n) => n.textContent).filter(Boolean).sort()).toEqual(['i', 'j']);
  });

  it('没有辅助数组时辅助行隐藏', () => {
    const host = document.createElement('div');
    const data = [49, 38, 65];
    const view = createArrayView();
    view.mount(host, ctx(data));
    view.render(createViewState(data), ctx(data));
    expect((host.querySelector('.auxrow') as HTMLElement).hidden).toBe(true);
  });

  it('有辅助数组时辅助行显示并填入已写的槽位', () => {
    const host = document.createElement('div');
    const data = [49, 38, 65];
    const view = createArrayView();
    view.mount(host, ctx(data));
    const steps = [auxWriteStep(0, 3, 1, '写'), auxWriteStep(1, 1, 1, '写')];
    view.render(replay(data, steps, 2), ctx(data));
    const auxRow = host.querySelector('.auxrow') as HTMLElement;
    expect(auxRow.hidden).toBe(false);
    expect(host.querySelector('.auxlab')!.textContent).toBe(COPY.auxArray);
    const auxCells = [...auxRow.querySelectorAll('.cell')];
    expect(auxCells[0].textContent).toBe('3');
    expect(auxCells[1].textContent).toBe('1');
  });

  it('destroy 清空宿主', () => {
    const host = document.createElement('div');
    const view = createArrayView();
    view.mount(host, ctx([1, 2]));
    view.destroy();
    expect(host.childElementCount).toBe(0);
  });
});
