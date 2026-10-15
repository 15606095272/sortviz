export type MarkLabel = 'sorted' | 'pivot' | 'range' | 'heap' | 'active' | 'aux';

export type StepKind =
  | 'compare' | 'swap' | 'assign' | 'mark' | 'unmark'
  | 'auxWrite' | 'auxRead' | 'note' | 'passEnd';

export interface Stats { compare: number; swap: number; move: number }

export interface Step {
  kind: StepKind;
  indices?: number[];
  value?: number;
  label?: MarkLabel;
  range?: [number, number];
  codeLine?: number;
  note?: string;
  snapshot?: number[];
  stats?: Partial<Stats>;
}

export function compareStep(i: number, j: number, codeLine: number, note: string): Step {
  return { kind: 'compare', indices: [i, j], codeLine, note, stats: { compare: 1 } };
}

/** 408 口径：一次交换 = 3 次移动 */
export function swapStep(i: number, j: number, codeLine: number, note: string): Step {
  return { kind: 'swap', indices: [i, j], codeLine, note, stats: { swap: 1, move: 3 } };
}

/** 一次赋值 = 1 次移动（插入排序的移位、归并的回填） */
export function assignStep(i: number, value: number, codeLine: number, note: string): Step {
  return { kind: 'assign', indices: [i], value, codeLine, note, stats: { move: 1 } };
}

export function markStep(label: MarkLabel, indices: number[], codeLine: number, note?: string, range?: [number, number]): Step {
  return { kind: 'mark', label, indices, range, codeLine, note };
}

export function unmarkStep(label: MarkLabel, indices: number[], codeLine: number, note?: string): Step {
  return { kind: 'unmark', label, indices, codeLine, note };
}

export function auxWriteStep(i: number, value: number, codeLine: number, note: string): Step {
  return { kind: 'auxWrite', indices: [i], value, codeLine, note };
}

export function auxReadStep(i: number, codeLine: number, note: string): Step {
  return { kind: 'auxRead', indices: [i], codeLine, note };
}

export function noteStep(note: string, codeLine: number): Step {
  return { kind: 'note', note, codeLine };
}

export function passEndStep(snapshot: number[], codeLine: number, note: string): Step {
  return { kind: 'passEnd', snapshot: [...snapshot], codeLine, note };
}
