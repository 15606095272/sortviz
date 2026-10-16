import { assignStep, auxWriteStep, compareStep, markStep, noteStep, passEndStep, unmarkStep, withVars, type Step } from '../core/step';
import { more, normalizeOrder, type Order } from '../core/order';
import type { CodeBook } from '../core/code';

const PSEUDO = [
  { line: 1, indent: 0, text: 'MergeSort(A):' },
  { line: 2, indent: 1, text: '  for width = 1; width < n; width *= 2:' },
  { line: 3, indent: 2, text: '    for lo = 0; lo < n; lo += 2*width:' },
  { line: 4, indent: 3, text: '      mid = lo+width-1;  hi = min(lo+2*width-1, n-1)' },
  { line: 5, indent: 3, text: '      Merge(A, lo, mid, hi)' },
  { line: 6, indent: 0, text: 'Merge(A, lo, mid, hi):' },
  { line: 7, indent: 1, text: '  i = lo;  j = mid+1;  k = lo' },
  { line: 8, indent: 1, text: '  while i <= mid and j <= hi:' },
  { line: 9, indent: 2, text: '    if A[i] <= A[j]: aux[k++] = A[i++]' },
  { line: 10, indent: 2, text: '    else: aux[k++] = A[j++]' },
  { line: 11, indent: 1, text: '  while i <= mid: aux[k++] = A[i++]' },
  { line: 12, indent: 1, text: '  while j <= hi: aux[k++] = A[j++]' },
  { line: 13, indent: 1, text: '  for t = lo to hi: A[t] = aux[t]' },
];

const CODE: CodeBook = {
  c: [
    { text: 'void merge(int a[], int aux[], int lo, int mid, int hi) {', anchor: 6 },
    { text: '    int i = lo;', anchor: 7 },
    { text: '    int j = mid + 1;', anchor: 7 },
    { text: '    int k = lo;', anchor: 7 },
    { text: '    while (i <= mid && j <= hi) {', anchor: 8 },
    { text: '        if (a[i] <= a[j]) {', anchor: 9 },
    { text: '            aux[k++] = a[i++];', anchor: 9 },
    { text: '        } else {', anchor: 10 },
    { text: '            aux[k++] = a[j++];', anchor: 10 },
    { text: '        }' },
    { text: '    }' },
    { text: '    while (i <= mid) aux[k++] = a[i++];', anchor: 11 },
    { text: '    while (j <= hi) aux[k++] = a[j++];', anchor: 12 },
    { text: '    for (int t = lo; t <= hi; t++) {', anchor: 13 },
    { text: '        a[t] = aux[t];', anchor: 13 },
    { text: '    }' },
    { text: '}' },
    { text: 'void mergeSort(int a[], int n) {', anchor: 1 },
    { text: '    int *aux = (int *)malloc(n * sizeof(int));' },
    { text: '    for (int width = 1; width < n; width *= 2) {', anchor: 2 },
    { text: '        for (int lo = 0; lo < n; lo += 2 * width) {', anchor: 3 },
    { text: '            int mid = lo + width - 1;', anchor: 4 },
    { text: '            if (mid > n - 1) mid = n - 1;', anchor: 4 },
    { text: '            int hi = lo + 2 * width - 1;', anchor: 4 },
    { text: '            if (hi > n - 1) hi = n - 1;', anchor: 4 },
    { text: '            if (mid >= hi) continue;' },
    { text: '            merge(a, aux, lo, mid, hi);', anchor: 5 },
    { text: '        }' },
    { text: '    }' },
    { text: '    free(aux);' },
    { text: '}' },
  ],
  cpp: [
    { text: 'void mergeRun(std::vector<int>& a, std::vector<int>& aux, int lo, int mid, int hi) {', anchor: 6 },
    { text: '    int i = lo;', anchor: 7 },
    { text: '    int j = mid + 1;', anchor: 7 },
    { text: '    int k = lo;', anchor: 7 },
    { text: '    while (i <= mid && j <= hi) {', anchor: 8 },
    { text: '        if (a[i] <= a[j]) {', anchor: 9 },
    { text: '            aux[k++] = a[i++];', anchor: 9 },
    { text: '        } else {', anchor: 10 },
    { text: '            aux[k++] = a[j++];', anchor: 10 },
    { text: '        }' },
    { text: '    }' },
    { text: '    while (i <= mid) aux[k++] = a[i++];', anchor: 11 },
    { text: '    while (j <= hi) aux[k++] = a[j++];', anchor: 12 },
    { text: '    for (int t = lo; t <= hi; ++t) {', anchor: 13 },
    { text: '        a[t] = aux[t];', anchor: 13 },
    { text: '    }' },
    { text: '}' },
    { text: 'void mergeSort(std::vector<int>& a) {', anchor: 1 },
    { text: '    int n = a.size();' },
    { text: '    std::vector<int> aux(n);' },
    { text: '    for (int width = 1; width < n; width *= 2) {', anchor: 2 },
    { text: '        for (int lo = 0; lo < n; lo += 2 * width) {', anchor: 3 },
    { text: '            int mid = std::min(lo + width - 1, n - 1);', anchor: 4 },
    { text: '            int hi = std::min(lo + 2 * width - 1, n - 1);', anchor: 4 },
    { text: '            if (mid >= hi) continue;' },
    { text: '            mergeRun(a, aux, lo, mid, hi);', anchor: 5 },
    { text: '        }' },
    { text: '    }' },
    { text: '}' },
  ],
  java: [
    { text: 'private void merge(int[] a, int[] aux, int lo, int mid, int hi) {', anchor: 6 },
    { text: '    int i = lo;', anchor: 7 },
    { text: '    int j = mid + 1;', anchor: 7 },
    { text: '    int k = lo;', anchor: 7 },
    { text: '    while (i <= mid && j <= hi) {', anchor: 8 },
    { text: '        if (a[i] <= a[j]) {', anchor: 9 },
    { text: '            aux[k++] = a[i++];', anchor: 9 },
    { text: '        } else {', anchor: 10 },
    { text: '            aux[k++] = a[j++];', anchor: 10 },
    { text: '        }' },
    { text: '    }' },
    { text: '    while (i <= mid) aux[k++] = a[i++];', anchor: 11 },
    { text: '    while (j <= hi) aux[k++] = a[j++];', anchor: 12 },
    { text: '    for (int t = lo; t <= hi; t++) {', anchor: 13 },
    { text: '        a[t] = aux[t];', anchor: 13 },
    { text: '    }' },
    { text: '}' },
    { text: 'void mergeSort(int[] a) {', anchor: 1 },
    { text: '    int n = a.length;' },
    { text: '    int[] aux = new int[n];' },
    { text: '    for (int width = 1; width < n; width *= 2) {', anchor: 2 },
    { text: '        for (int lo = 0; lo < n; lo += 2 * width) {', anchor: 3 },
    { text: '            int mid = Math.min(lo + width - 1, n - 1);', anchor: 4 },
    { text: '            int hi = Math.min(lo + 2 * width - 1, n - 1);', anchor: 4 },
    { text: '            if (mid >= hi) continue;' },
    { text: '            merge(a, aux, lo, mid, hi);', anchor: 5 },
    { text: '        }' },
    { text: '    }' },
    { text: '}' },
  ],
  python: [
    { text: 'def merge(a, aux, lo, mid, hi):', anchor: 6 },
    { text: '    i = lo', anchor: 7 },
    { text: '    j = mid + 1', anchor: 7 },
    { text: '    k = lo', anchor: 7 },
    { text: '    while i <= mid and j <= hi:', anchor: 8 },
    { text: '        if a[i] <= a[j]:', anchor: 9 },
    { text: '            aux[k] = a[i]', anchor: 9 },
    { text: '            i += 1', anchor: 9 },
    { text: '        else:', anchor: 10 },
    { text: '            aux[k] = a[j]', anchor: 10 },
    { text: '            j += 1', anchor: 10 },
    { text: '        k += 1', anchor: 9 },
    { text: '    while i <= mid:', anchor: 11 },
    { text: '        aux[k] = a[i]', anchor: 11 },
    { text: '        i += 1', anchor: 11 },
    { text: '        k += 1', anchor: 11 },
    { text: '    while j <= hi:', anchor: 12 },
    { text: '        aux[k] = a[j]', anchor: 12 },
    { text: '        j += 1', anchor: 12 },
    { text: '        k += 1', anchor: 12 },
    { text: '    for t in range(lo, hi + 1):', anchor: 13 },
    { text: '        a[t] = aux[t]', anchor: 13 },
    { text: 'def merge_sort(a):', anchor: 1 },
    { text: '    n = len(a)' },
    { text: '    aux = [0] * n' },
    { text: '    width = 1' },
    { text: '    while width < n:', anchor: 2 },
    { text: '        for lo in range(0, n, 2 * width):', anchor: 3 },
    { text: '            mid = min(lo + width - 1, n - 1)', anchor: 4 },
    { text: '            hi = min(lo + 2 * width - 1, n - 1)', anchor: 4 },
    { text: '            if mid < hi:' },
    { text: '                merge(a, aux, lo, mid, hi)', anchor: 5 },
    { text: '        width *= 2' },
  ],
};

export const merge = {
  id: 'merge',
  name: { zh: '2-路归并排序', en: 'Merge Sort' },
  category: 'merge' as const,
  stable: true,
  complexity: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  pseudocode: PSEUDO,
  code: CODE,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[], options?: { order?: Order }): Step[] {
    const order = normalizeOrder(options?.order);
    // 方向不同，动作说明里的关系符跟着换；等值仍取左段 → 两个方向都稳定
    const le = order === 'desc' ? '≥' : '≤';
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];
    if (n < 2) return steps;
    const aux: number[] = new Array(n).fill(0);

    const span = (lo: number, hi: number): number[] => {
      const out: number[] = [];
      for (let i = lo; i <= hi; i++) out.push(i);
      return out;
    };

    // width 作为参数传入：它本是外层 for 的循环变量，作用域在 for 语句内，
    // 闭包直接引用不到（会 ReferenceError），但变量值要带进步骤截图，故显式传入。
    const mergeRun = (lo: number, mid: number, hi: number, width: number): void => {
      steps.push(markStep('range', span(lo, hi), 4, `归并 [${lo}, ${mid}] 与 [${mid + 1}, ${hi}]`, [lo, hi]));
      steps.push(noteStep(`双指针归并：i ≤ ${mid} 且 j ≤ ${hi} 时，每次把${le}的一侧写入 aux`, 8));
      let i = lo;
      let j = mid + 1;
      let k = lo;
      while (i <= mid && j <= hi) {
        steps.push(withVars(compareStep(i, j, 9, `比较 a[${i}]=${a[i]} 与 a[${j}]=${a[j]}`), { lo, mid, hi, i, j, width }));
        if (!more(a[i], a[j], order)) {
          // 相等时取左段（等值元素保持原相对次序 → 归并排序稳定）
          aux[k] = a[i];
          steps.push(auxWriteStep(k, a[i], 9, `a[${i}]=${a[i]} ${le} a[${j}]=${a[j]} → 取左段放入 aux[${k}]`));
          i += 1;
        } else {
          aux[k] = a[j];
          steps.push(auxWriteStep(k, a[j], 10, `a[${j}]=${a[j]} 更靠前 → 取右段放入 aux[${k}]`));
          j += 1;
        }
        k += 1;
      }
      while (i <= mid) {
        aux[k] = a[i];
        steps.push(auxWriteStep(k, a[i], 11, `左段剩余 a[${i}]=${a[i]} 直接放入 aux[${k}]`));
        i += 1;
        k += 1;
      }
      while (j <= hi) {
        aux[k] = a[j];
        steps.push(auxWriteStep(k, a[j], 12, `右段剩余 a[${j}]=${a[j]} 直接放入 aux[${k}]`));
        j += 1;
        k += 1;
      }
      for (let t = lo; t <= hi; t++) {
        a[t] = aux[t];
        steps.push(withVars(assignStep(t, aux[t], 13, `回填主数组 a[${t}] = ${aux[t]}`), { k: t, lo, mid, hi, width }));
      }
      steps.push(unmarkStep('range', span(lo, hi), 13));
    };

    for (let width = 1; width < n; width *= 2) {
      steps.push(markStep('range', span(0, n - 1), 2, `宽度 ${width} 的一趟：两两归并长度 ${width} 的有序段`, [0, n - 1]));
      for (let lo = 0; lo < n; lo += 2 * width) {
        const mid = Math.min(lo + width - 1, n - 1);
        const hi = Math.min(lo + 2 * width - 1, n - 1);
        if (mid >= hi) continue;
        mergeRun(lo, mid, hi, width);
      }
      steps.push(unmarkStep('range', span(0, n - 1), 3));
      steps.push(passEndStep(a, 3, `宽度 ${width} 的一趟结束`));
    }
    return steps;
  },
};
