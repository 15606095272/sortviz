/** 排序方向：默认升序；界面可切降序，切换后重新跑算法（步骤流本来就依赖方向） */
export type Order = 'asc' | 'desc';

export const ORDER_STORAGE_KEY = 'sortviz.order';

export function normalizeOrder(value: string | null | undefined): Order {
  return value === 'desc' ? 'desc' : 'asc';
}

/** a 是否应排在 b 之前（按当前方向）。升序即 a<b，降序即 a>b */
export function less(a: number, b: number, order: Order): boolean {
  return order === 'desc' ? a > b : a < b;
}

/** a 是否应排在 b 之后（按当前方向）。升序即 a>b，降序即 a<b */
export function more(a: number, b: number, order: Order): boolean {
  return order === 'desc' ? a < b : a > b;
}

/** 按方向排好的目标结果（测试与「是否已排好」判断用） */
export function sortedBy(values: number[], order: Order): number[] {
  const out = [...values].sort((x, y) => x - y);
  return order === 'desc' ? out.reverse() : out;
}

export function loadOrder(storage?: Pick<Storage, 'getItem'> | null): Order {
  try {
    return normalizeOrder(storage?.getItem(ORDER_STORAGE_KEY));
  } catch {
    return 'asc';
  }
}

export function saveOrder(order: Order, storage?: Pick<Storage, 'setItem'> | null): void {
  try {
    storage?.setItem(ORDER_STORAGE_KEY, order);
  } catch {
    /* 存不下就算了 */
  }
}
