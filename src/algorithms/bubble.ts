import { compareStep, markStep, noteStep, passEndStep, swapStep, withVars, type Step } from '../core/step';
import { more, normalizeOrder, type Order } from '../core/order';

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

  run(input: number[], options?: { order?: Order }): Step[] {
    const order = normalizeOrder(options?.order);
    // 方向不同，动作说明里的关系符与「谁往右冒」跟着换：升序冒大的，降序冒小的
    const gt = order === 'desc' ? '<' : '>';
    const which = order === 'desc' ? '小' : '大';
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];

    for (let i = 0; i < n - 1; i++) {
      const end = n - 1 - i;
      let swapped = false;
      for (let j = 0; j < end; j++) {
        steps.push(withVars(compareStep(j, j + 1, 4, `比较 a[${j}]=${a[j]} 与 a[${j + 1}]=${a[j + 1]}`), { i, j }));
        if (more(a[j], a[j + 1], order)) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          swapped = true;
          steps.push(withVars(swapStep(j, j + 1, 5, `a[${j}] ${gt} a[${j + 1}] → 交换，${which}的往右冒`), { i, j }));
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
