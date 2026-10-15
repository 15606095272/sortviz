import type { Step } from './step';
import type { ViewState } from './replay';

export type ViewKind = 'array' | 'structure' | 'bar';
export type AlgorithmCategory = 'insert' | 'swap' | 'select' | 'merge' | 'radix' | 'search' | 'tree';

export interface CodeLine { line: number; indent: number; text: string }
export interface LocalizedText { zh: string; en: string }
export interface Complexity { best: string; avg: string; worst: string; space: string }

export interface AlgorithmModule {
  id: string;
  name: LocalizedText;
  category: AlgorithmCategory;
  stable: boolean;
  complexity: Complexity;
  pseudocode: CodeLine[];
  defaultViews: readonly ViewKind[];      // 只读：算法文件里可用 `as const` 而不必强转
  run(data: number[]): Step[];
}

export interface ViewContext { data: number[]; algorithmId: string }

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
