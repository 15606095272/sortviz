import { formatIndex, rewriteIndices } from '../../src/core/index-base';
import { createArrayView } from '../../src/views/array-view';
import { createViewState } from '../../src/core/replay';
import { renderActionNote } from '../../src/ui/panels';
import type { ViewContext } from '../../src/core/registry';

const idxNums = (host: HTMLElement): (string | null)[] =>
  [...host.querySelectorAll('.idxnum')].map((n) => n.textContent);

describe('下标进制', () => {
  it('formatIndex：0 基原样、1 基 +1', () => {
    expect(formatIndex(0, 0)).toBe(0);
    expect(formatIndex(0, 1)).toBe(1);
    expect(formatIndex(7, 1)).toBe(8);
  });

  it('rewriteIndices：只改 a[k]/A[k] 形式，1 基时 +1 且不动其它数字', () => {
    expect(rewriteIndices('a[0] 与 A[7]，共 8 个', 1)).toBe('a[1] 与 A[8]，共 8 个');
    expect(rewriteIndices('a[0] 与 A[7]，共 8 个', 0)).toBe('a[0] 与 A[7]，共 8 个');
  });

  it('数组视图在 1 基下 .idxnum 从 1 开始', () => {
    const host = document.createElement('div');
    const data = [49, 38, 65];
    const view = createArrayView();
    const ctx: ViewContext = { data, algorithmId: 'quick', indexBase: 1 };
    view.mount(host, ctx);
    view.render(createViewState(data), ctx);
    expect(idxNums(host)).toEqual(['1', '2', '3']);
  });

  it('切换进制只需重新 render（不 mount），下标随之变化', () => {
    const host = document.createElement('div');
    const data = [49, 38, 65];
    const view = createArrayView();
    const ctx: ViewContext = { data, algorithmId: 'quick' };
    view.mount(host, ctx);
    view.render(createViewState(data), ctx);
    expect(idxNums(host)).toEqual(['0', '1', '2']);

    // 不重新 mount，只带新的 indexBase 再 render 一次
    view.render(createViewState(data), { ...ctx, indexBase: 1 });
    expect(idxNums(host)).toEqual(['1', '2', '3']);
    // data-index 是 DOM 契约，仍是 0 基
    expect([...host.querySelectorAll('.cell')].map((c) => c.getAttribute('data-index'))).toEqual(['0', '1', '2']);
  });

  it('1 基下动作说明里的下标同步改写', () => {
    const host = document.createElement('div');
    renderActionNote(host, '比较 a[0]=49 与 a[1]=38', 1);
    expect(host.textContent).toContain('a[1]');
    expect(host.textContent).toContain('a[2]');
  });
});
