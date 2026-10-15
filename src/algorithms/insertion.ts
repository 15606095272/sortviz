import { assignStep, compareStep, markStep, passEndStep, withVars, type Step } from '../core/step';

const PSEUDO = [
  { line: 1, indent: 0, text: 'for i = 1 to n-1:' },
  { line: 2, indent: 1, text: '  key = A[i]' },
  { line: 3, indent: 1, text: '  j = i - 1' },
  { line: 4, indent: 1, text: '  while j >= 0 and A[j] > key:' },
  { line: 5, indent: 2, text: '    A[j+1] = A[j]' },
  { line: 6, indent: 2, text: '    j = j - 1' },
  { line: 7, indent: 1, text: '  A[j+1] = key' },
];

export const insertion = {
  id: 'insertion',
  name: { zh: '直接插入排序', en: 'Insertion Sort' },
  category: 'insert' as const,
  stable: true,
  complexity: { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: PSEUDO,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[]): Step[] {
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];
    steps.push(markStep('sorted', [0], 1, `初始有序区：[0]`));

    for (let i = 1; i < n; i++) {
      const key = a[i];
      // 「取出 key」只是把值暂存，按 408 口径不计移动（移动 = 移位 + 落位），用 mark 做视觉高亮
      steps.push(markStep('active', [i], 2, `取出 a[${i}]=${key} 作为待插入的 key`));
      let j = i - 1;
      while (j >= 0) {
        // 下标 i 是「空位」：key 已取出，a[i] 的显示值可能已被后移元素覆盖，
        // 比较的对象始终是 key 的值，故动作说明里写 key 而不是 a[i]。
        steps.push(withVars(compareStep(j, i, 4, `比较 a[${j}]=${a[j]} 与待插入的 key=${key}`), { i, j }));
        if (a[j] <= key) break;
        a[j + 1] = a[j];
        steps.push(withVars(assignStep(j + 1, a[j], 5, `a[${j}]=${a[j]} > key → 后移一位到 a[${j + 1}]`), { i, j }));
        j -= 1;
      }
      a[j + 1] = key;
      steps.push(withVars(assignStep(j + 1, key, 7, `key=${key} 落到下标 ${j + 1}`), { i, j }));
      steps.push(markStep('sorted', [i], 1, `第 ${i} 趟结束：有序区扩到 [0,${i}]`));
      steps.push(passEndStep(a, 1, `第 ${i} 趟结束`));
    }
    return steps;
  },
};
