import { merge } from '../../src/algorithms/merge';
import { replay, derivePasses } from '../../src/core/replay';
import { GOLDEN, INPUT, SORTED } from '../fixtures/golden';

describe('2-路归并排序', () => {
  it('排序结果正确', () => {
    const steps = merge.run(INPUT);
    expect(replay(INPUT, steps, steps.length).data).toEqual(SORTED);
  });

  it('每趟结果与教材一致（宽度 1 / 2 / 4 各一趟）', () => {
    const steps = merge.run(INPUT);
    expect(derivePasses(steps, steps.length).map((p) => p.data)).toEqual(GOLDEN.merge.passes);
  });

  it('每趟的宽度按 1 → 2 → 4 翻倍', () => {
    const notes = merge.run(INPUT).filter((s) => s.kind === 'passEnd').map((s) => s.note ?? '');
    expect(notes).toHaveLength(GOLDEN.merge.passes.length);
    ['宽度 1', '宽度 2', '宽度 4'].forEach((text, i) => expect(notes[i]).toContain(text));
  });

  it('稳定：等值时取左段（[49,49] 只比一次且说明里是「取左段」）', () => {
    // 比较写成 `A[i] <= A[j]` 才先取左；改成 `<` 会先取右段 → 说明文案变「取右段」，本用例变红
    const steps = merge.run([49, 49]);
    expect(steps.filter((s) => s.kind === 'compare')).toHaveLength(1);
    expect(steps.some((s) => (s.note ?? '').includes('取左段'))).toBe(true);
  });

  it('归并过程使用辅助数组（中途 aux 非 null，且写了 n 个槽位）', () => {
    const steps = merge.run(INPUT);
    const mid = Math.floor(steps.length / 2);
    const state = replay(INPUT, steps, mid);
    expect(state.aux).not.toBeNull();
    const written = steps.filter((s) => s.kind === 'auxWrite').length;
    expect(written).toBeGreaterThanOrEqual(INPUT.length);
  });

  it('结束时递归栈为空（range 进出成对）', () => {
    const steps = merge.run(INPUT);
    expect(replay(INPUT, steps, steps.length).callStack).toEqual([]);
  });
});
