import { bubble } from '../../src/algorithms/bubble';
import { replay, derivePasses, deriveStats } from '../../src/core/replay';
import { GOLDEN, INPUT, SORTED } from '../fixtures/golden';

describe('冒泡排序', () => {
  it('排序结果正确', () => {
    const steps = bubble.run(INPUT);
    expect(replay(INPUT, steps, steps.length).data).toEqual(SORTED);
  });

  it('每趟结果与教材一致（含零交换的最后一趟）', () => {
    const steps = bubble.run(INPUT);
    expect(derivePasses(steps, steps.length).map((p) => p.data)).toEqual(GOLDEN.bubble.passes);
  });

  it('本例比较次数 = 逐趟递减之和（27）', () => {
    // 第 i 趟比较 n-1-i 次：7+6+5+4+3+2 = 27（第 6 趟零交换 → 结束）
    const steps = bubble.run(INPUT);
    expect(deriveStats(steps, steps.length).compare).toBe(GOLDEN.bubble.inputCompares);
  });

  it('逆序输入无提前终止：比较 n(n-1)/2，趟数 n-1', () => {
    const reversed = [8, 7, 6, 5, 4, 3, 2, 1];
    const steps = bubble.run(reversed);
    expect(deriveStats(steps, steps.length).compare).toBe(GOLDEN.bubble.reversedCompares);
    expect(derivePasses(steps, steps.length)).toHaveLength(GOLDEN.bubble.reversedPasses);
  });

  it('稳定：两个 49 保持原有先后', () => {
    const steps = bubble.run(INPUT);
    expect(replay(INPUT, steps, steps.length).data).toEqual(SORTED);
    expect(derivePasses(steps, steps.length).at(-1)!.data).toEqual(SORTED);
  });
});
