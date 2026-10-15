/** 界面下标进制：内部一律 0 基，展示时按开关换算（408 教材以 1 基叙述） */
export type IndexBase = 0 | 1;

export function formatIndex(index: number, base: IndexBase): number {
  return base === 1 ? index + 1 : index;
}

/** 把动作说明里的 `a[3]` / `A[3]` 形式下标按开关改写（内部文本一律 0 基） */
export function rewriteIndices(text: string, base: IndexBase): string {
  if (base === 0) return text;
  return text.replace(/\b([aA])\[(\d+)\]/g, (_m, name: string, digits: string) => `${name}[${Number(digits) + 1}]`);
}
