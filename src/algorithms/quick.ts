import { compareStep, markStep, passEndStep, swapStep, noteStep, unmarkStep, type Step } from '../core/step';

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

export const quick = {
  id: 'quick',
  name: { zh: '快速排序', en: 'Quick Sort' },
  category: 'swap' as const,
  stable: false,
  complexity: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
  pseudocode: PSEUDO,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[]): Step[] {
    const a = [...input];
    const steps: Step[] = [];
    let pass = 0;

    const partition = (low: number, high: number): number => {
      const pivot = a[low];
      let i = low;
      steps.push(markStep('pivot', [low], 7, `pivot = ${pivot}（取区间第一个元素）`));
      for (let j = low + 1; j <= high; j++) {
        steps.push(compareStep(j, low, 9, `比较 a[${j}]=${a[j]} 与 pivot=${pivot}`));
        if (a[j] < pivot) {
          i += 1;
          if (i !== j) {
            [a[i], a[j]] = [a[j], a[i]];
            steps.push(swapStep(i, j, 10, `a[${j}]=${a[j]} < pivot → 交换 a[${i}] 与 a[${j}]`));
          } else {
            steps.push(noteStep(`a[${j}]=${a[j]} < pivot → i 前移，位置本来就对，无需交换`, 10));
          }
        }
      }
      if (i !== low) {
        [a[low], a[i]] = [a[i], a[low]];
        steps.push(swapStep(low, i, 11, `扫描结束 → 交换 a[${low}] 与 a[${i}]，pivot 落到下标 ${i}`));
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
