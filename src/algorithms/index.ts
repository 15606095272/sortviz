import { registerAlgorithm, type AlgorithmModule } from '../core/registry';
import { insertion } from './insertion';
import { binaryInsertion } from './binary-insertion';
import { shell } from './shell';
import { bubble } from './bubble';
import { quick } from './quick';
import { selection } from './selection';
import { heap } from './heap';
import { merge } from './merge';
import { radix } from './radix';
import { binarySearch } from './binary-search';

/** 界面顺序 = 这里的顺序。加一个算法：写模块文件 → 上面加 import → 这里加一项。 */
export const BUILTIN_ORDER = [
  'insertion', 'binary-insertion', 'shell', 'bubble', 'quick',
  'selection', 'heap', 'merge', 'radix', 'binary-search',
] as const;

const MODULES: Record<string, AlgorithmModule> = {
  insertion, 'binary-insertion': binaryInsertion, shell, bubble, quick,
  selection, heap, merge, radix, 'binary-search': binarySearch,
};

export function registerBuiltinAlgorithms(): void {
  for (const id of BUILTIN_ORDER) {
    const mod = MODULES[id];
    if (!mod) throw new Error(`内置算法清单里有未注册的 id：${id}`);
    registerAlgorithm(mod);
  }
}
