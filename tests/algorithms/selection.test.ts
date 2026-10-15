import { selection } from '../../src/algorithms/selection';
import { replay, derivePasses, deriveStats } from '../../src/core/replay';
import { GOLDEN, INPUT, SORTED } from '../fixtures/golden';

describe('简单选择排序', () => {
  it('排序结果正确', () => {
    const steps = selection.run(INPUT);
    expect(replay(INPUT, steps, steps.length).data).toEqual(SORTED);
  });

  it('每趟结果与教材一致（共 7 趟，每趟确定一个最小元素）', () => {
    const steps = selection.run(INPUT);
    const passes = derivePasses(steps, steps.length).map((p) => p.data);
    expect(passes).toEqual(GOLDEN.selection.passes);
    expect(passes).toHaveLength(7);
  });

  it('比较次数恒为 n(n-1)/2，与输入初态无关', () => {
    const expected = GOLDEN.selection.compares;
    expect(deriveStats(selection.run(INPUT), selection.run(INPUT).length).compare).toBe(expected);
    const reversed = [8, 7, 6, 5, 4, 3, 2, 1];
    expect(deriveStats(selection.run(reversed), selection.run(reversed).length).compare).toBe(expected);
  });

  it('每趟最多交换一次（只换最小元素到位）', () => {
    const steps = selection.run(INPUT);
    const bounds = steps.reduce<number[]>((acc, s, i) => (s.kind === 'passEnd' ? [...acc, i] : acc), []);
    let from = -1;
    let maxSwapsInPass = 0;
    for (const end of bounds) {
      const swaps = steps.slice(from + 1, end + 1).filter((s) => s.kind === 'swap').length;
      maxSwapsInPass = Math.max(maxSwapsInPass, swaps);
      from = end;
    }
    expect(maxSwapsInPass).toBeLessThanOrEqual(1);
  });

  it('不稳定：首个交换会把等值元素的相对次序打乱（[49,49,13] 第 1 趟换的是下标 0 与 2）', () => {
    // 选择排序的不稳定来源：把 a[i] 与最小元素对调时，a[i] 可能等于被换走的元素
    const steps = selection.run([49, 49, 13]);
    const firstSwap = steps.find((s) => s.kind === 'swap');
    expect(firstSwap?.indices).toEqual([0, 2]);
    expect(selection.stable).toBe(false);
  });

  it('结束时末尾元素也被标记为已就位', () => {
    const steps = selection.run(INPUT);
    const last = replay(INPUT, steps, steps.length);
    expect(last.sorted.size).toBe(INPUT.length);
  });
});
