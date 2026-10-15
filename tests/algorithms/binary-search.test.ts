import { binarySearch } from '../../src/algorithms/binary-search';
import { replay, deriveStats } from '../../src/core/replay';
import type { Step } from '../../src/core/step';

const SORTED8 = [13, 27, 38, 49, 49, 65, 76, 97];
const lastNote = (steps: Step[]): string => {
  const notes = steps.filter((s) => s.kind === 'note' && s.note);
  return notes.length > 0 ? String(notes[notes.length - 1].note) : '';
};

describe('折半查找', () => {
  it('命中：34 号元素存在时给出正确下标（0 基）', () => {
    const steps = binarySearch.run(SORTED8, 65);
    expect(lastNote(steps)).toContain('找到');
    expect(lastNote(steps)).toContain('下标 = 5');
    // 命中后不应再有「查找失败」
    expect(steps.some((s) => String(s.note ?? '').includes('查找失败'))).toBe(false);
  });

  it('未命中：目标不存在时不抛错且说明查找失败', () => {
    const steps = binarySearch.run(SORTED8, 50);
    expect(lastNote(steps)).toContain('查找失败');
    expect(steps.some((s) => String(s.note ?? '').includes('找到'))).toBe(false);
  });

  it('比较次数 ≤ ⌈log2(n+1)⌉（折半查找的核心性质）', () => {
    for (const wanted of [13, 27, 38, 49, 65, 76, 97, 50, 1, 999]) {
      const steps = binarySearch.run(SORTED8, wanted);
      const compares = deriveStats(steps, steps.length).compare;
      expect(compares, `target=${wanted}`).toBeLessThanOrEqual(Math.ceil(Math.log2(SORTED8.length + 1)));
    }
  });

  it('在界面显示的那份数据上查找：区间标记的下标不超过数据长度（不许悄悄排序副本）', () => {
    const unsorted = [49, 38, 65, 97, 76, 13, 27, 49];
    const steps = binarySearch.run(unsorted, 38);
    const marked = steps.flatMap((s) => s.indices ?? []);
    expect(Math.max(...marked)).toBeLessThan(unsorted.length);
    expect(steps.some((s) => String(s.note ?? '').includes('要求有序表'))).toBe(true);
  });

  it('伪代码行号都落在 1..8，且查找不做交换/移动', () => {
    const steps = binarySearch.run(SORTED8, 27);
    for (const s of steps) {
      if (s.codeLine !== undefined) expect(s.codeLine).toBeGreaterThanOrEqual(1);
      if (s.codeLine !== undefined) expect(s.codeLine).toBeLessThanOrEqual(8);
    }
    const stats = deriveStats(steps, steps.length);
    expect(stats.swap).toBe(0);
    expect(stats.move).toBe(0);
  });

  it('步骤带出 mid/low/high 变量值（面板可用）', () => {
    const steps = binarySearch.run(SORTED8, 97);
    const mid = Math.floor(steps.length / 2);
    const state = replay(SORTED8, steps, mid);
    expect(Object.keys(state.vars)).toEqual(expect.arrayContaining(['low', 'high']));
  });
});
