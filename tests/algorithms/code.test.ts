import { registerBuiltinAlgorithms } from '../../src/algorithms';
import { listAlgorithms } from '../../src/core/registry';
import { CODE_LANGS } from '../../src/core/code';
import { INPUT } from '../fixtures/golden';

const usedCodeLines = (mod: { run: (i: number[]) => unknown[] }): number[] => {
  const lines = (mod.run(INPUT) as Array<{ codeLine?: number }>)
    .map((s) => s.codeLine)
    .filter((n): n is number => typeof n === 'number');
  return [...new Set(lines)].sort((a, b) => a - b);
};

describe('真实代码：锚点覆盖', () => {
  registerBuiltinAlgorithms();

  it('已迁移（有 code）的模块：每种语言都覆盖步骤用到的全部语义行', () => {
    for (const mod of listAlgorithms()) {
      const code = (mod as { code?: Record<string, Array<{ text: string; anchor?: number }>> }).code;
      if (!code) continue; // 未迁移的模块回落到伪代码，C2 会补齐
      const used = usedCodeLines(mod as { run: (i: number[]) => unknown[] });
      for (const lang of CODE_LANGS) {
        const anchors = new Set(code[lang].map((l) => l.anchor).filter((n): n is number => typeof n === 'number'));
        const missing = used.filter((n) => !anchors.has(n));
        expect(missing, `${mod.id}/${lang} 缺锚点`).toEqual([]);
        expect(code[lang].length, `${mod.id}/${lang} 不能只有空行`).toBeGreaterThan(0);
      }
    }
  });

  it('插入排序已完成迁移（C 版有 7 个锚点，覆盖比较/移位/落位）', () => {
    const insertion = listAlgorithms().find((m) => m.id === 'insertion')!;
    const code = (insertion as { code?: Record<string, Array<{ anchor?: number }>> }).code;
    expect(code).toBeDefined();
    const anchors = new Set(code!.c.map((l) => l.anchor).filter((n): n is number => typeof n === 'number'));
    expect([...anchors].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
