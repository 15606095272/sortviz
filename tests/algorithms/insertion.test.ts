import { insertion } from '../../src/algorithms/insertion';
import { replay, derivePasses, deriveStats } from '../../src/core/replay';
import { GOLDEN, INPUT, SORTED } from '../fixtures/golden';
import { toItems, simulate, isStable } from '../helpers/simulate';

describe('直接插入排序', () => {
  it('排序结果正确', () => {
    const steps = insertion.run(INPUT);
    expect(replay(INPUT, steps, steps.length).data).toEqual(SORTED);
  });

  it('每趟结果与教材一致', () => {
    const steps = insertion.run(INPUT);
    expect(derivePasses(steps, steps.length).map((p) => p.data)).toEqual(GOLDEN.insertion.passes);
  });

  it('每次插入都给出 passEnd，趟数 = n-1', () => {
    const steps = insertion.run(INPUT);
    expect(derivePasses(steps, steps.length)).toHaveLength(INPUT.length - 1);
  });

  it('逆序输入比较次数 = n(n-1)/2', () => {
    const reversed = [8, 7, 6, 5, 4, 3, 2, 1];
    const steps = insertion.run(reversed);
    expect(deriveStats(steps, steps.length).compare).toBe(GOLDEN.insertion.reversedCompares);
  });

  it('稳定：两个 49 保持原有先后', () => {
    const steps = insertion.run(INPUT);
    const result = simulate(toItems(INPUT), steps);
    expect(isStable(result)).toBe(true);
  });

  it('稳定（可证伪）：遇到相等元素立即停止，不产生移位', () => {
    // [49a, 49b, 38]：49b 插入时比较 1 次即停（a[0] <= key），只有落位 1 次赋值
    // 若实现误用 < 而非 <=，会多出一次移位赋值，本条即失败
    const data = [49, 49, 38];
    const steps = insertion.run(data);
    const firstPassEnd = steps.findIndex((s) => s.kind === 'passEnd');
    expect(steps.slice(0, firstPassEnd).filter((s) => s.kind === 'assign')).toHaveLength(1);
    expect(deriveStats(steps, firstPassEnd)).toEqual({ compare: 1, swap: 0, move: 1 });
    expect(replay(data, steps, steps.length).data).toEqual([38, 49, 49]);
  });
});
