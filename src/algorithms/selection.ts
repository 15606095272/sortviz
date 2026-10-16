import { compareStep, markStep, noteStep, passEndStep, swapStep, unmarkStep, withVars, type Step } from '../core/step';
import { less, normalizeOrder, type Order } from '../core/order';
import type { CodeBook } from '../core/code';

const PSEUDO = [
  { line: 1, indent: 0, text: 'for i = 0 to n-2:' },
  { line: 2, indent: 1, text: '  minIndex = i' },
  { line: 3, indent: 1, text: '  for j = i+1 to n-1:' },
  { line: 4, indent: 2, text: '    if A[j] < A[minIndex]: minIndex = j' },
  { line: 5, indent: 1, text: '  if minIndex != i: swap(A[i], A[minIndex])' },
];

const CODE: CodeBook = {
  c: [
    { text: 'void selectionSort(int a[], int n) {' },
    { text: '    for (int i = 0; i < n - 1; i++) {', anchor: 1 },
    { text: '        int minIndex = i;', anchor: 2 },
    { text: '        for (int j = i + 1; j < n; j++) {', anchor: 3 },
    { text: '            if (a[j] < a[minIndex]) {', anchor: 4 },
    { text: '                minIndex = j;', anchor: 4 },
    { text: '            }' },
    { text: '        }' },
    { text: '        if (minIndex != i) {', anchor: 5 },
    { text: '            int t = a[i];', anchor: 5 },
    { text: '            a[i] = a[minIndex];', anchor: 5 },
    { text: '            a[minIndex] = t;', anchor: 5 },
    { text: '        }' },
    { text: '    }' },
    { text: '}' },
  ],
  cpp: [
    { text: 'void selectionSort(std::vector<int>& a) {' },
    { text: '    int n = a.size();' },
    { text: '    for (int i = 0; i < n - 1; ++i) {', anchor: 1 },
    { text: '        int minIndex = i;', anchor: 2 },
    { text: '        for (int j = i + 1; j < n; ++j) {', anchor: 3 },
    { text: '            if (a[j] < a[minIndex]) {', anchor: 4 },
    { text: '                minIndex = j;', anchor: 4 },
    { text: '            }' },
    { text: '        }' },
    { text: '        if (minIndex != i) {', anchor: 5 },
    { text: '            std::swap(a[i], a[minIndex]);', anchor: 5 },
    { text: '        }' },
    { text: '    }' },
    { text: '}' },
  ],
  java: [
    { text: 'void selectionSort(int[] a) {' },
    { text: '    for (int i = 0; i < a.length - 1; i++) {', anchor: 1 },
    { text: '        int minIndex = i;', anchor: 2 },
    { text: '        for (int j = i + 1; j < a.length; j++) {', anchor: 3 },
    { text: '            if (a[j] < a[minIndex]) {', anchor: 4 },
    { text: '                minIndex = j;', anchor: 4 },
    { text: '            }' },
    { text: '        }' },
    { text: '        if (minIndex != i) {', anchor: 5 },
    { text: '            int t = a[i];', anchor: 5 },
    { text: '            a[i] = a[minIndex];', anchor: 5 },
    { text: '            a[minIndex] = t;', anchor: 5 },
    { text: '        }' },
    { text: '    }' },
    { text: '}' },
  ],
  python: [
    { text: 'def selection_sort(a):' },
    { text: '    n = len(a)' },
    { text: '    for i in range(n - 1):', anchor: 1 },
    { text: '        min_index = i', anchor: 2 },
    { text: '        for j in range(i + 1, n):', anchor: 3 },
    { text: '            if a[j] < a[min_index]:', anchor: 4 },
    { text: '                min_index = j', anchor: 4 },
    { text: '        if min_index != i:', anchor: 5 },
    { text: '            a[i], a[min_index] = a[min_index], a[i]', anchor: 5 },
  ],
};

export const selection = {
  id: 'selection',
  name: { zh: '简单选择排序', en: 'Selection Sort' },
  category: 'select' as const,
  stable: false,
  complexity: { best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  pseudocode: PSEUDO,
  code: CODE,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[], options?: { order?: Order }): Step[] {
    // 变量键仍叫 minIndex（panels 的键序表按它渲染）；降序时它是「当前最值下标」——
    // 升序选最小、降序选最大，逻辑同一套，只换比较谓词与文案
    const order = normalizeOrder(options?.order);
    const best = order === 'desc' ? '最大' : '最小';
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];

    for (let i = 0; i < n - 1; i++) {
      let minIndex = i;
      // 'pivot' 标记在这里表示「当前最小候选」——数组视图会把它画成紫色基准格
      steps.push(markStep('pivot', [minIndex], 2, `第 ${i + 1} 趟：先假定 a[${i}]=${a[i]} 是剩余部分的${best}值`));
      steps.push(noteStep(`在 a[${i + 1}..${n - 1}] 内扫描，随时更新${best}值的下标`, 3));
      for (let j = i + 1; j < n; j++) {
        steps.push(withVars(compareStep(j, minIndex, 4, `比较 a[${j}]=${a[j]} 与当前最值 a[${minIndex}]=${a[minIndex]}`), { i, j, minIndex }));
        if (less(a[j], a[minIndex], order)) {
          steps.push(unmarkStep('pivot', [minIndex], 4, `a[${j}]=${a[j]} 更靠前 → 更新最值下标`));
          minIndex = j;
          steps.push(markStep('pivot', [minIndex], 4, `当前最值下标 = ${minIndex}（值 ${a[minIndex]}）`));
        }
      }
      steps.push(unmarkStep('pivot', [minIndex], 5, `本趟最值下标确定为 ${minIndex}`));
      if (minIndex !== i) {
        [a[i], a[minIndex]] = [a[minIndex], a[i]];
        steps.push(withVars(swapStep(i, minIndex, 5, `交换 a[${i}] 与 a[${minIndex}] → a[${i}]=${a[i]} 就位`), { i, minIndex }));
      } else {
        steps.push(noteStep(`a[${i}]=${a[i]} 本来就是${best}值 → 本趟不交换`, 5));
      }
      steps.push(markStep('sorted', [i], 1, `第 ${i + 1} 趟结束：a[${i}] 就位`));
      steps.push(passEndStep(a, 5, `第 ${i + 1} 趟结束`));
    }
    steps.push(markStep('sorted', [n - 1], 1, `最后一个元素自然就位`));
    return steps;
  },
};
