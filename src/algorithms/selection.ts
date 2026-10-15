import { compareStep, markStep, noteStep, passEndStep, swapStep, unmarkStep, type Step } from '../core/step';

const PSEUDO = [
  { line: 1, indent: 0, text: 'for i = 0 to n-2:' },
  { line: 2, indent: 1, text: '  minIndex = i' },
  { line: 3, indent: 1, text: '  for j = i+1 to n-1:' },
  { line: 4, indent: 2, text: '    if A[j] < A[minIndex]: minIndex = j' },
  { line: 5, indent: 1, text: '  if minIndex != i: swap(A[i], A[minIndex])' },
];

export const selection = {
  id: 'selection',
  name: { zh: '简单选择排序', en: 'Selection Sort' },
  category: 'select' as const,
  stable: false,
  complexity: { best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: PSEUDO,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[]): Step[] {
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];

    for (let i = 0; i < n - 1; i++) {
      let minIndex = i;
      // 'pivot' 标记在这里表示「当前最小候选」——数组视图会把它画成紫色基准格
      steps.push(markStep('pivot', [minIndex], 2, `第 ${i + 1} 趟：先假定 a[${i}]=${a[i]} 是剩余部分的最小值`));
      for (let j = i + 1; j < n; j++) {
        steps.push(compareStep(j, minIndex, 4, `比较 a[${j}]=${a[j]} 与当前最小 a[${minIndex}]=${a[minIndex]}`));
        if (a[j] < a[minIndex]) {
          steps.push(unmarkStep('pivot', [minIndex], 4, `a[${j}]=${a[j]} 更小 → 更新最小下标`));
          minIndex = j;
          steps.push(markStep('pivot', [minIndex], 4, `当前最小下标 = ${minIndex}（值 ${a[minIndex]}）`));
        }
      }
      steps.push(unmarkStep('pivot', [minIndex], 5, `本趟最小下标确定为 ${minIndex}`));
      if (minIndex !== i) {
        [a[i], a[minIndex]] = [a[minIndex], a[i]];
        steps.push(swapStep(i, minIndex, 5, `交换 a[${i}] 与 a[${minIndex}] → a[${i}]=${a[i]} 就位`));
      } else {
        steps.push(noteStep(`a[${i}]=${a[i]} 本来就是最小值 → 本趟不交换`, 5));
      }
      steps.push(markStep('sorted', [i], 1, `第 ${i + 1} 趟结束：a[${i}] 就位`));
      steps.push(passEndStep(a, 5, `第 ${i + 1} 趟结束`));
    }
    steps.push(markStep('sorted', [n - 1], 1, `最后一个元素自然就位`));
    return steps;
  },
};
