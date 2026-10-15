import { compareStep, markStep, noteStep, passEndStep, swapStep, unmarkStep, type Step } from '../core/step';

const PSEUDO = [
  { line: 1, indent: 0, text: 'BuildMaxHeap(A):' },
  { line: 2, indent: 1, text: '  for i = n/2-1 downto 0: PushDown(A, i, n-1)' },
  { line: 3, indent: 0, text: 'HeapSort(A):' },
  { line: 4, indent: 1, text: '  for heapSize = n-1 downto 1:' },
  { line: 5, indent: 2, text: '    swap(A[0], A[heapSize])' },
  { line: 6, indent: 2, text: '    PushDown(A, 0, heapSize-1)' },
  { line: 7, indent: 0, text: 'PushDown(A, root, end):' },
  { line: 8, indent: 1, text: '  while 2*root+1 <= end:' },
  { line: 9, indent: 2, text: '    child = 2*root+1' },
  { line: 10, indent: 2, text: '    if child+1 <= end and A[child+1] > A[child]: child = child+1' },
  { line: 11, indent: 2, text: '    if A[root] >= A[child]: break' },
  { line: 12, indent: 3, text: '    swap(A[root], A[child]);  root = child' },
];

export const heap = {
  id: 'heap',
  name: { zh: '堆排序', en: 'Heap Sort' },
  category: 'select' as const,
  stable: false,
  complexity: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
  pseudocode: PSEUDO,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[]): Step[] {
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];
    if (n < 2) return steps;

    const span = (lo: number, hi: number): number[] => {
      const out: number[] = [];
      for (let i = lo; i <= hi; i++) out.push(i);
      return out;
    };

    // 下沉：先取更大的孩子，父 < 大孩子才交换并继续下沉（王道 BuildMaxHeap 口径）
    const pushDown = (root: number, end: number): void => {
      let parent = root;
      while (2 * parent + 1 <= end) {
        let child = 2 * parent + 1;
        if (child + 1 <= end) {
          steps.push(compareStep(child, child + 1, 10, `比较左右孩子 a[${child}]=${a[child]} 与 a[${child + 1}]=${a[child + 1]}`));
          if (a[child + 1] > a[child]) child += 1;
        }
        steps.push(compareStep(parent, child, 11, `比较 a[${parent}]=${a[parent]} 与较大孩子 a[${child}]=${a[child]}`));
        if (a[parent] >= a[child]) break;
        [a[parent], a[child]] = [a[child], a[parent]];
        steps.push(swapStep(parent, child, 12, `a[${child}] 更大 → 交换，父继续下沉到下标 ${child}`));
        parent = child;
      }
    };

    steps.push(markStep('heap', span(0, n - 1), 1, `建初堆：堆大小 = ${n}`, [0, n - 1]));
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      steps.push(noteStep(`调整以 a[${i}]=${a[i]} 为根的子树`, 2));
      pushDown(i, n - 1);
    }
    steps.push(noteStep('建初堆完成', 2));

    for (let heapSize = n - 1; heapSize >= 1; heapSize--) {
      [a[0], a[heapSize]] = [a[heapSize], a[0]];
      steps.push(swapStep(0, heapSize, 5, `堆顶（当前最大值）换到末尾 a[${heapSize}]`));
      steps.push(markStep('sorted', [heapSize], 5, `a[${heapSize}]=${a[heapSize]} 就位`));
      steps.push(markStep('heap', span(0, heapSize - 1), 6, `堆大小变为 ${heapSize}`, [0, heapSize - 1]));
      // 顺序要紧：先修复堆再发 passEnd，否则每趟快照是「堆还没修复」的状态
      if (heapSize - 1 >= 1) pushDown(0, heapSize - 1);
      steps.push(passEndStep(a, 6, `第 ${n - heapSize} 趟结束`));
    }
    steps.push(unmarkStep('heap', [0], 6, '堆已空'));
    steps.push(markStep('sorted', [0], 1, '只剩 1 个元素，自然就位'));
    return steps;
  },
};
