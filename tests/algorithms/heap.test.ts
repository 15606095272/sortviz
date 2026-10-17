import { heap } from '../../src/algorithms/heap';
import { replay } from '../../src/core/replay';
import type { Step } from '../../src/core/step';
import { GOLDEN, INPUT, SORTED } from '../fixtures/golden';

const passEndIndices = (steps: Step[]): number[] =>
  steps.reduce<number[]>((acc, s, i) => (s.kind === 'passEnd' ? [...acc, i] : acc), []);

describe('堆排序', () => {
  it('排序结果正确', () => {
    const steps = heap.run(INPUT);
    expect(replay(INPUT, steps, steps.length).data).toEqual(SORTED);
  });

  it('建初堆结果与教材一致', () => {
    const steps = heap.run(INPUT);
    const builtAt = steps.findIndex((s) => s.kind === 'note' && s.note === '建初堆完成');
    expect(builtAt).toBeGreaterThan(-1);
    expect(replay(INPUT, steps, builtAt + 1).data).toEqual(GOLDEN.heap.builtHeap);
  });

  it('第 1 趟（换出堆顶 + 下沉修复）后与教材一致', () => {
    const steps = heap.run(INPUT);
    const ends = passEndIndices(steps);
    expect(ends).toHaveLength(INPUT.length - 1);
    expect(replay(INPUT, steps, ends[0] + 1).data).toEqual(GOLDEN.heap.afterFirstExtract);
  });

  it('不变量：第 k 趟结束后末尾 k 个元素是当前最大的 k 个，且它们已升序', () => {
    const steps = heap.run(INPUT);
    passEndIndices(steps).forEach((end, k) => {
      const data = replay(INPUT, steps, end + 1).data;
      const cut = data.length - 1 - k;
      const tail = data.slice(cut);
      expect(tail).toEqual([...tail].sort((x, y) => x - y));
      if (cut > 0) expect(Math.max(...data.slice(0, cut))).toBeLessThanOrEqual(tail[0]);
    });
  });

  it('堆大小随每趟递减（结构视图的完全二叉树同步收缩）', () => {
    const steps = heap.run(INPUT);
    const sizes = passEndIndices(steps).map((end) => replay(INPUT, steps, end + 1).heapSize);
    // 仓库口径：applyStep 里 heapSize = range[1] = 堆的「末尾下标」（见 replay.ts:62 与 structure-view.ts:55
    // 的 `i <= size`），因此第 1 趟后堆占 0..6 → 6；不是元素个数 7。
    expect(sizes).toEqual([6, 5, 4, 3, 2, 1, 0]);
  });

  it('结束时堆为 null、结果有序、全部标记就位', () => {
    const steps = heap.run(INPUT);
    const last = replay(INPUT, steps, steps.length);
    expect(last.heapSize).toBeNull();
    expect(last.data).toEqual(SORTED);
    expect(last.sorted.size).toBe(INPUT.length);
  });

  it('建初堆下标起点的口径：0 基下最后一个非叶结点是 n/2-1，任意 n 都得到合法大顶堆', () => {
    // 教材（王道/严蔚敏）是 1 基写法 `for (i = len/2; i >= 1; i--)`：结点 i 的孩子是 2i、2i+1，
    // 孩子存在 ⟺ 2i <= n ⟺ i <= n/2 → 最后一个非叶是 floor(n/2)。
    // 真实语言是 0 基：孩子是 2i+1、2i+2，孩子存在 ⟺ 2i+1 <= n-1 ⟺ i <= (n-2)/2
    // → 最后一个非叶是 floor(n/2)-1。1 基的 n/2 搬到 0 基就是"从叶子起跑"，只会空转一轮。
    const isLeaf = (i: number, n: number) => 2 * i + 1 >= n;
    for (const n of [1, 2, 3, 4, 7, 8, 9, 13]) {
      const data = Array.from({ length: n }, (_, i) => ((i * 37 + 11) % 97) + 1);
      const steps = heap.run(data, { order: 'asc' });
      const at = steps.findIndex((s) => s.kind === 'note' && String(s.note).includes('建初堆'));
      const built = replay(data, steps, at + 1).data;
      // 大顶堆性质：每个结点都不小于其孩子
      const heapOk = built.every((v, i) => {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        return (l >= n || v >= built[l]) && (r >= n || v >= built[r]);
      });
      expect(heapOk, `n=${n} 建初堆后不满足大顶堆：${built.join(',')}`).toBe(true);
      if (n >= 2) {
        expect(isLeaf(Math.floor(n / 2) - 1, n), `n=${n}：n/2-1 必须是有孩子的结点`).toBe(false);
        expect(isLeaf(Math.floor(n / 2), n), `n=${n}：n/2 在 0 基下是叶子，从它起只会空转`).toBe(true);
      }
    }
    // n=1：n/2-1 = -1，循环一次不进，单个元素天然是堆
    expect(replay([42], heap.run([42], { order: 'asc' }), 1).data).toEqual([42]);
  });
});
