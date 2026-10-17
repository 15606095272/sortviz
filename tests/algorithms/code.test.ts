import { registerBuiltinAlgorithms } from '../../src/algorithms';
import { listAlgorithms, resetRegistry } from '../../src/core/registry';
import { CODE_LANGS, codeText, type CodeLangLine } from '../../src/core/code';
import { INPUT } from '../fixtures/golden';

interface CodeModule {
  id: string;
  pseudocode: readonly unknown[];
  code?: Record<string, readonly CodeLangLine[]>;
  run: (i: number[]) => unknown[];
}

const usedCodeLines = (mod: CodeModule): number[] => {
  const lines = (mod.run(INPUT) as Array<{ codeLine?: number }>)
    .map((s) => s.codeLine)
    .filter((n): n is number => typeof n === 'number');
  return [...new Set(lines)].sort((a, b) => a - b);
};

describe('真实代码：锚点覆盖', () => {
  registerBuiltinAlgorithms();

  it('所有模块都已迁移：每种语言覆盖全部语义行', () => {
    for (const mod of listAlgorithms() as unknown as CodeModule[]) {
      const code = mod.code;
      // C2 收口：不再允许「没有 code 就跳过」，缺 code 直接失败并报出模块 id
      expect(code, `${mod.id} 缺少 code：所有模块都必须有四语言真实代码`).toBeDefined();

      const used = usedCodeLines(mod);
      for (const lang of CODE_LANGS) {
        const lines = code![lang];
        expect(lines.length, `${mod.id}/${lang} 行数太少`).toBeGreaterThanOrEqual(5);

        // 该语言覆盖步骤流用到的全部 codeLine
        const anchors = new Set(lines.map((l) => l.anchor).filter((n): n is number => typeof n === 'number'));
        const missing = used.filter((n) => !anchors.has(n));
        expect(missing, `${mod.id}/${lang} 缺锚点`).toEqual([]);

        for (const line of lines) {
          // anchor 必须落在 1..pseudocode.length（越界 = 手滑写错行号）
          if (line.anchor !== undefined) {
            expect(line.anchor, `${mod.id}/${lang} anchor 越界`).toBeGreaterThanOrEqual(1);
            expect(line.anchor, `${mod.id}/${lang} anchor 越界`).toBeLessThanOrEqual(mod.pseudocode.length);
          }
          // 空串只允许出现在「纯分隔空行」上（无 anchor，形如 { text: '' }）；
          // 任何带 anchor 的语义行都必须是真实代码文本，只含空白的行一律不许。
          if (line.text === '' && line.anchor === undefined) continue;
          expect(line.text.trim(), `${mod.id}/${lang} 出现空行/空白行`).not.toBe('');
          expect(line.text, `${mod.id}/${lang} 出现 TODO`).not.toContain('TODO');
        }
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

  it('控制行都被高亮覆盖：伪代码里每个 for/while 行都至少被某一步的 codeLine 引用', () => {
    for (const mod of listAlgorithms()) {
      const used = new Set(
        (mod.run(INPUT) as Array<{ codeLine?: number }>)
          .map((s) => s.codeLine)
          .filter((n): n is number => typeof n === 'number'),
      );
      const control = mod.pseudocode.filter((l) => /\b(for|while)\b/.test(l.text)).map((l) => l.line);
      const missing = control.filter((n) => !used.has(n));
      expect(missing, `${mod.id} 未覆盖的控制行`).toEqual([]);
    }
  });
});

/** 已经支持「降序代码」的模块（按需求 b 分批迁移：先做 4 个简单模块；其它模块迁移时把 id 加进来） */
const DIRECTIONAL_MODULES = [
  'insertion',
  'binary-insertion',
  'shell',
  'bubble',
  'quick',
  'selection',
  'heap',
  'merge',
  'radix',
  'binary-search',
];

const codeModule = (id: string): CodeModule => {
  const mod = (listAlgorithms() as unknown as CodeModule[]).find((m) => m.id === id);
  expect(mod, `注册表里没有 ${id}`).toBeDefined();
  return mod!;
};

describe('真实代码：随排序方向变化', () => {
  // 本文件前面已经注册过一次，这里重置后再注册，避免「算法 id 重复」
  resetRegistry();
  registerBuiltinAlgorithms();

  it('方向敏感模块的每种语言都至少有一行 descText，且与原文不同（防漏写/防同文）', () => {
    for (const id of DIRECTIONAL_MODULES) {
      const mod = codeModule(id);
      expect(mod.code, `${id} 缺少 code`).toBeDefined();
      for (const lang of CODE_LANGS) {
        const lines = mod.code![lang];
        const overridden = lines.filter((l) => l.descText !== undefined);
        expect(
          overridden.length,
          `${id}/${lang} 一行 descText 都没写：降序代码会静默等于升序（读者被骗）`,
        ).toBeGreaterThan(0);
        for (const l of overridden) {
          expect(l.descText, `${id}/${lang} 的 descText 与原文一模一样，等于没写`).not.toBe(l.text);
        }
      }
    }
  });

  it('方向敏感模块：降序的代码文本块与升序不同，且升序逐字等于原文', () => {
    for (const id of DIRECTIONAL_MODULES) {
      const mod = codeModule(id);
      for (const lang of CODE_LANGS) {
        const lines = mod.code![lang];
        const asc = lines.map((l) => codeText(l, { order: 'asc', base: 0 })).join('\n');
        const desc = lines.map((l) => codeText(l, { order: 'desc', base: 0 })).join('\n');
        expect(desc, `${id}/${lang} 降序渲染出的代码与升序完全一样`).not.toBe(asc);
        expect(asc, `${id}/${lang} 升序文本漂移了`).toBe(lines.map((l) => l.text).join('\n'));
      }
    }
  });
});

/**
 * 已经补上「1 基代码」的模块（本批先做 4 个简单模块；其它模块迁移时把 id 加进来）。
 * 三条规则对 BASE_MODULES 全量生效——未迁移的模块加进白名单会立刻变红，这是护栏的本意。
 */
const BASE_MODULES = ['insertion', 'binary-insertion', 'shell', 'bubble'];

/** 四种组合的渲染结果（整块代码文本），用于「两两不同」的判定 */
const VIEWS = [
  { name: '0基·升序', view: { order: 'asc', base: 0 } },
  { name: '0基·降序', view: { order: 'desc', base: 0 } },
  { name: '1基·升序', view: { order: 'asc', base: 1 } },
  { name: '1基·降序', view: { order: 'desc', base: 1 } },
] as const;

describe('真实代码：随下标进制变化', () => {
  resetRegistry();
  registerBuiltinAlgorithms();

  it('进制敏感模块的每种语言都至少有一行 text1，且与 text 不同（防漏写/防同文）', () => {
    for (const id of BASE_MODULES) {
      const mod = codeModule(id);
      expect(mod.code, `${id} 缺少 code`).toBeDefined();
      for (const lang of CODE_LANGS) {
        const lines = mod.code![lang];
        const overridden = lines.filter((l) => l.text1 !== undefined);
        expect(
          overridden.length,
          `${id}/${lang} 一行 text1 都没写：1 基代码会静默等于 0 基（下标错位，读者被骗）`,
        ).toBeGreaterThan(0);
        for (const l of overridden) {
          expect(l.text1, `${id}/${lang} 的 text1 与 text 一模一样，等于没写`).not.toBe(l.text);
        }
      }
    }
  });

  it('同时声明 text1 与 descText 的行必须也有 descText1（否则 1 基·降序 会退化成 0 基·降序）', () => {
    for (const id of BASE_MODULES) {
      const mod = codeModule(id);
      for (const lang of CODE_LANGS) {
        for (const line of mod.code![lang]) {
          if (line.text1 === undefined || line.descText === undefined) continue;
          expect(
            line.descText1,
            `${id}/${lang} 行「${line.text.trim()}」既有 text1 又有 descText，却缺 descText1：1 基·降序 会拿到 0 基的下标`,
          ).toBeDefined();
          expect(line.descText1, `${id}/${lang} 的 descText1 与 text1 一样，方向没反`).not.toBe(line.text1);
        }
      }
    }
  });

  it('四种组合渲染出的代码文本两两不同（进制与方向都必须真的改变渲染结果）', () => {
    for (const id of BASE_MODULES) {
      const mod = codeModule(id);
      for (const lang of CODE_LANGS) {
        const lines = mod.code![lang];
        const rendered = new Map<string, string>(
          VIEWS.map(({ name, view }) => [name, lines.map((l) => codeText(l, view)).join('\n')] as [string, string]),
        );
        // 只需这四对：0升≠1升（进制生效）、0升≠0降（方向生效）、1升≠1降（1 基下方向仍生效）、0降≠1降（降序下进制仍生效）
        const pairs: Array<[string, string]> = [
          ['0基·升序', '1基·升序'],
          ['0基·升序', '0基·降序'],
          ['1基·升序', '1基·降序'],
          ['0基·降序', '1基·降序'],
        ];
        for (const [a, b] of pairs) {
          expect(rendered.get(a), `${id}/${lang}：${a} 与 ${b} 渲染出的代码完全一样`).not.toBe(rendered.get(b));
        }
      }
    }
  });
});
