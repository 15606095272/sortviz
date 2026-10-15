import { registerAlgorithm } from '../core/registry';
import { insertion } from './insertion';
import { bubble } from './bubble';
import { quick } from './quick';

export function registerBuiltinAlgorithms(): void {
  registerAlgorithm(insertion);
  registerAlgorithm(bubble);
  registerAlgorithm(quick);
}
