import { compareStep, markStep, noteStep, passEndStep, swapStep, unmarkStep, withVars, type Step } from '../core/step';
import { less, more, normalizeOrder, type Order } from '../core/order';
import type { CodeBook } from '../core/code';

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

const CODE: CodeBook = {
  c: [
    { text: 'void pushDown(int a[], int root, int end) {', anchor: 7 },
    { text: '    while (2 * root + 1 <= end) {', text1: '    while (2 * root <= end) {', anchor: 8 },
    { text: '        int child = 2 * root + 1;', text1: '        int child = 2 * root;', anchor: 9 },
    { text: '        if (child + 1 <= end && a[child + 1] > a[child]) {', descText: '        if (child + 1 <= end && a[child + 1] < a[child]) {', anchor: 10 },
    { text: '            child++;', anchor: 10 },
    { text: '        }' },
    { text: '        if (a[root] >= a[child]) {', descText: '        if (a[root] <= a[child]) {', anchor: 11 },
    { text: '            break;', anchor: 11 },
    { text: '        }' },
    { text: '        int t = a[root];', anchor: 12 },
    { text: '        a[root] = a[child];', anchor: 12 },
    { text: '        a[child] = t;', anchor: 12 },
    { text: '        root = child;', anchor: 12 },
    { text: '    }' },
    { text: '}' },
    { text: 'void buildMaxHeap(int a[], int n) {', descText: 'void buildMinHeap(int a[], int n) {', anchor: 1 },
    { text: '    for (int i = n / 2 - 1; i >= 0; i--) {', text1: '    for (int i = n / 2; i >= 1; i--) {', anchor: 2 },
    { text: '        pushDown(a, i, n - 1);', text1: '        pushDown(a, i, n);', anchor: 2 },
    { text: '    }' },
    { text: '}' },
    { text: 'void heapSort(int a[], int n) {', anchor: 3 },
    { text: '    buildMaxHeap(a, n);', descText: '    buildMinHeap(a, n);' },
    { text: '    for (int heapSize = n - 1; heapSize >= 1; heapSize--) {', text1: '    for (int heapSize = n; heapSize >= 2; heapSize--) {', anchor: 4 },
    { text: '        int t = a[0];', text1: '        int t = a[1];', anchor: 5 },
    { text: '        a[0] = a[heapSize];', text1: '        a[1] = a[heapSize];', anchor: 5 },
    { text: '        a[heapSize] = t;', anchor: 5 },
    { text: '        pushDown(a, 0, heapSize - 1);', text1: '        pushDown(a, 1, heapSize - 1);', anchor: 6 },
    { text: '    }' },
    { text: '}' },
  ],
  cpp: [
    { text: 'void pushDown(std::vector<int>& a, int root, int end) {', anchor: 7 },
    { text: '    while (2 * root + 1 <= end) {', text1: '    while (2 * root <= end) {', anchor: 8 },
    { text: '        int child = 2 * root + 1;', text1: '        int child = 2 * root;', anchor: 9 },
    { text: '        if (child + 1 <= end && a[child + 1] > a[child]) {', descText: '        if (child + 1 <= end && a[child + 1] < a[child]) {', anchor: 10 },
    { text: '            ++child;', anchor: 10 },
    { text: '        }' },
    { text: '        if (a[root] >= a[child]) break;', descText: '        if (a[root] <= a[child]) break;', anchor: 11 },
    { text: '        std::swap(a[root], a[child]);', anchor: 12 },
    { text: '        root = child;', anchor: 12 },
    { text: '    }' },
    { text: '}' },
    { text: 'void buildMaxHeap(std::vector<int>& a) {', descText: 'void buildMinHeap(std::vector<int>& a) {', anchor: 1 },
    { text: '    int n = a.size();', text1: '    int n = a.size() - 1;' },
    { text: '    for (int i = n / 2 - 1; i >= 0; --i) {', text1: '    for (int i = n / 2; i >= 1; --i) {', anchor: 2 },
    { text: '        pushDown(a, i, n - 1);', text1: '        pushDown(a, i, n);', anchor: 2 },
    { text: '    }' },
    { text: '}' },
    { text: 'void heapSort(std::vector<int>& a) {', anchor: 3 },
    { text: '    int n = a.size();', text1: '    int n = a.size() - 1;' },
    { text: '    buildMaxHeap(a);', descText: '    buildMinHeap(a);' },
    { text: '    for (int heapSize = n - 1; heapSize >= 1; --heapSize) {', text1: '    for (int heapSize = n; heapSize >= 2; --heapSize) {', anchor: 4 },
    { text: '        std::swap(a[0], a[heapSize]);', text1: '        std::swap(a[1], a[heapSize]);', anchor: 5 },
    { text: '        pushDown(a, 0, heapSize - 1);', text1: '        pushDown(a, 1, heapSize - 1);', anchor: 6 },
    { text: '    }' },
    { text: '}' },
  ],
  java: [
    { text: 'void pushDown(int[] a, int root, int end) {', anchor: 7 },
    { text: '    while (2 * root + 1 <= end) {', text1: '    while (2 * root <= end) {', anchor: 8 },
    { text: '        int child = 2 * root + 1;', text1: '        int child = 2 * root;', anchor: 9 },
    { text: '        if (child + 1 <= end && a[child + 1] > a[child]) {', descText: '        if (child + 1 <= end && a[child + 1] < a[child]) {', anchor: 10 },
    { text: '            child++;', anchor: 10 },
    { text: '        }' },
    { text: '        if (a[root] >= a[child]) {', descText: '        if (a[root] <= a[child]) {', anchor: 11 },
    { text: '            break;', anchor: 11 },
    { text: '        }' },
    { text: '        int t = a[root];', anchor: 12 },
    { text: '        a[root] = a[child];', anchor: 12 },
    { text: '        a[child] = t;', anchor: 12 },
    { text: '        root = child;', anchor: 12 },
    { text: '    }' },
    { text: '}' },
    { text: 'void buildMaxHeap(int[] a) {', descText: 'void buildMinHeap(int[] a) {', anchor: 1 },
    { text: '    int n = a.length;', text1: '    int n = a.length - 1;' },
    { text: '    for (int i = n / 2 - 1; i >= 0; i--) {', text1: '    for (int i = n / 2; i >= 1; i--) {', anchor: 2 },
    { text: '        pushDown(a, i, n - 1);', text1: '        pushDown(a, i, n);', anchor: 2 },
    { text: '    }' },
    { text: '}' },
    { text: 'void heapSort(int[] a) {', anchor: 3 },
    { text: '    int n = a.length;', text1: '    int n = a.length - 1;' },
    { text: '    buildMaxHeap(a);', descText: '    buildMinHeap(a);' },
    { text: '    for (int heapSize = n - 1; heapSize >= 1; heapSize--) {', text1: '    for (int heapSize = n; heapSize >= 2; heapSize--) {', anchor: 4 },
    { text: '        int t = a[0];', text1: '        int t = a[1];', anchor: 5 },
    { text: '        a[0] = a[heapSize];', text1: '        a[1] = a[heapSize];', anchor: 5 },
    { text: '        a[heapSize] = t;', anchor: 5 },
    { text: '        pushDown(a, 0, heapSize - 1);', text1: '        pushDown(a, 1, heapSize - 1);', anchor: 6 },
    { text: '    }' },
    { text: '}' },
  ],
  python: [
    { text: 'def push_down(a, root, end):', anchor: 7 },
    { text: '    while 2 * root + 1 <= end:', text1: '    while 2 * root <= end:', anchor: 8 },
    { text: '        child = 2 * root + 1', text1: '        child = 2 * root', anchor: 9 },
    { text: '        if child + 1 <= end and a[child + 1] > a[child]:', descText: '        if child + 1 <= end and a[child + 1] < a[child]:', anchor: 10 },
    { text: '            child += 1', anchor: 10 },
    { text: '        if a[root] >= a[child]:', descText: '        if a[root] <= a[child]:', anchor: 11 },
    { text: '            break', anchor: 11 },
    { text: '        a[root], a[child] = a[child], a[root]', anchor: 12 },
    { text: '        root = child', anchor: 12 },
    { text: 'def build_max_heap(a):', descText: 'def build_min_heap(a):', anchor: 1 },
    { text: '    n = len(a)', text1: '    n = len(a) - 1' },
    { text: '    for i in range(n // 2 - 1, -1, -1):', text1: '    for i in range(n // 2, 0, -1):', anchor: 2 },
    { text: '        push_down(a, i, n - 1)', text1: '        push_down(a, i, n)', anchor: 2 },
    { text: 'def heap_sort(a):', anchor: 3 },
    { text: '    n = len(a)', text1: '    n = len(a) - 1' },
    { text: '    build_max_heap(a)', descText: '    build_min_heap(a)' },
    { text: '    for heap_size in range(n - 1, 0, -1):', text1: '    for heap_size in range(n, 1, -1):', anchor: 4 },
    { text: '        a[0], a[heap_size] = a[heap_size], a[0]', text1: '        a[1], a[heap_size] = a[heap_size], a[1]', anchor: 5 },
    { text: '        push_down(a, 0, heap_size - 1)', text1: '        push_down(a, 1, heap_size - 1)', anchor: 6 },
  ],
};

export const heap = {
  id: 'heap',
  name: { zh: '堆排序', en: 'Heap Sort' },
  category: 'select' as const,
  stable: false,
  complexity: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
  pseudocode: PSEUDO,
  code: CODE,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[], options?: { order?: Order }): Step[] {
    // 升序建大顶堆、降序建小顶堆：换出堆顶到末尾的动作不变，只换「谁更靠前」的判断
    const order = normalizeOrder(options?.order);
    const extreme = order === 'desc' ? '当前最小值' : '当前最大值';
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];
    if (n < 2) return steps;

    const span = (lo: number, hi: number): number[] => {
      const out: number[] = [];
      for (let i = lo; i <= hi; i++) out.push(i);
      return out;
    };

    // 下沉：先取「更靠前」的孩子，父若已就位就停（王道 BuildMaxHeap 口径；降序时即小顶堆口径）
    const pushDown = (root: number, end: number): void => {
      let parent = root;
      steps.push(noteStep(`下沉 a[${parent}]：2*${parent}+1 ≤ ${end} 时继续与更靠前的孩子比较`, 8));
      while (2 * parent + 1 <= end) {
        let child = 2 * parent + 1;
        if (child + 1 <= end) {
          steps.push(withVars(compareStep(child, child + 1, 10, `比较左右孩子 a[${child}]=${a[child]} 与 a[${child + 1}]=${a[child + 1]}`), { root: parent, child }));
          if (more(a[child + 1], a[child], order)) child += 1;
        }
        steps.push(withVars(compareStep(parent, child, 11, `比较 a[${parent}]=${a[parent]} 与更靠前的孩子 a[${child}]=${a[child]}`), { root: parent, child }));
        // 「父已就位」= 父不排在孩子之前（升序：父 ≥ 孩子；降序：父 ≤ 孩子）就停
        if (!less(a[parent], a[child], order)) break;
        [a[parent], a[child]] = [a[child], a[parent]];
        steps.push(withVars(swapStep(parent, child, 12, `a[${child}] 更靠前 → 交换，父继续下沉到下标 ${child}`), { root: parent, child }));
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
      steps.push(noteStep(`第 ${n - heapSize} 趟开始：当前堆范围 a[0..${heapSize}]`, 4));
      [a[0], a[heapSize]] = [a[heapSize], a[0]];
      steps.push(withVars(swapStep(0, heapSize, 5, `堆顶（${extreme}）换到末尾 a[${heapSize}]`), { heapSize }));
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
