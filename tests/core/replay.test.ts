import { replay, createViewState, applyStep, deriveStats, derivePasses } from '../../src/core/replay';
import { compareStep, swapStep, assignStep, markStep, unmarkStep, auxWriteStep, passEndStep, withVars } from '../../src/core/step';

const DATA = [49, 38, 65];
const VARS_STEPS = [
  withVars(compareStep(0, 1, 1, 'a'), { i: 0, j: 1 }),
  withVars(compareStep(1, 2, 1, 'b'), { i: 1 }),
  compareStep(0, 2, 1, 'c'),
];
const STEPS = [
  markStep('range', [0, 2], 7, '进入划分', [0, 2]),
  compareStep(0, 1, 9, '比较 49 与 38'),
  swapStep(0, 1, 11, '交换'),
  auxWriteStep(0, 49, 20, '回填辅助数组'),
  passEndStep([38, 49, 65], 13, '第 1 趟结束'),
  markStep('heap', [0, 1], 5, '堆大小变为 2', [0, 1]),
  unmarkStep('range', [0, 2], 13),
];

describe('applyStep / replay', () => {
  it('初始状态是数据副本，无任何标记', () => {
    const s = createViewState(DATA);
    expect(s.data).toEqual(DATA);
    expect(s.marks.size).toBe(0);
    expect(s.callStack).toEqual([]);
    expect(s.heapSize).toBeNull();
  });

  it('swap 交换数据，且不改动入参状态', () => {
    const s0 = createViewState(DATA);
    const s1 = applyStep(s0, swapStep(0, 1, 11, '交换'));
    expect(s1.data).toEqual([38, 49, 65]);
    expect(s0.data).toEqual(DATA);
  });

  it('assign 写入值', () => {
    expect(applyStep(createViewState(DATA), assignStep(2, 7, 10, '写入')).data).toEqual([49, 38, 7]);
  });

  it('mark range 压栈，unmark range 出栈', () => {
    const s = replay(DATA, STEPS, 1);
    expect(s.callStack).toEqual([[0, 2]]);
    const after = replay(DATA, STEPS, STEPS.length);
    expect(after.callStack).toEqual([]);
  });

  it('mark heap 设置堆大小，unmark 后清空', () => {
    const s = replay(DATA, STEPS, 6);
    expect(s.heapSize).toBe(1);
    expect(replay(DATA, STEPS, 5).heapSize).toBeNull();
  });

  it('比较步骤把两个下标放进 activeIndices，下一步清空', () => {
    expect(replay(DATA, STEPS, 2).activeIndices).toEqual([0, 1]);
    expect(replay(DATA, STEPS, 3).activeIndices).toEqual([]);
  });

  it('auxWrite 建辅助数组，主数组不受影响', () => {
    const s = replay(DATA, STEPS, 4);
    expect(s.aux).toEqual([49, null, null]);
    expect(s.data).toEqual([38, 49, 65]);
  });

  it('lastNote / lastCodeLine 记录最近一次带值的那一步', () => {
    const s = replay(DATA, STEPS, 3);
    expect(s.lastNote).toBe('交换');
    expect(s.lastCodeLine).toBe(11);
    expect(replay(DATA, STEPS, 0).lastNote).toBe('');
  });

  it('replay 到任意前缀 = 逐步 applyStep 的结果', () => {
    let acc = createViewState(DATA);
    for (let k = 1; k <= STEPS.length; k++) {
      acc = applyStep(acc, STEPS[k - 1]);
      expect(replay(DATA, STEPS, k).data).toEqual(acc.data);
    }
  });
});

describe('deriveStats / derivePasses', () => {
  it('统计比较/交换/移动（交换=1 次交换 + 3 次移动）', () => {
    expect(deriveStats(STEPS, 3)).toEqual({ compare: 1, swap: 1, move: 3 });
  });

  it('每趟结果来自 passEnd 快照，趟次从 1 递增', () => {
    const passes = derivePasses(STEPS, STEPS.length);
    expect(passes).toEqual([{ pass: 1, data: [38, 49, 65] }]);
  });
});

describe('ViewState.vars 变量值通道', () => {
  it('vars 会累积进 ViewState，且后来的同名键覆盖先前的', () => {
    expect(replay(DATA, VARS_STEPS, 2).vars).toEqual({ i: 1, j: 1 });
    expect(replay(DATA, VARS_STEPS, 3).vars).toEqual({ i: 1, j: 1 });
  });

  it('没有 vars 的步骤流：ViewState.vars 是空对象（不是 null）', () => {
    expect(createViewState([1, 2]).vars).toEqual({});
    expect(createViewState([1, 2]).vars).not.toBeNull();
    expect(replay([1, 2], [compareStep(0, 1, 1, 'x')], 1).vars).toEqual({});
  });

  it('重放任意前缀都不会被后续步骤的 vars 污染', () => {
    expect(replay(DATA, VARS_STEPS, 1).vars).toEqual({ i: 0, j: 1 });
  });
});
