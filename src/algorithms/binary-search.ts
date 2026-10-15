import { compareStep, markStep, noteStep, passEndStep, unmarkStep, withVars, type Step } from '../core/step';

const PSEUDO = [
  { line: 1, indent: 0, text: 'BinarySearch(A, target):' },
  { line: 2, indent: 1, text: '  low = 0;  high = n-1' },
  { line: 3, indent: 1, text: '  while low <= high:' },
  { line: 4, indent: 2, text: '    mid = (low + high) / 2' },
  { line: 5, indent: 2, text: '    if A[mid] == target: return mid' },
  { line: 6, indent: 2, text: '    else if A[mid] < target: low = mid + 1' },
  { line: 7, indent: 2, text: '    else: high = mid - 1' },
  { line: 8, indent: 1, text: '  return -1            // 查找失败' },
];

export const binarySearch = {
  id: 'binary-search',
  name: { zh: '折半查找', en: 'Binary Search' },
  category: 'search' as const,
  stable: true, // 查找不改变元素相对次序
  complexity: { best: 'O(1)', avg: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  pseudocode: PSEUDO,
  defaultViews: ['array'] as const,

  /** 在「界面显示的那份数据」上直接查找（不排序副本，否则高亮下标会错位）。
   *  折半查找要求有序表，未排好序时结果无意义——开头会说明这一点。 */
  run(input: number[], target?: number): Step[] {
    const a = [...input];
    const n = a.length;
    const steps: Step[] = [];
    if (n === 0) return steps;

    const wanted = target ?? a[1] ?? a[0];
    steps.push(noteStep('折半查找要求有序表：若数据未按升序排好，结果无意义（可先用任一排序算法排好）', 1));

    const span = (lo: number, hi: number): number[] => {
      const out: number[] = [];
      for (let i = lo; i <= hi; i++) out.push(i);
      return out;
    };

    let low = 0;
    let high = n - 1;
    steps.push(withVars(markStep('range', span(low, high), 2, `初始区间 [${low}, ${high}]，目标 target = ${wanted}`), { low, high }));
    steps.push(markStep('pivot', [], 3, `low = ${low}, high = ${high}`));

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      steps.push(unmarkStep('pivot', [], 4, `取中点 mid = ${mid}`));
      steps.push(withVars(markStep('pivot', [mid], 4, `mid = ${mid}（a[${mid}] = ${a[mid]}）`), { low, high, mid }));
      // compareStep 的第二个参数语义是「与之比较的下标」；折半查找比的是目标值，
      // 故这里传 mid 自身——只用于高亮中点并计 1 次比较，目标值写在 note 里。
      steps.push(withVars(compareStep(mid, mid, 5, `比较 a[${mid}] = ${a[mid]} 与 target = ${wanted}`), { low, high, mid }));

      if (a[mid] === wanted) {
        steps.push(noteStep(`找到 target = ${wanted}，下标 = ${mid}`, 5));
        steps.push(passEndStep(a, 8, `查找结束：命中下标 ${mid}`));
        return steps;
      }
      if (a[mid] < wanted) {
        steps.push(unmarkStep('range', span(low, high), 6, `a[${mid}] < target → 到右半继续找`));
        low = mid + 1;
      } else {
        steps.push(unmarkStep('range', span(low, high), 7, `a[${mid}] > target → 到左半继续找`));
        high = mid - 1;
      }
      if (low <= high) {
        steps.push(withVars(markStep('range', span(low, high), 3, `新区间 [${low}, ${high}]`), { low, high }));
      }
    }

    steps.push(unmarkStep('pivot', [], 8, '区间已空'));
    steps.push(noteStep(`查找失败：表中没有 ${wanted}`, 8));
    steps.push(passEndStep(a, 8, '查找结束：未命中'));
    return steps;
  },
};
