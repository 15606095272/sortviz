import { registerAlgorithm } from '../core/registry';
import { insertion } from './insertion';
import { binaryInsertion } from './binary-insertion';
import { shell } from './shell';
import { bubble } from './bubble';
import { quick } from './quick';

export function registerBuiltinAlgorithms(): void {
  registerAlgorithm(insertion);
  registerAlgorithm(binaryInsertion);
  registerAlgorithm(shell);
  registerAlgorithm(bubble);
  registerAlgorithm(quick);
}
