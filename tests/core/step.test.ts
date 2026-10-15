import { compareStep, swapStep, assignStep, markStep, unmarkStep, auxWriteStep, passEndStep } from '../../src/core/step';

describe('step 构造函数', () => {
  it('compare 记录两个下标并计 1 次比较', () => {
    const s = compareStep(2, 5, 9, '比较 a[2]=65 与 pivot=49');
    expect(s).toMatchObject({ kind: 'compare', indices: [2, 5], codeLine: 9, stats: { compare: 1 } });
  });

  it('swap 按 408 口径计 1 次交换 + 3 次移动', () => {
    const s = swapStep(1, 3, 11, '交换');
    expect(s.stats).toEqual({ swap: 1, move: 3 });
  });

  it('assign 只计 1 次移动', () => {
    expect(assignStep(4, 76, 10, '写入').stats).toEqual({ move: 1 });
  });

  it('mark 携带标签与区间', () => {
    expect(markStep('range', [0, 7], 7, '进入划分', [0, 7])).toMatchObject({ kind: 'mark', label: 'range', range: [0, 7] });
  });

  it('unmark 只带标签与下标', () => {
    expect(unmarkStep('range', [0, 7], 13)).toEqual({ kind: 'unmark', label: 'range', indices: [0, 7], codeLine: 13 });
  });

  it('auxWrite 写辅助数组且不计入主数组移动', () => {
    const s = auxWriteStep(3, 13, 22, '回填辅助数组');
    expect(s).toMatchObject({ kind: 'auxWrite', indices: [3], value: 13 });
    expect(s.stats).toBeUndefined();
  });

  it('passEnd 复制快照，后续改数组不影响它', () => {
    const arr = [49, 38];
    const s = passEndStep(arr, 13, '第 1 趟结束');
    arr[0] = 999;
    expect(s.snapshot).toEqual([49, 38]);
  });
});
