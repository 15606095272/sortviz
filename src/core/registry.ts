import type { Step } from './step';
import type { Order } from './order';
import type { ViewState } from './replay';
import type { IndexBase } from './index-base';

export type ViewKind = 'array' | 'structure' | 'bar';
export type AlgorithmCategory = 'insert' | 'swap' | 'select' | 'merge' | 'radix' | 'search' | 'tree';

export interface CodeLine { line: number; indent: number; text: string }
export interface LocalizedText { zh: string; en: string }
export interface Complexity { best: string; avg: string; worst: string; space: string }

/**
 * 可选的运行参数：order = 排序方向（所有模块通用，缺省升序）；target = 查找目标（仅查找类用）。
 * 契约仍是「一个输入数组进、一个步骤流出」——多出来的只是可选项，run(data) 照旧可用。
 */
export interface RunOptions { order?: Order; target?: number }

export interface AlgorithmModule {
  id: string;
  name: LocalizedText;
  category: AlgorithmCategory;
  stable: boolean;
  complexity: Complexity;
  pseudocode: CodeLine[];
  defaultViews: readonly ViewKind[];      // 只读：算法文件里可用 `as const` 而不必强转
  run(data: number[], options?: RunOptions): Step[];
}

// indexBase 可选：既有测试与装配层大量构造 { data, algorithmId }，缺省视作 0 基
export interface ViewContext { data: number[]; algorithmId: string; indexBase?: IndexBase }

export interface ViewModule {
  kind: ViewKind;
  mount(host: HTMLElement, ctx: ViewContext): void;
  render(state: ViewState, ctx: ViewContext): void;
  destroy(): void;
}

const algorithmRegistry = new Map<string, AlgorithmModule>();
const viewRegistry = new Map<ViewKind, ViewModule>();
let registrationOrder: string[] = [];

export function registerAlgorithm(mod: AlgorithmModule): void {
  if (algorithmRegistry.has(mod.id)) throw new Error(`算法 id 重复：${mod.id}`);
  algorithmRegistry.set(mod.id, mod);
  registrationOrder.push(mod.id);
}

export function registerView(mod: ViewModule): void {
  if (viewRegistry.has(mod.kind)) throw new Error(`视图 kind 重复：${mod.kind}`);
  viewRegistry.set(mod.kind, mod);
}

export function listAlgorithms(): AlgorithmModule[] {
  return registrationOrder.map((id) => algorithmRegistry.get(id)!);
}

export function getAlgorithm(id: string): AlgorithmModule {
  const mod = algorithmRegistry.get(id);
  if (!mod) throw new Error(`未知算法 id：${id}（可选：${registrationOrder.join(', ')}）`);
  return mod;
}

export function getView(kind: ViewKind): ViewModule | undefined {
  return viewRegistry.get(kind);
}

/** 仅测试使用：清空注册表，避免用例间互相污染 */
export function resetRegistry(): void {
  algorithmRegistry.clear();
  viewRegistry.clear();
  registrationOrder = [];
}
