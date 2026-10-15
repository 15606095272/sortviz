import { compareStep, markStep, noteStep, passEndStep, swapStep, withVars, type Step } from '../core/step';

const PSEUDO = [
  { line: 1, indent: 0, text: 'for i = 0 to n-2:' },
  { line: 2, indent: 1, text: '  swapped = false' },
  { line: 3, indent: 1, text: '  for j = 0 to n-2-i:' },
  { line: 4, indent: 2, text: '    if A[j] > A[j+1]:' },
  { line: 5, indent: 3, text: '      swap(A[j], A[j+1]);  swapped = true' },
  { line: 6, indent: 1, text: '  if not swapped: break' },
];

export const bubble = {
  id: 'bubble',
  name: { zh: '冒泡排序', en: 'Bubble Sort' },
  category: 'swap' as const,
  stable: true,
  complexity: { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: PSEUDO,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[]): Step[] {
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];

    for (let i = 0; i < n - 1; i++) {
      const end = n - 1 - i;
      let swapped = false;
      for (let j = 0; j < end; j++) {
        steps.push(withVars(compareStep(j, j + 1, 4, `比较 a[${j}]=${a[j]} 与 a[${j + 1}]=${a[j + 1]}`), { i, j }));
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          swapped = true;
          steps.push(withVars(swapStep(j, j + 1, 5, `a[${j}] > a[${j + 1}] → 交换，大的往右冒`), { i, j }));
        }
      }
      steps.push(markStep('sorted', [end], 1, `第 ${i + 1} 趟结束：a[${end}] 已就位`));
      steps.push(passEndStep(a, 6, `第 ${i + 1} 趟结束`));
      if (!swapped) {
        steps.push(noteStep(`第 ${i + 1} 趟零交换 → 提前结束`, 6));
        break;
      }
    }
    for (let i = 0; i < n; i++) steps.push(markStep('sorted', [i], 1));
    return steps;
  },
};
