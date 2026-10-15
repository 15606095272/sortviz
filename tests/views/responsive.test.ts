import { cellsPerRow, createArrayView, MAX_PER_ROW, MIN_PER_ROW } from '../../src/views/array-view';
import { createViewState, replay } from '../../src/core/replay';
import { markStep, unmarkStep } from '../../src/core/step';
import type { ViewContext } from '../../src/core/registry';

const ctx = (data: number[]): ViewContext => ({ data, algorithmId: 'quick' });

describe('窄屏与换行', () => {
  it('cellsPerRow：宽容器吃满 16 格，窄容器降到下限', () => {
    expect(cellsPerRow(1200)).toBe(MAX_PER_ROW);
    expect(cellsPerRow(300)).toBe(MIN_PER_ROW);
    expect(cellsPerRow(0)).toBe(MIN_PER_ROW);
  });

  it('cellsPerRow 单调不减，且永不越界', () => {
    const widths = [0, 100, 300, 500, 700, 900, 1200, 2000];
    const rows = widths.map((w) => cellsPerRow(w));
    for (let i = 1; i < rows.length; i++) expect(rows[i]).toBeGreaterThanOrEqual(rows[i - 1]);
    for (const r of rows) {
      expect(r).toBeGreaterThanOrEqual(MIN_PER_ROW);
      expect(r).toBeLessThanOrEqual(MAX_PER_ROW);
    }
  });

  it('窄容器下换行但总格数不变', () => {
    const data = Array.from({ length: 12 }, (_, i) => i + 1);
    const host = document.createElement('div');
    Object.defineProperty(host, 'clientWidth', { value: 300, configurable: true });
    const view = createArrayView();
    view.mount(host, ctx(data));
    view.render(createViewState(data), ctx(data));
    expect(host.querySelectorAll('.cell')).toHaveLength(12);
    expect(host.querySelectorAll('.cellrow:not(.auxrow)').length).toBeGreaterThan(1);
  });

  it('宽容器回到 16 格一行（jsdom 无 clientWidth 时也用兜底值）', () => {
    const data = Array.from({ length: 4 }, (_, i) => i + 1);
    const host = document.createElement('div');
    const view = createArrayView();
    view.mount(host, ctx(data));
    view.render(createViewState(data), ctx(data));
    expect(host.querySelectorAll('.cellrow:not(.auxrow)')).toHaveLength(1);
    expect(host.querySelectorAll('.cell')).toHaveLength(4);
  });

  it('递归区间之外的格子被淡化，区间内不动', () => {
    const data = [49, 38, 65, 97, 76];
    const host = document.createElement('div');
    const view = createArrayView();
    view.mount(host, ctx(data));
    const steps = [markStep('range', [1, 3], 3, '当前区间', [1, 3])];
    view.render(replay(data, steps, 1), ctx(data));
    const faded = [...host.querySelectorAll('.cell')].map((c) => (c as HTMLElement).dataset.faded);
    expect(faded).toEqual(['1', '0', '0', '0', '1']);
  });
});
