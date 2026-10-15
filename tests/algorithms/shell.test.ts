import { shell } from '../../src/algorithms/shell';
import { replay, derivePasses, deriveStats } from '../../src/core/replay';
import { GOLDEN, INPUT, SORTED } from '../fixtures/golden';

describe('希尔排序', () => {
  it('排序结果正确', () => {
    const steps = shell.run(INPUT);
    expect(replay(INPUT, steps, steps.length).data).toEqual(SORTED);
  });

  it('每趟结果与教材一致（增量 4 / 2 / 1 各一趟）', () => {
    const steps = shell.run(INPUT);
    expect(derivePasses(steps, steps.length).map((p) => p.data)).toEqual(GOLDEN.shell.passes);
  });

  it('增量序列按 n/2 折半：4 → 2 → 1', () => {
    const notes = shell.run(INPUT).filter((s) => s.kind === 'passEnd').map((s) => s.note ?? '');
    expect(notes).toHaveLength(GOLDEN.shell.gaps.length);
    GOLDEN.shell.gaps.forEach((gap, i) => expect(notes[i]).toContain(`增量 ${gap}`));
  });

  it('跨步长后移元素（移动数 > 0）', () => {
    const steps = shell.run(INPUT);
    expect(deriveStats(steps, steps.length).move).toBeGreaterThan(0);
  });

  it('增量 1 那趟结束后全部就位', () => {
    const steps = shell.run(INPUT);
    const last = replay(INPUT, steps, steps.length);
    expect(last.sorted.size).toBe(INPUT.length);
    expect(last.data).toEqual(SORTED);
  });
});
