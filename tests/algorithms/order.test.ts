import { registerBuiltinAlgorithms } from '../../src/algorithms';
import { listAlgorithms } from '../../src/core/registry';
import { replay } from '../../src/core/replay';
import { sortedBy } from '../../src/core/order';
import { GOLDEN, INPUT, SORTED } from '../fixtures/golden';

// 折半查找有可选 target，用位置参数时用默认：这里统一多传一个 options 对象
type RunFn = (input: number[], options?: { order?: 'asc' | 'desc'; target?: number }) => any;

describe('排序方向（跨模块不变式）', () => {
  registerBuiltinAlgorithms();

  it('每个模块在降序下的最终结果 = 降序目标（9 个排序）', () => {
    for (const mod of listAlgorithms()) {
      if (mod.id === 'binary-search') continue;
      const steps = (mod.run as RunFn)(INPUT, { order: 'desc' });
      expect(replay(INPUT, steps, steps.length).data, mod.id).toEqual(sortedBy(INPUT, 'desc'));
    }
  });

  it('每个模块在升序下的结果不变（回归保护）', () => {
    for (const mod of listAlgorithms()) {
      if (mod.id === 'binary-search') continue;
      const steps = (mod.run as RunFn)(INPUT, { order: 'asc' });
      expect(replay(INPUT, steps, steps.length).data, mod.id).toEqual(SORTED);
    }
  });

  it('降序结果与升序结果互为逆序（同一输入）', () => {
    for (const mod of listAlgorithms()) {
      if (mod.id === 'binary-search') continue;
      const asc = replay(INPUT, (mod.run as RunFn)(INPUT, { order: 'asc' }), Number.MAX_SAFE_INTEGER).data;
      const desc = replay(INPUT, (mod.run as RunFn)(INPUT, { order: 'desc' }), Number.MAX_SAFE_INTEGER).data;
      expect(desc, mod.id).toEqual([...asc].reverse());
    }
  });

  it('堆排序：升序建大顶堆、降序建小顶堆（新堆顶是极值）', () => {
    const buildHeap = (order: 'asc' | 'desc') => {
      const steps = (listAlgorithms().find((m) => m.id === 'heap')!.run as RunFn)(INPUT, { order });
      const at = steps.findIndex((s: any) => s.kind === 'note' && s.note === '建初堆完成');
      return replay(INPUT, steps, at + 1).data;
    };
    const maxHeap = buildHeap('asc');
    const minHeap = buildHeap('desc');
    expect(maxHeap[0]).toBe(Math.max(...INPUT));
    expect(minHeap[0]).toBe(Math.min(...INPUT));
    // 两个堆都满足堆序（父 ≥ 子 / 父 ≤ 子）
    const ok = (a: number[], cmp: (x: number, y: number) => boolean) =>
      a.every((_v, i) => (2 * i + 1 >= a.length || cmp(a[i], a[2 * i + 1])) && (2 * i + 2 >= a.length || cmp(a[i], a[2 * i + 2])));
    expect(ok(maxHeap, (x, y) => x >= y)).toBe(true);
    expect(ok(minHeap, (x, y) => x <= y)).toBe(true);
  });

  it('简单选择排序：升序每趟选最小、降序每趟选最大', () => {
    const sel = listAlgorithms().find((m) => m.id === 'selection')!;
    for (const [order, pick] of [['asc', Math.min], ['desc', Math.max]] as const) {
      const steps: any[] = (sel.run as RunFn)(INPUT, { order });
      const ends = steps.reduce<number[]>((acc: number[], s: any, i: number) => (s.kind === 'passEnd' ? [...acc, i] : acc), []);
      const firstPassEnd = ends[0];
      const data = replay(INPUT, steps, firstPassEnd + 1).data;
      // 第 1 趟结束，首个元素必须是本趟选出的极值
      expect(data[0], `${order}`).toBe(pick(...INPUT));
    }
  });

  it('折半查找：在降序表上也能命中（目标按当前方向查找）', () => {
    const bs = listAlgorithms().find((m) => m.id === 'binary-search')!;
    const descData = sortedBy(INPUT, 'desc');
    const steps = (bs.run as RunFn)(descData, { order: 'desc', target: descData[3] });
    const notes = steps.filter((s: any) => s.kind === 'note').map((s: any) => String(s.note));
    expect(notes[notes.length - 1]).toContain('找到');
    expect(notes[notes.length - 1]).toContain('下标 = 3');
  });
});
