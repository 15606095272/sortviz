import { assignStep, compareStep, markStep, passEndStep, withVars, type Step } from '../core/step';
import { more, normalizeOrder, type Order } from '../core/order';

const PSEUDO = [
  { line: 1, indent: 0, text: 'for d = n/2; d >= 1; d = d/2:' },
  { line: 2, indent: 1, text: '  for k = d to n-1:' },
  { line: 3, indent: 2, text: '    key = A[k];  j = k - d' },
  { line: 4, indent: 2, text: '    while j >= 0 and A[j] > key:' },
  { line: 5, indent: 3, text: '      A[j+d] = A[j];  j = j - d' },
  { line: 6, indent: 2, text: '    A[j+d] = key' },
];

export const shell = {
  id: 'shell',
  name: { zh: '希尔排序', en: 'Shell Sort' },
  category: 'insert' as const,
  stable: false,
  complexity: { best: 'O(n log n)', avg: 'O(n^1.3)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: PSEUDO,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[], options?: { order?: Order }): Step[] {
    const order = normalizeOrder(options?.order);
    // 方向不同，动作说明里的关系符跟着换：升序是 a[j] > key 才后移，降序反之
    const gt = order === 'desc' ? '<' : '>';
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];
    const gaps: number[] = [];
    for (let d = n >> 1; d >= 1; d = d >> 1) gaps.push(d);

    for (const gap of gaps) {
      for (let k = gap; k < n; k++) {
        const key = a[k];
        // 取出 key 不计移动，只做高亮
        steps.push(markStep('active', [k], 3, `取出 a[${k}]=${key}，在步长 ${gap} 的分组内插入`));
        let j = k - gap;
        while (j >= 0) {
          steps.push(withVars(compareStep(j, k, 4, `比较 a[${j}]=${a[j]} 与 key=${key}`), { gap, k, j, key }));
          if (!more(a[j], key, order)) break;
          a[j + gap] = a[j];
          steps.push(withVars(assignStep(j + gap, a[j], 5, `a[${j}]=${a[j]} ${gt} key → 后移 ${gap} 位`), { gap, k, j, key }));
          j -= gap;
        }
        a[j + gap] = key;
        steps.push(withVars(assignStep(j + gap, key, 6, `key=${key} 落到下标 ${j + gap}`), { gap, k, j, key }));
      }
      // 只有增量 1 那一趟结束时整个序列才真正有序
      if (gap === 1) {
        for (let i = 0; i < n; i++) steps.push(markStep('sorted', [i], 1, `增量 1 趟结束：a[${i}] 就位`));
      }
      steps.push(passEndStep(a, 1, `增量 ${gap} 趟结束`));
    }
    return steps;
  },
};
