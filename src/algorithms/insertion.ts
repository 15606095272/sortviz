import { assignStep, compareStep, markStep, passEndStep, withVars, type Step } from '../core/step';
import { more, normalizeOrder, type Order } from '../core/order';
import type { CodeBook } from '../core/code';

const PSEUDO = [
  { line: 1, indent: 0, text: 'for i = 1 to n-1:' },
  { line: 2, indent: 1, text: '  key = A[i]' },
  { line: 3, indent: 1, text: '  j = i - 1' },
  { line: 4, indent: 1, text: '  while j >= 0 and A[j] > key:' },
  { line: 5, indent: 2, text: '    A[j+1] = A[j]' },
  { line: 6, indent: 2, text: '    j = j - 1' },
  { line: 7, indent: 1, text: '  A[j+1] = key' },
];

/**
 * 四语言真实代码。PSEUDO 是「语义行号骨架」，这里的 anchor 指向骨架的行号：
 * 各语言按自己的括号/缩进习惯换行（Python 甚至少两行），靠 anchor 与语义行对齐，
 * 所以面板高亮按 anchor 匹配，不看行号。
 */
const CODE: CodeBook = {
  c: [
    { text: 'void insertionSort(int a[], int n) {' },
    { text: '    for (int i = 1; i < n; i++) {', text1: '    for (int i = 2; i <= n; i++) {', anchor: 1 },
    { text: '        int key = a[i];', anchor: 2 },
    { text: '        int j = i - 1;', anchor: 3 },
    {
      text: '        while (j >= 0 && a[j] > key) {',
      descText: '        while (j >= 0 && a[j] < key) {',
      text1: '        while (j >= 1 && a[j] > key) {',
      descText1: '        while (j >= 1 && a[j] < key) {',
      anchor: 4,
    },
    { text: '            a[j + 1] = a[j];', anchor: 5 },
    { text: '            j--;', anchor: 6 },
    { text: '        }' },
    { text: '        a[j + 1] = key;', anchor: 7 },
    { text: '    }' },
    { text: '}' },
  ],
  cpp: [
    { text: 'void insertionSort(int a[], int n) {' },
    { text: '    for (int i = 1; i < n; ++i) {', text1: '    for (int i = 2; i <= n; ++i) {', anchor: 1 },
    { text: '        int key = a[i];', anchor: 2 },
    { text: '        int j = i - 1;', anchor: 3 },
    {
      text: '        while (j >= 0 && a[j] > key) {',
      descText: '        while (j >= 0 && a[j] < key) {',
      text1: '        while (j >= 1 && a[j] > key) {',
      descText1: '        while (j >= 1 && a[j] < key) {',
      anchor: 4,
    },
    { text: '            a[j + 1] = a[j];', anchor: 5 },
    { text: '            --j;', anchor: 6 },
    { text: '        }' },
    { text: '        a[j + 1] = key;', anchor: 7 },
    { text: '    }' },
    { text: '}' },
  ],
  java: [
    { text: 'void insertionSort(int[] a) {' },
    { text: '    for (int i = 1; i < a.length; i++) {', text1: '    for (int i = 2; i <= a.length - 1; i++) {', anchor: 1 },
    { text: '        int key = a[i];', anchor: 2 },
    { text: '        int j = i - 1;', anchor: 3 },
    {
      text: '        while (j >= 0 && a[j] > key) {',
      descText: '        while (j >= 0 && a[j] < key) {',
      text1: '        while (j >= 1 && a[j] > key) {',
      descText1: '        while (j >= 1 && a[j] < key) {',
      anchor: 4,
    },
    { text: '            a[j + 1] = a[j];', anchor: 5 },
    { text: '            j--;', anchor: 6 },
    { text: '        }' },
    { text: '        a[j + 1] = key;', anchor: 7 },
    { text: '    }' },
    { text: '}' },
  ],
  python: [
    { text: 'def insertion_sort(a):' },
    { text: '    for i in range(1, len(a)):', text1: '    for i in range(2, len(a)):', anchor: 1 },
    { text: '        key = a[i]', anchor: 2 },
    { text: '        j = i - 1', anchor: 3 },
    {
      text: '        while j >= 0 and a[j] > key:',
      descText: '        while j >= 0 and a[j] < key:',
      text1: '        while j >= 1 and a[j] > key:',
      descText1: '        while j >= 1 and a[j] < key:',
      anchor: 4,
    },
    { text: '            a[j + 1] = a[j]', anchor: 5 },
    { text: '            j -= 1', anchor: 6 },
    { text: '        a[j + 1] = key', anchor: 7 },
  ],
};

export const insertion = {
  id: 'insertion',
  name: { zh: '直接插入排序', en: 'Insertion Sort' },
  category: 'insert' as const,
  stable: true,
  complexity: { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: PSEUDO,
  code: CODE,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[], options?: { order?: Order }): Step[] {
    const order = normalizeOrder(options?.order);
    // 方向不同，动作说明里的关系符跟着换：升序是 a[j] > key 才后移，降序反之
    const gt = order === 'desc' ? '<' : '>';
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
        steps.push(withVars(compareStep(j, i, 4, `比较 a[${j}]=${a[j]} 与待插入的 key=${key}`), { i, j, key }));
        if (!more(a[j], key, order)) break;
        a[j + 1] = a[j];
        steps.push(withVars(assignStep(j + 1, a[j], 5, `a[${j}]=${a[j]} ${gt} key → 后移一位到 a[${j + 1}]`), { i, j, key }));
        j -= 1;
      }
      a[j + 1] = key;
      steps.push(withVars(assignStep(j + 1, key, 7, `key=${key} 落到下标 ${j + 1}`), { i, j, key }));
      steps.push(markStep('sorted', [i], 1, `第 ${i} 趟结束：有序区扩到 [0,${i}]`));
      steps.push(passEndStep(a, 1, `第 ${i} 趟结束`));
    }
    return steps;
  },
};
