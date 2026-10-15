import { radix } from '../../src/algorithms/radix';
import { replay, derivePasses, deriveStats } from '../../src/core/replay';
import { GOLDEN, INPUT, SORTED } from '../fixtures/golden';

describe('基数排序', () => {
  it('排序结果正确', () => {
    const steps = radix.run(INPUT);
    expect(replay(INPUT, steps, steps.length).data).toEqual(SORTED);
  });

  it('每趟结果与教材一致（个位、十位两趟）', () => {
    const steps = radix.run(INPUT);
    expect(derivePasses(steps, steps.length).map((p) => p.data)).toEqual(GOLDEN.radix.passes);
  });

  it('趟数 = 最大元素的十进制位数，且每趟说明里点名是哪一位', () => {
    const notes = radix.run(INPUT).filter((s) => s.kind === 'passEnd').map((s) => s.note ?? '');
    expect(notes).toHaveLength(GOLDEN.radix.passes.length);
    expect(notes[0]).toContain('个位');
    expect(notes[1]).toContain('十位');
  });

  it('基数是 10（桶 0..9 按序收集）', () => {
    expect(GOLDEN.radix.base).toBe(10);
    const steps = radix.run(INPUT);
    expect(replay(INPUT, steps, steps.length).data).toEqual(SORTED);
  });

  it('稳定：个位相同的 97 与 27 保持原有先后（97 在 27 之前）', () => {
    // 桶内必须 FIFO 收集；若写成「从桶里弹出最后一个」就变成不稳定，97/27 会换位 → 本用例变红
    const firstPass = GOLDEN.radix.passes[0];
    expect(firstPass.indexOf(97)).toBeLessThan(firstPass.indexOf(27));
    const steps = radix.run(INPUT);
    const firstPassEnd = steps.findIndex((s) => s.kind === 'passEnd');
    expect(replay(INPUT, steps, firstPassEnd + 1).data).toEqual(firstPass);
  });

  it('用桶 + 辅助数组：中途 aux 非 null，回填移动数 = 每趟 n 个', () => {
    const steps = radix.run(INPUT);
    const mid = Math.floor(steps.length / 2);
    expect(replay(INPUT, steps, mid).aux).not.toBeNull();
    const totalMoves = deriveStats(steps, steps.length).move;
    expect(totalMoves).toBe(INPUT.length * GOLDEN.radix.passes.length);
  });
});
