import { assignStep, auxWriteStep, markStep, noteStep, passEndStep, withVars, type Step } from '../core/step';
import { normalizeOrder, type Order } from '../core/order';

const PSEUDO = [
  { line: 1, indent: 0, text: 'RadixSort(A):' },
  { line: 2, indent: 1, text: '  digits = A 中最大元素（按绝对值）的十进制位数' },
  { line: 3, indent: 1, text: '  for d = 0 to digits-1:' },
  { line: 4, indent: 2, text: '    for i = 0 to n-1: 按第 d 位把 A[i] 放进对应桶' },
  { line: 5, indent: 2, text: '    k = 0' },
  { line: 6, indent: 2, text: '    for b = 0 to 9: for v in bucket[b]: A[k++] = v' },
];

export const radix = {
  id: 'radix',
  name: { zh: '基数排序', en: 'Radix Sort' },
  category: 'radix' as const,
  stable: true,
  complexity: { best: 'O(d(n+r))', avg: 'O(d(n+r))', worst: 'O(d(n+r))', space: 'O(n+r)' },
  pseudocode: PSEUDO,
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
