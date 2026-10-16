import { compareStep, markStep, passEndStep, swapStep, noteStep, unmarkStep, withVars, type Step } from '../core/step';
import { less, normalizeOrder, type Order } from '../core/order';
import type { CodeBook } from '../core/code';

const PSEUDO = [
  { line: 1, indent: 0, text: 'QuickSort(A, low, high):' },
  { line: 2, indent: 1, text: '  if low < high:' },
  { line: 3, indent: 2, text: '    p = Partition(A, low, high)' },
  { line: 4, indent: 2, text: '    QuickSort(A, low, p-1)' },
  { line: 5, indent: 2, text: '    QuickSort(A, p+1, high)' },
  { line: 6, indent: 0, text: 'Partition(A, low, high):' },
  { line: 7, indent: 1, text: '  pivot = A[low];  i = low' },
  { line: 8, indent: 1, text: '  for j = low+1 to high:' },
  { line: 9, indent: 2, text: '    if A[j] < pivot:' },
  { line: 10, indent: 3, text: '      i = i + 1; swap(A[i], A[j])' },
  { line: 11, indent: 1, text: '  swap(A[low], A[i])' },
  { line: 12, indent: 1, text: '  return i' },
];
const CODE: CodeBook = {
  c: [
    { text: 'void quickSort(int a[], int low, int high) {', anchor: 1 },
    { text: '    if (low < high) {', anchor: 2 },
    { text: '        int p = partition(a, low, high);', anchor: 3 },
    { text: '        quickSort(a, low, p - 1);', anchor: 4 },
    { text: '        quickSort(a, p + 1, high);', anchor: 5 },
    { text: '    }' },
    { text: '}' },
    { text: '' },
    { text: 'int partition(int a[], int low, int high) {', anchor: 6 },
    { text: '    int pivot = a[low];', anchor: 7 },
    { text: '    int i = low;', anchor: 7 },
    { text: '    for (int j = low + 1; j <= high; j++) {', anchor: 8 },
    { text: '        if (a[j] < pivot) {', descText: '        if (a[j] > pivot) {', anchor: 9 },
    { text: '            i++;', anchor: 10 },
    { text: '            int t = a[i];', anchor: 10 },
    { text: '            a[i] = a[j];', anchor: 10 },
    { text: '            a[j] = t;', anchor: 10 },
    { text: '        }' },
    { text: '    }' },
    { text: '    int t = a[low];', anchor: 11 },
    { text: '    a[low] = a[i];', anchor: 11 },
    { text: '    a[i] = t;', anchor: 11 },
    { text: '    return i;', anchor: 12 },
    { text: '}' },
  ],
  cpp: [
    { text: 'void quickSort(std::vector<int>& a, int low, int high) {', anchor: 1 },
    { text: '    if (low < high) {', anchor: 2 },
    { text: '        int p = partition(a, low, high);', anchor: 3 },
    { text: '        quickSort(a, low, p - 1);', anchor: 4 },
    { text: '        quickSort(a, p + 1, high);', anchor: 5 },
    { text: '    }' },
    { text: '}' },
    { text: '' },
    { text: 'int partition(std::vector<int>& a, int low, int high) {', anchor: 6 },
    { text: '    int pivot = a[low];', anchor: 7 },
    { text: '    int i = low;', anchor: 7 },
    { text: '    for (int j = low + 1; j <= high; ++j) {', anchor: 8 },
    { text: '        if (a[j] < pivot) {', descText: '        if (a[j] > pivot) {', anchor: 9 },
    { text: '            ++i;', anchor: 10 },
    { text: '            std::swap(a[i], a[j]);', anchor: 10 },
    { text: '        }' },
    { text: '    }' },
    { text: '    std::swap(a[low], a[i]);', anchor: 11 },
    { text: '    return i;', anchor: 12 },
    { text: '}' },
  ],
  java: [
    { text: 'void quickSort(int[] a, int low, int high) {', anchor: 1 },
    { text: '    if (low < high) {', anchor: 2 },
    { text: '        int p = partition(a, low, high);', anchor: 3 },
    { text: '        quickSort(a, low, p - 1);', anchor: 4 },
    { text: '        quickSort(a, p + 1, high);', anchor: 5 },
    { text: '    }' },
    { text: '}' },
    { text: '' },
    { text: 'private int partition(int[] a, int low, int high) {', anchor: 6 },
    { text: '    int pivot = a[low];', anchor: 7 },
    { text: '    int i = low;', anchor: 7 },
    { text: '    for (int j = low + 1; j <= high; j++) {', anchor: 8 },
    { text: '        if (a[j] < pivot) {', descText: '        if (a[j] > pivot) {', anchor: 9 },
    { text: '            i++;', anchor: 10 },
    { text: '            int t = a[i];', anchor: 10 },
    { text: '            a[i] = a[j];', anchor: 10 },
    { text: '            a[j] = t;', anchor: 10 },
    { text: '        }' },
    { text: '    }' },
    { text: '    int t = a[low];', anchor: 11 },
    { text: '    a[low] = a[i];', anchor: 11 },
    { text: '    a[i] = t;', anchor: 11 },
    { text: '    return i;', anchor: 12 },
    { text: '}' },
  ],
  python: [
    { text: 'def quick_sort(a, low, high):', anchor: 1 },
    { text: '    if low < high:', anchor: 2 },
    { text: '        p = partition(a, low, high)', anchor: 3 },
    { text: '        quick_sort(a, low, p - 1)', anchor: 4 },
    { text: '        quick_sort(a, p + 1, high)', anchor: 5 },
    { text: '' },
    { text: 'def partition(a, low, high):', anchor: 6 },
    { text: '    pivot = a[low]', anchor: 7 },
    { text: '    i = low', anchor: 7 },
    { text: '    for j in range(low + 1, high + 1):', anchor: 8 },
    { text: '        if a[j] < pivot:', descText: '        if a[j] > pivot:', anchor: 9 },
    { text: '            i += 1', anchor: 10 },
    { text: '            a[i], a[j] = a[j], a[i]', anchor: 10 },
    { text: '    a[low], a[i] = a[i], a[low]', anchor: 11 },
    { text: '    return i', anchor: 12 },
  ],
};

export const quick = {
  id: 'quick',
  name: { zh: '快速排序', en: 'Quick Sort' },
  category: 'swap' as const,
  stable: false,
  complexity: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
  pseudocode: PSEUDO,
  code: CODE,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[], options?: { order?: Order }): Step[] {
    const order = normalizeOrder(options?.order);
    // 方向不同，动作说明里的关系符跟着换：升序把比 pivot 小的换到左边，降序换大的
    const lt = order === 'desc' ? '>' : '<';
    const a = [...input];
    const steps: Step[] = [];
    let pass = 0;

    const partition = (low: number, high: number): number => {
      const pivot = a[low];
      let i = low;
      steps.push(markStep('pivot', [low], 7, `pivot = ${pivot}（取区间第一个元素）`));
      steps.push(noteStep(`扫描 a[${low + 1}..${high}]：a[j] ${lt} pivot 的元素换到前面`, 8));
      for (let j = low + 1; j <= high; j++) {
        steps.push(withVars(compareStep(j, low, 9, `比较 a[${j}]=${a[j]} 与 pivot=${pivot}`), { i, j, low, high, pivot }));
        if (less(a[j], pivot, order)) {
          i += 1;
          if (i !== j) {
            [a[i], a[j]] = [a[j], a[i]];
            steps.push(withVars(swapStep(i, j, 10, `a[${j}]=${a[j]} ${lt} pivot → 交换 a[${i}] 与 a[${j}]`), { i, j, low, high, pivot }));
          } else {
            steps.push(noteStep(`a[${j}]=${a[j]} ${lt} pivot → i 前移，位置本来就对，无需交换`, 10));
          }
        }
      }
      if (i !== low) {
        [a[low], a[i]] = [a[i], a[low]];
        steps.push(withVars(swapStep(low, i, 11, `扫描结束 → 交换 a[${low}] 与 a[${i}]，pivot 落到下标 ${i}`), { i, low, high, pivot }));
      }
      steps.push(unmarkStep('pivot', [i], 12, `pivot=${pivot} 就位`));
      steps.push(markStep('sorted', [i], 12, `a[${i}]=${pivot} 已就位`));
      pass += 1;
      steps.push(passEndStep(a, 12, `第 ${pass} 趟划分结束（区间 [${low}, ${high}]）`));
      return i;
    };

    // range 标记覆盖「整个递归调用」而不是单次 partition：
    // 这样 replay 的 callStack 就是真正的递归栈，结构视图才能画出嵌套的划分树
    // （若只在 partition 内进出栈，栈深恒为 1，树永远只有一层）。
    const sort = (low: number, high: number): void => {
      if (low >= high) return;
      steps.push(markStep('range', range(low, high), 1, `进入区间 [${low}, ${high}]`, [low, high]));
      const p = partition(low, high);
      sort(low, p - 1);
      sort(p + 1, high);
      steps.push(unmarkStep('range', range(low, high), 5, `区间 [${low}, ${high}] 处理完毕`));
    };

    sort(0, a.length - 1);
    for (let i = 0; i < a.length; i++) steps.push(markStep('sorted', [i], 12));
    steps.push(noteStep('全部就位，排序结束', 1));
    return steps;
  },
};

function range(low: number, high: number): number[] {
  const out: number[] = [];
  for (let i = low; i <= high; i++) out.push(i);
  return out;
}
