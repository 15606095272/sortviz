import { assignStep, compareStep, markStep, noteStep, passEndStep, withVars, type Step } from '../core/step';

const PSEUDO = [
  { line: 1, indent: 0, text: 'for i = 1 to n-1:' },
  { line: 2, indent: 1, text: '  key = A[i]' },
  { line: 3, indent: 1, text: '  low = 0;  high = i - 1' },
  { line: 4, indent: 1, text: '  while low <= high:' },
  { line: 5, indent: 2, text: '    mid = (low + high) / 2' },
  { line: 6, indent: 2, text: '    if A[mid] <= key: low = mid + 1' },
  { line: 7, indent: 2, text: '    else: high = mid - 1' },
  { line: 8, indent: 1, text: '  for j = i-1 downto low: A[j+1] = A[j]' },
  { line: 9, indent: 1, text: '  A[low] = key' },
];

export const binaryInsertion = {
  id: 'binary-insertion',
  name: { zh: '折半插入排序', en: 'Binary Insertion Sort' },
  category: 'insert' as const,
  stable: true,
  complexity: { best: 'O(n log n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: PSEUDO,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[]): Step[] {
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];
    steps.push(markStep('sorted', [0], 1, `初始有序区：[0]`));

    for (let i = 1; i < n; i++) {
      const key = a[i];
      // 「取出 key」只做视觉高亮，按 408 口径不计移动（移动 = 移位 + 落位）
      steps.push(markStep('active', [i], 2, `取出 a[${i}]=${key} 作为待插入的 key`));
      let low = 0;
      let high = i - 1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        // 下标 i 是空位（key 已取出），比较对象始终是 key，故说明里写 key
        steps.push(withVars(compareStep(mid, i, 5, `折半比较 a[${mid}]=${a[mid]} 与 key=${key}`), { i, mid, low, high }));
        if (a[mid] <= key) {
          // 等值时往右半区找：相等元素的相对次序不变 → 稳定
          steps.push(noteStep(`a[${mid}]=${a[mid]} ≤ key=${key} → 插入位置在右半区`, 6));
          low = mid + 1;
        } else {
          steps.push(noteStep(`a[${mid}]=${a[mid]} > key=${key} → 插入位置在左半区`, 7));
          high = mid - 1;
        }
      }
      for (let j = i - 1; j >= low; j--) {
        a[j + 1] = a[j];
        steps.push(withVars(assignStep(j + 1, a[j], 8, `后移一位：a[${j}] → a[${j + 1}]`), { i, low }));
      }
      a[low] = key;
      steps.push(withVars(assignStep(low, key, 9, `key=${key} 落到下标 ${low}`), { i, low }));
      steps.push(markStep('sorted', [i], 1, `第 ${i} 趟结束：有序区扩到 [0,${i}]`));
      steps.push(passEndStep(a, 1, `第 ${i} 趟结束`));
    }
    return steps;
  },
};
