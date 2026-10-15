import { quick } from '../../src/algorithms/quick';
import { replay, derivePasses, deriveStats } from '../../src/core/replay';
import { GOLDEN, INPUT, SORTED } from '../fixtures/golden';

describe('快速排序（王道前后指针版 partition）', () => {
  it('排序结果正确', () => {
    const steps = quick.run(INPUT);
    expect(replay(INPUT, steps, steps.length).data).toEqual(SORTED);
  });

  it('第 1 趟划分：pivot 落到下标 3，序列与教材一致', () => {
    const steps = quick.run(INPUT);
    const firstPass = derivePasses(steps, steps.length)[0].data;
    expect(firstPass).toEqual(GOLDEN.quick.firstPass);
    expect(firstPass[GOLDEN.quick.firstPartitionPivotIndex]).toBe(49);
  });

  it('第 1 趟的计数与教材口径一致（比较 7 · 交换 3 · 移动 9）', () => {
    const steps = quick.run(INPUT);
    const upto = steps.findIndex((s) => s.kind === 'passEnd') + 1;
    expect(deriveStats(steps, upto)).toEqual(GOLDEN.quick.firstPassStats);
  });

  it('每趟划分后，左侧都 ≤ pivot、右侧都 ≥ pivot', () => {
    const steps = quick.run(INPUT);
    for (const p of derivePasses(steps, steps.length)) {
      const idx = p.data.indexOf(49);
      const left = p.data.slice(0, idx);
      const right = p.data.slice(idx + 1);
      expect(left.every((v) => v <= 49)).toBe(true);
      expect(right.every((v) => v >= 49)).toBe(true);
    }
  });

  it('子区间进出成对：结束时递归栈为空', () => {
    const steps = quick.run(INPUT);
    expect(replay(INPUT, steps, steps.length).callStack).toEqual([]);
  });

  it('已排序输入不退化（仍能正确排序）', () => {
    const sorted = [...SORTED];
    const steps = quick.run(sorted);
    expect(replay(sorted, steps, steps.length).data).toEqual(SORTED);
  });
});
