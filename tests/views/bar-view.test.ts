import { createBarView } from '../../src/views/bar-view';
import { createViewState, replay } from '../../src/core/replay';
import { compareStep, markStep, swapStep } from '../../src/core/step';
import type { ViewContext } from '../../src/core/registry';

const ctx = (data: number[]): ViewContext => ({ data, algorithmId: 'quick' });
const heightOf = (host: HTMLElement, i: number): number =>
  Number(((host.querySelectorAll('.barcol')[i] as HTMLElement).style.height || '0').replace('%', ''));

describe('柱状图视图', () => {
  it('柱数量 = 数据长度，且每柱带 data-index', () => {
    const host = document.createElement('div');
    const data = [80, 40, 20];
    const view = createBarView();
    view.mount(host, ctx(data));
    view.render(createViewState(data), ctx(data));
    expect(host.querySelectorAll('.barcol')).toHaveLength(3);
    expect([...host.querySelectorAll('.barbox')].map((b) => (b as HTMLElement).dataset.index)).toEqual(['0', '1', '2']);
  });

  it('柱高按 |值| / 当前最大值 成比例', () => {
    const host = document.createElement('div');
    const data = [80, 40, 20];
    const view = createBarView();
    view.mount(host, ctx(data));
    view.render(createViewState(data), ctx(data));
    expect(heightOf(host, 0)).toBeCloseTo(100, 0);
    expect(heightOf(host, 1)).toBeCloseTo(50, 0);
    expect(heightOf(host, 2)).toBeCloseTo(25, 0);
  });

  it('值为 0 或负数时不塌成 0，且负数标 data-sign="neg"', () => {
    const host = document.createElement('div');
    const data = [50, 0, -50];
    const view = createBarView();
    view.mount(host, ctx(data));
    view.render(createViewState(data), ctx(data));
    expect(heightOf(host, 1)).toBeGreaterThanOrEqual(6);
    expect(heightOf(host, 2)).toBeGreaterThanOrEqual(6);
    const cols = [...host.querySelectorAll('.barcol')] as HTMLElement[];
    expect(cols[2].dataset.sign).toBe('neg');
    expect(cols[0].dataset.sign).toBe('pos');
  });

  it('标记映射与数组视图一致（comparing / pivot / sorted / heap）', () => {
    const host = document.createElement('div');
    const data = [49, 38, 65, 97];
    const view = createBarView();
    view.mount(host, ctx(data));
    const steps = [
      markStep('pivot', [0], 7, 'pivot'),
      markStep('sorted', [3], 12, '就位'),
      compareStep(1, 2, 9, '比较'),
    ];
    view.render(replay(data, steps, 3), ctx(data));
    const cols = [...host.querySelectorAll('.barcol')] as HTMLElement[];
    expect(cols[0].dataset.mark).toContain('pivot');
    expect(cols[3].dataset.mark).toContain('sorted');
    expect(cols[1].dataset.mark).toContain('comparing');
    expect(cols[2].dataset.mark).toContain('comparing');
  });

  it('destroy 清空宿主并摘掉类名', () => {
    const host = document.createElement('div');
    const view = createBarView();
    view.mount(host, ctx([1, 2]));
    view.destroy();
    expect(host.childElementCount).toBe(0);
    expect(host.classList.contains('bar-view')).toBe(false);
  });
});
