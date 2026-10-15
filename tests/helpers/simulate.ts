import type { Step } from '../../src/core/step';

export interface Item { value: number; origin: number }

export function toItems(data: number[]): Item[] {
  return data.map((value, origin) => ({ value, origin }));
}

/** 用同一份步骤流驱动 item 数组：swap/assign 同步作用到 origin，用于检查稳定性。
 *  注意：assign 步骤不带「值来自哪一格」，所以 origin 会被记为 -1——
 *  本函数只对 swap 型算法（冒泡/快排/简单选择/堆）的稳定性有判定力；
 *  插入/归并/基数的稳定性改用「相等即停」的行为断言（见各自测试里的可证伪用例）。 */
export function simulate(items: Item[], steps: Step[]): Item[] {
  const arr = items.map((it) => ({ ...it }));
  for (const s of steps) {
    if (s.kind === 'swap') { const [i, j] = s.indices!; const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    else if (s.kind === 'assign') { arr[s.indices![0]] = { value: s.value!, origin: -1 }; }
  }
  return arr;
}

/** 稳定 = 相同值的元素保持原有相对次序（origin 递增） */
export function isStable(sorted: Item[]): boolean {
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].value === sorted[i - 1].value && sorted[i].origin < sorted[i - 1].origin) return false;
  }
  return true;
}
