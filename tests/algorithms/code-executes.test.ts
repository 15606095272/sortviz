import { registerBuiltinAlgorithms } from '../../src/algorithms';
import { listAlgorithms, resetRegistry } from '../../src/core/registry';
import { codeText, type CodeLangLine } from '../../src/core/code';

/**
 * 仓库的 tsconfig 只挂了 `types: ["vitest/globals"]`（没有 @types/node），
 * 而本文件只需要 node 内置的 child_process。为了不为一个测试新增依赖，
 * 这里用「非字面量说明符的动态 import」把它当 any 取进来（类型由本地接口兜住）。
 */
type SpawnResult = { status: number | null; stdout: string; stderr: string; error?: Error };
type SpawnSync = (command: string, args: readonly string[], options: { encoding: 'utf8' }) => SpawnResult;

const nodeChildProcess = (await import(/* @vite-ignore */ 'node:child_process' as string)) as {
  spawnSync: SpawnSync;
};
const spawnSync: SpawnSync = nodeChildProcess.spawnSync;

/**
 * 代码面板的可执行性验收：面板里显示的 Python 代码不是「看着像」，
 * 而是真能被 python3 跑起来，并在「升序/降序 × 0 基/1 基」四种口径下
 * 给出与黄金夹具一致的结果。
 *
 * 数据用 8 个元素（含重复值 49，能照出不稳定/漏比较）：
 *   0 基：[49, 38, 65, 97, 76, 13, 27, 49]
 *   1 基：[None, 49, 38, 65, 97, 76, 13, 27, 49]   ← a[0] 是教材里的占位
 */

interface CodeModule {
  id: string;
  name: { zh: string; en: string };
  code?: Record<string, readonly CodeLangLine[]>;
}

const DATA = [49, 38, 65, 97, 76, 13, 27, 49] as const;

const ASC = [...DATA].sort((x, y) => x - y);
const DESC = [...DATA].sort((x, y) => y - x);

const ASC_TEXT = ASC.join(' ');
const DESC_TEXT = DESC.join(' ');

type Base = 0 | 1;
type Order = 'asc' | 'desc';

const BASE_LABEL = (base: Base): string => (base === 0 ? '0基' : '1基');
const ORDER_LABEL = (order: Order): string => (order === 'asc' ? '升序' : '降序');

/** python 里的数组字面量：1 基时用 None 占住 a[0] */
const literal = (base: Base, values: readonly number[] = DATA): string =>
  base === 0 ? `[${values.join(', ')}]` : `[None, ${values.join(', ')}]`;

/**
 * 9 个排序模块的真实签名。quick 是唯一需要调用方传初始上下界的模块，
 * 所以它的调用串按进制变化（0 基 0..len-1，1 基 1..len-1）。
 */
interface SortTarget {
  id: string;
  name: string;
  call: (base: Base) => string;
}

const SORT_TARGETS: readonly SortTarget[] = [
  { id: 'insertion', name: '直接插入排序', call: () => 'insertion_sort(a)' },
  { id: 'binary-insertion', name: '折半插入排序', call: () => 'binary_insertion_sort(a)' },
  { id: 'shell', name: '希尔排序', call: () => 'shell_sort(a)' },
  { id: 'bubble', name: '冒泡排序', call: () => 'bubble_sort(a)' },
  { id: 'quick', name: '快速排序', call: (base) => `quick_sort(a, ${base}, len(a) - 1)` },
  { id: 'selection', name: '简单选择排序', call: () => 'selection_sort(a)' },
  { id: 'heap', name: '堆排序', call: () => 'heap_sort(a)' },
  { id: 'merge', name: '归并排序', call: () => 'merge_sort(a)' },
  { id: 'radix', name: '基数排序', call: () => 'radix_sort(a)' },
];

const BASE_MODULES = [...SORT_TARGETS.map((t) => t.id), 'binary-search'];

const moduleById = (id: string): CodeModule => {
  const mod = (listAlgorithms() as unknown as CodeModule[]).find((m) => m.id === id);
  expect(mod, `注册表里没有 ${id}`).toBeDefined();
  return mod!;
};

/** 面板文本 = 该口径下逐行渲染出的 python 源码（不加任何额外缩进） */
const pythonOf = (id: string, order: Order, base: Base): string => {
  const mod = moduleById(id);
  expect(mod.code, `${id} 缺少 code`).toBeDefined();
  const lines = mod.code!.python;
  expect(lines.length, `${id} 没有 python 代码`).toBeGreaterThan(0);
  return lines.map((l) => codeText(l, { order, base })).join('\n');
};

/** 拼一个可独立运行的脚本：代码块 + 数据 + 调用 + 打印结果 */
const scriptOf = (source: string, base: Base, call: string, printExpr: string): string =>
  `${source}\n\n\na = ${literal(base)}\n${call}\nprint(${printExpr})\n`;

/** 真实执行；失败时把 stderr/stdout 与源码一起抛出来，便于区分「代码错」和「拼接错」 */
const runPython = (source: string, base: Base, call: string, printExpr: string): string => {
  const script = scriptOf(source, base, call, printExpr);
  const res = spawnSync('python3', ['-c', script], { encoding: 'utf8' });
  if (res.error) throw res.error;
  const stdout = (res.stdout ?? '').trim();
  const stderr = (res.stderr ?? '').trim();
  expect(
    res.status,
    `python3 非零退出（status=${res.status}）\n--- stderr ---\n${stderr}\n--- stdout ---\n${stdout}\n--- 执行的代码 ---\n${script}`,
  ).toBe(0);
  expect(stderr, `python3 打了警告/异常输出：\n${stderr}\n--- 执行的代码 ---\n${script}`).toBe('');
  return stdout;
};

/** 输出必须是「升序/降序 + 8 个数字」的精确串，多一个空格都算错 */
const expectSequence = (actual: string, expected: string, context: string, source: string, base: Base): void => {
  expect(actual, `${context}：排序结果不对\n期望：${expected}\n实际：${actual}\n--- 面板代码 ---\n${source}\n--- 数据 ---\na = ${literal(base)}`).toBe(expected);
};

const PY_PROBE = spawnSync('python3', ['--version'], { encoding: 'utf8' });
const HAS_PYTHON = !PY_PROBE.error;
export const PYTHON_VERSION = `${(PY_PROBE.stdout ?? '').trim() || (PY_PROBE.stderr ?? '').trim()}`;

// 没有 python3 的机器上整组跳过（不是失败）：本文件验证的是「代码可执行」，
// 缺解释器属于环境缺件，不该让 CI 红。
const suite = HAS_PYTHON ? describe : describe.skip;

suite('代码面板可执行性：python3 真跑四种口径', () => {
  resetRegistry();
  registerBuiltinAlgorithms();

  it('注册表里正好有 10 个模块需要验证（防止有模块偷偷漏掉）', () => {
    for (const id of BASE_MODULES) {
      expect(moduleById(id).code?.python, `${id} 缺 python 代码`).toBeDefined();
    }
    expect(BASE_MODULES.length).toBe(10);
  });

  for (const target of SORT_TARGETS) {
    describe(target.name, () => {
      for (const order of ['asc', 'desc'] as const) {
        for (const base of [0, 1] as const) {
          const label = `${target.name} · ${ORDER_LABEL(order)} · ${BASE_LABEL(base)}`;
          it(label, () => {
            const source = pythonOf(target.id, order, base);
            const printExpr = base === 0 ? "' '.join(map(str, a))" : "' '.join(map(str, a[1:]))";
            const actual = runPython(source, base, target.call(base), printExpr);
            const expected = order === 'asc' ? ASC_TEXT : DESC_TEXT;
            expectSequence(actual, expected, label, source, base);
          });
        }
      }
    });
  }

  describe('折半查找（返回下标）', () => {
    const target = ASC[3]; // 升序：49；降序下的 sorted[3] 也是 49
    for (const order of ['asc', 'desc'] as const) {
      for (const base of [0, 1] as const) {
        const label = `折半查找 · ${ORDER_LABEL(order)} · ${BASE_LABEL(base)}`;
        it(label, () => {
          const sorted = order === 'asc' ? ASC : DESC;
          // 断言前提：要找的就是第 4 个元素（0 基下标 3 / 1 基下标 4）
          expect(sorted[3], `${label}：夹具第 4 个元素应当唯一可比对`).toBe(49);
          const source = pythonOf('binary-search', order, base);
          const script = `${source}\n\n\na = ${literal(base, sorted)}\nprint(binary_search(a, ${target}))\n`;
          const res = spawnSync('python3', ['-c', script], { encoding: 'utf8' });
          if (res.error) throw res.error;
          const stdout = (res.stdout ?? '').trim();
          const stderr = (res.stderr ?? '').trim();
          expect(
            res.status,
            `python3 非零退出（status=${res.status}）\n--- stderr ---\n${stderr}\n--- 执行的代码 ---\n${script}`,
          ).toBe(0);
          const expectedIndex = base === 0 ? 3 : 4;
          expect(
            stdout,
            `${label}：返回下标不对（期望 ${expectedIndex}）\n--- 面板代码 ---\n${source}\n--- 数据 ---\na = ${literal(base, sorted)}\ntarget = ${target}`,
          ).toBe(String(expectedIndex));
        });
      }
    }
  });
});
