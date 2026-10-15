import { binaryInsertion } from '../../src/algorithms/binary-insertion';
import { insertion } from '../../src/algorithms/insertion';
import { replay, derivePasses, deriveStats } from '../../src/core/replay';
import { GOLDEN, INPUT, SORTED } from '../fixtures/golden';

describe('折半插入排序', () => {
  it('排序结果正确', () => {
    const steps = binaryInsertion.run(INPUT);
    expect(replay(INPUT, steps, steps.length).data).toEqual(SORTED);
  });

  it('每趟结果与直接插入完全一致（只换查找方式，不改插入位置）', () => {
    const steps = binaryInsertion.run(INPUT);
    expect(derivePasses(steps, steps.length).map((p) => p.data)).toEqual(GOLDEN.insertion.passes);
  });

  it('比较次数不多于直接插入（折半查找的意义所在）', () => {
    const bi = binaryInsertion.run(INPUT);
    const ins = insertion.run(INPUT);
    expect(deriveStats(bi, bi.length).compare).toBeLessThanOrEqual(deriveStats(ins, ins.length).compare);
  });

  it('稳定：等值时插到右侧（[49,49,38] 第 1 趟只落位、不后移）', () => {
    // 折半比较必须写成 `A[mid] <= key` 才往右找；改成 `<` 会多一次「后移 + 落位」，移动数变 2 → 本用例变红
    const steps = binaryInsertion.run([49, 49, 38]);
    const firstPassEnd = steps.findIndex((s) => s.kind === 'passEnd');
    expect(deriveStats(steps, firstPassEnd + 1).move).toBe(1);
  });

  it('伪代码覆盖折半定位与落位两处关键行', () => {
    const hash = new Set(binaryInsertion.pseudocode.map((l) => l.line));
    expect(hash.has(5)).toBe(true);
    expect(hash.has(9)).toBe(true);
  });
});
