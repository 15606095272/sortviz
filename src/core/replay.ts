import type { MarkLabel, Step, Stats } from './step';

/**
 * 结构视图（调用栈/堆大小/标记/辅助数组）与数据视图共用的渲染状态。
 * 由 applyStep 逐步推进，replay 从任意前缀重建。
 */
export interface ViewState {
  data: number[];
  marks: Map<number, Set<MarkLabel>>;
  callStack: [number, number][];
  heapSize: number | null;
  aux: (number | null)[] | null;
  activeIndices: number[];
  sorted: Set<number>;
  lastNote: string;
  lastCodeLine: number;
  /**
   * 累积各步骤带出的变量值：每步 step.vars 浅合并进来，同名键后写覆盖先写。
   * 没有算法发 vars 时是空对象（始终存在，不会是 null）。
   */
  vars: Record<string, number>;
}

/** 一趟（外层循环一轮）结束时的数据快照 */
export interface PassRecord { pass: number; data: number[] }

export function createViewState(data: number[]): ViewState {
  return {
    data: [...data], marks: new Map(), callStack: [], heapSize: null,
    aux: null, activeIndices: [], sorted: new Set(), lastNote: '', lastCodeLine: 0,
    vars: {},
  };
}

/**
 * 纯函数：返回应用了一步之后的新状态，绝不改动入参 state。
 * 可变容器（marks/callStack/sorted/aux）都做深/浅拷贝后再改。
 */
export function applyStep(state: ViewState, step: Step): ViewState {
  const next: ViewState = {
    ...state,
    data: [...state.data],
    marks: new Map(Array.from(state.marks, ([k, v]) => [k, new Set(v)] as const)),
    callStack: state.callStack.map((r) => [r[0], r[1]] as [number, number]),
    sorted: new Set(state.sorted),
    aux: state.aux ? [...state.aux] : null,
    activeIndices: [],
    vars: { ...state.vars },
  };

  switch (step.kind) {
    case 'compare':
    case 'auxRead':
      // 高亮当前参与运算的两个（组）下标；下一步默认清空
      next.activeIndices = [...(step.indices ?? [])];
      break;
    case 'swap': {
      const [i, j] = step.indices ?? [];
      const tmp = next.data[i]; next.data[i] = next.data[j]; next.data[j] = tmp;
      break;
    }
    case 'assign':
      next.data[(step.indices ?? [0])[0]] = step.value ?? 0;
      break;
    case 'mark': {
      const label = step.label!;
      // range 进栈 = 递归树的一层；heap 用 range[1] 当堆大小
      if (label === 'range' && step.range) { next.callStack.push([step.range[0], step.range[1]]); break; }
      if (label === 'heap' && step.range) { next.heapSize = step.range[1]; break; }
      for (const i of step.indices ?? []) {
        const set = next.marks.get(i) ?? new Set<MarkLabel>();
        set.add(label);
        next.marks.set(i, set);
        if (label === 'sorted') next.sorted.add(i);
      }
      break;
    }
    case 'unmark': {
      const label = step.label!;
      if (label === 'range') { next.callStack.pop(); break; }
      if (label === 'heap') { next.heapSize = null; break; }
      for (const i of step.indices ?? []) {
        next.marks.get(i)?.delete(label);
        if (label === 'sorted') next.sorted.delete(i);
      }
      break;
    }
    case 'auxWrite': {
      // 首次写入时才按主数组长度建辅助数组（归并/计数排序用）
      const aux = next.aux ?? new Array<number | null>(next.data.length).fill(null);
      aux[(step.indices ?? [0])[0]] = step.value ?? null;
      next.aux = aux;
      break;
    }
    case 'note':
    case 'passEnd':
      break;
  }

  // 只有「带值」的步骤才刷新底部解说与代码行高亮
  if (step.note !== undefined) next.lastNote = step.note;
  if (step.codeLine !== undefined) next.lastCodeLine = step.codeLine;
  // 带 vars 的步骤把变量值累积进状态（浅合并、同名键后写覆盖先写；不改动原 step 对象）
  if (step.vars) next.vars = { ...next.vars, ...step.vars };
  return next;
}

/**
 * 游标语义：upto = k 表示「前 k 步已执行完」，k ∈ [0, steps.length]。
 * 越界自动夹紧，便于拖进度条时不写边界判断。
 */
export function replay(data: number[], steps: Step[], upto: number): ViewState {
  let state = createViewState(data);
  const end = Math.max(0, Math.min(upto, steps.length));
  for (let i = 0; i < end; i++) state = applyStep(state, steps[i]);
  return state;
}

/** 累加前 upto 步自带的统计量（408 口径：交换=3 移动，比较=1） */
export function deriveStats(steps: Step[], upto: number): Stats {
  const total: Stats = { compare: 0, swap: 0, move: 0 };
  const end = Math.max(0, Math.min(upto, steps.length));
  for (let i = 0; i < end; i++) {
    const s = steps[i].stats;
    if (!s) continue;
    total.compare += s.compare ?? 0;
    total.swap += s.swap ?? 0;
    total.move += s.move ?? 0;
  }
  return total;
}

/** 每趟结果来自 passEnd 快照，趟次从 1 递增（不做排序校验，忠实回放） */
export function derivePasses(steps: Step[], upto: number): PassRecord[] {
  const out: PassRecord[] = [];
  const end = Math.max(0, Math.min(upto, steps.length));
  for (let i = 0; i < end; i++) {
    const s = steps[i];
    if (s.kind === 'passEnd' && s.snapshot) out.push({ pass: out.length + 1, data: [...s.snapshot] });
  }
  return out;
}
