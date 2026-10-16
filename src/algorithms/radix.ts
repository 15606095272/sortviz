import { assignStep, auxWriteStep, markStep, noteStep, passEndStep, withVars, type Step } from '../core/step';
import { normalizeOrder, type Order } from '../core/order';
import type { CodeBook } from '../core/code';

const PSEUDO = [
  { line: 1, indent: 0, text: 'RadixSort(A):' },
  { line: 2, indent: 1, text: '  digits = A 中最大元素（按绝对值）的十进制位数' },
  { line: 3, indent: 1, text: '  for d = 0 to digits-1:' },
  { line: 4, indent: 2, text: '    for i = 0 to n-1: 按第 d 位把 A[i] 放进对应桶' },
  { line: 5, indent: 2, text: '    k = 0' },
  { line: 6, indent: 2, text: '    for b = 0 to 9: for v in bucket[b]: A[k++] = v' },
];

const CODE: CodeBook = {
  c: [
    { text: 'int maxDigits(int a[], int n) {', anchor: 2 },
    { text: '    int max = 0;' },
    { text: '    for (int i = 0; i < n; i++) {' },
    { text: '        int v = a[i] < 0 ? -a[i] : a[i];' },
    { text: '        if (v > max) max = v;' },
    { text: '    }' },
    { text: '    int digits = 1;' },
    { text: '    while (max >= 10) {' },
    { text: '        digits++;' },
    { text: '        max /= 10;' },
    { text: '    }' },
    { text: '    return digits;' },
    { text: '}' },
    { text: 'void radixSort(int a[], int n) {', anchor: 1 },
    { text: '    int digits = maxDigits(a, n);', anchor: 2 },
    { text: '    int place = 1;' },
    { text: '    for (int d = 0; d < digits; d++) {', anchor: 3 },
    { text: '        int count[10] = {0};' },
    { text: '        int bucket[10][100];' },
    { text: '        for (int i = 0; i < n; i++) {', anchor: 4 },
    { text: '            int digit = (a[i] / place) % 10;' },
    { text: '            bucket[digit][count[digit]++] = a[i];', anchor: 4 },
    { text: '        }' },
    { text: '        int k = 0;', anchor: 5 },
    { text: '        for (int b = 0; b < 10; b++) {', anchor: 6 },
    { text: '            for (int i = 0; i < count[b]; i++) {', anchor: 6 },
    { text: '                a[k++] = bucket[b][i];', anchor: 6 },
    { text: '            }' },
    { text: '        }' },
    { text: '        place *= 10;' },
    { text: '    }' },
    { text: '}' },
  ],
  cpp: [
    { text: 'int maxDigits(const std::vector<int>& a) {', anchor: 2 },
    { text: '    int max = 0;' },
    { text: '    for (int v : a) {' },
    { text: '        int x = v < 0 ? -v : v;' },
    { text: '        if (x > max) max = x;' },
    { text: '    }' },
    { text: '    int digits = 1;' },
    { text: '    while (max >= 10) {' },
    { text: '        digits++;' },
    { text: '        max /= 10;' },
    { text: '    }' },
    { text: '    return digits;' },
    { text: '}' },
    { text: 'void radixSort(std::vector<int>& a) {', anchor: 1 },
    { text: '    int n = a.size();' },
    { text: '    int digits = maxDigits(a);', anchor: 2 },
    { text: '    int place = 1;' },
    { text: '    for (int d = 0; d < digits; ++d) {', anchor: 3 },
    { text: '        std::vector<std::vector<int>> buckets(10);' },
    { text: '        for (int i = 0; i < n; ++i) {', anchor: 4 },
    { text: '            int digit = (a[i] / place) % 10;' },
    { text: '            buckets[digit].push_back(a[i]);', anchor: 4 },
    { text: '        }' },
    { text: '        int k = 0;', anchor: 5 },
    { text: '        for (int b = 0; b < 10; ++b) {', anchor: 6 },
    { text: '            for (int v : buckets[b]) {', anchor: 6 },
    { text: '                a[k++] = v;', anchor: 6 },
    { text: '            }' },
    { text: '        }' },
    { text: '        place *= 10;' },
    { text: '    }' },
    { text: '}' },
  ],
  java: [
    { text: 'private int maxDigits(int[] a) {', anchor: 2 },
    { text: '    int max = 0;' },
    { text: '    for (int v : a) {' },
    { text: '        int x = v < 0 ? -v : v;' },
    { text: '        if (x > max) max = x;' },
    { text: '    }' },
    { text: '    int digits = 1;' },
    { text: '    while (max >= 10) {' },
    { text: '        digits++;' },
    { text: '        max /= 10;' },
    { text: '    }' },
    { text: '    return digits;' },
    { text: '}' },
    { text: 'void radixSort(int[] a) {', anchor: 1 },
    { text: '    int n = a.length;' },
    { text: '    int digits = maxDigits(a);', anchor: 2 },
    { text: '    int place = 1;' },
    { text: '    for (int d = 0; d < digits; d++) {', anchor: 3 },
    { text: '        List<List<Integer>> buckets = new ArrayList<>();' },
    { text: '        for (int b = 0; b < 10; b++) buckets.add(new ArrayList<>());' },
    { text: '        for (int i = 0; i < n; i++) {', anchor: 4 },
    { text: '            int digit = (a[i] / place) % 10;' },
    { text: '            buckets.get(digit).add(a[i]);', anchor: 4 },
    { text: '        }' },
    { text: '        int k = 0;', anchor: 5 },
    { text: '        for (int b = 0; b < 10; b++) {', anchor: 6 },
    { text: '            for (int v : buckets.get(b)) {', anchor: 6 },
    { text: '                a[k++] = v;', anchor: 6 },
    { text: '            }' },
    { text: '        }' },
    { text: '        place *= 10;' },
    { text: '    }' },
    { text: '}' },
  ],
  python: [
    { text: 'def max_digits(a):', anchor: 2 },
    { text: '    max_value = max(abs(v) for v in a)' },
    { text: '    digits = 1' },
    { text: '    while max_value >= 10:' },
    { text: '        digits += 1' },
    { text: '        max_value //= 10' },
    { text: '    return digits' },
    { text: 'def radix_sort(a):', anchor: 1 },
    { text: '    n = len(a)' },
    { text: '    digits = max_digits(a)', anchor: 2 },
    { text: '    place = 1' },
    { text: '    for d in range(digits):', anchor: 3 },
    { text: '        buckets = [[] for _ in range(10)]' },
    { text: '        for i in range(n):', anchor: 4 },
    { text: '            digit = (abs(a[i]) // place) % 10' },
    { text: '            buckets[digit].append(a[i])', anchor: 4 },
    { text: '        k = 0', anchor: 5 },
    { text: '        for b in range(10):', anchor: 6 },
    { text: '            for v in buckets[b]:', anchor: 6 },
    { text: '                a[k] = v', anchor: 6 },
    { text: '                k += 1' },
    { text: '        place *= 10' },
  ],
};

export const radix = {
  id: 'radix',
  name: { zh: '基数排序', en: 'Radix Sort' },
  category: 'radix' as const,
  stable: true,
  complexity: { best: 'O(d(n+r))', avg: 'O(d(n+r))', worst: 'O(d(n+r))', space: 'O(n+r)' },
  pseudocode: PSEUDO,
  code: CODE,
  defaultViews: ['array', 'structure'] as const,

  run(input: number[], options?: { order?: Order }): Step[] {
    const order = normalizeOrder(options?.order);
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];
    if (n < 2) return steps;
    const base = 10;
    const digits = String(Math.max(...a.map((v) => Math.abs(v)))).length;
    const posName = ['个', '十', '百', '千', '万'];

    for (let d = 0; d < digits; d++) {
      const place = posName[d] ?? String(d + 1);
      const buckets: number[][] = Array.from({ length: base }, () => []);
      steps.push(withVars(noteStep(`第 ${d + 1} 趟：按${place}位分配（低位优先 LSD）`, 3), { place: d + 1 }));
      for (let i = 0; i < n; i++) {
        const digit = Math.floor(Math.abs(a[i]) / base ** d) % base;
        steps.push(withVars(markStep('active', [i], 4, `a[${i}]=${a[i]} 的${place}位是 ${digit} → 放入桶 ${digit}`), { i, place: d + 1 }));
        buckets[digit].push(a[i]);
      }
      // 按桶序收集（桶内 FIFO → 稳定）；辅助数组按收集顺序写入，回填主数组记移动
      let k = 0;
      // 降序时反向收集（桶 9 → 0）；桶内仍 FIFO → 两个方向都稳定
      const seq = order === 'desc' ? [...Array(base).keys()].reverse() : [...Array(base).keys()];
      for (const b of seq) {
        for (const value of buckets[b]) {
          steps.push(withVars(auxWriteStep(k, value, 5, `从桶 ${b} 取出 ${value} → aux[${k}]`), { k, place: d + 1 }));
          a[k] = value;
          steps.push(withVars(assignStep(k, value, 6, `回填 a[${k}] = ${value}`), { k, place: d + 1 }));
          k += 1;
        }
      }
      steps.push(passEndStep(a, 6, `第 ${d + 1} 趟（按${place}位）结束`));
    }
    return steps;
  },
};
