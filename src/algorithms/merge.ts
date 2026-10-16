import { assignStep, auxWriteStep, compareStep, markStep, passEndStep, unmarkStep, withVars, type Step } from '../core/step';
import { more, normalizeOrder, type Order } from '../core/order';

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

export const merge = {
  id: 'merge',
  name: { zh: '2-路归并排序', en: 'Merge Sort' },
  category: 'merge' as const,
  stable: true,
  complexity: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  pseudocode: PSEUDO,
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
