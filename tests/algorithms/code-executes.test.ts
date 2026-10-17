import { registerBuiltinAlgorithms } from '../../src/algorithms';
import { listAlgorithms, resetRegistry } from '../../src/core/registry';
import { codeText, type CodeLang, type CodeLangLine } from '../../src/core/code';

/**
 * 仓库的 tsconfig 只挂了 `types: ["vitest/globals"]`（没有 @types/node），
 * 而本文件只需要 node 内置的 child_process / fs。为了不为一个测试新增依赖，
 * 这里用「非字面量说明符的动态 import」把它们当 any 取进来（类型由本地接口兜住）。
 */
type SpawnResult = { status: number | null; stdout: string; stderr: string; error?: Error };
type SpawnOptions = { encoding: 'utf8'; cwd?: string };
type SpawnSync = (command: string, args: readonly string[], options: SpawnOptions) => SpawnResult;

const nodeChildProcess = (await import(/* @vite-ignore */ 'node:child_process' as string)) as {
  spawnSync: SpawnSync;
};
const spawnSync: SpawnSync = nodeChildProcess.spawnSync;

interface FsLike {
  mkdtempSync(prefix: string): string;
  writeFileSync(path: string, data: string, encoding: 'utf8'): void;
  rmSync(path: string, options: { recursive: boolean; force: boolean }): void;
}
const nodeFs = (await import(/* @vite-ignore */ 'node:fs' as string)) as FsLike;

/**
 * 代码面板的可执行性验收：面板里显示的代码不是「看着像」，而是真能被
 * cc / clang++ / javac+java / python3 编译（解释）并跑起来，在
 * 「升序/降序 × 0 基/1 基」四种口径下给出与黄金夹具一致的结果。
 *
 * 默认只跑 python3（`npm test` 保持轻快）；`VERIFY_ALL_LANGS=1` 时四语言全跑，
 * 即 `npm run verify:code`。缺工具链的语言整组 it.skip，不算失败。
 *
 * 数据用 8 个元素（含重复值 49，能照出不稳定/漏比较）：
 *   0 基：[49, 38, 65, 97, 76, 13, 27, 49]
 *   1 基：[0, 49, 38, 65, 97, 76, 13, 27, 49]   ← a[0] 是教材里的占位
 */

interface CodeModule {
  id: string;
  name: { zh: string; en: string };
  code?: Record<string, readonly CodeLangLine[]>;
}

const DATA = [49, 38, 65, 97, 76, 13, 27, 49] as const;
const N = DATA.length; // 8：0 基是元素个数，1 基刚好又是「最后一个下标」

const ASC = [...DATA].sort((x, y) => x - y);
const DESC = [...DATA].sort((x, y) => y - x);

const ASC_TEXT = ASC.join(' ');
const DESC_TEXT = DESC.join(' ');

type Base = 0 | 1;
type Order = 'asc' | 'desc';
type LangKey = CodeLang;

const BASE_LABEL = (base: Base): string => (base === 0 ? '0基' : '1基');
const ORDER_LABEL = (order: Order): string => (order === 'asc' ? '升序' : '降序');

const valuesOf = (base: Base, values: readonly number[] = DATA): readonly number[] =>
  base === 0 ? values : [0, ...values];

/** python 里的数组字面量：1 基时用 None 占住 a[0] */
const literal = (base: Base, values: readonly number[] = DATA): string =>
  base === 0 ? `[${values.join(', ')}]` : `[None, ${values.join(', ')}]`;

/** C/C++/Java 的数组初始化列表：1 基时用 0 占住 a[0] */
const initList = (base: Base, values: readonly number[] = DATA): string =>
  `{${valuesOf(base, values).join(', ')}}`;

/**
 * 每个模块在四种语言里的**调用表达式**（不含行尾分号）。
 * 只有 quick 需要调用方传初始上下界；C 的折半查找还要多传一个 n。
 */
interface Target {
  id: string;
  name: string;
  c: (base: Base) => string;
  cpp: (base: Base) => string;
  java: (base: Base) => string;
  python: (base: Base) => string;
  /** C 版的前置声明（quick 的 partition 定义在 quickSort 之后，C 需要先声明） */
  cDecl?: string;
  /** C++ 版的前置声明（同上：partition 定义在 quickSort 之后） */
  cppDecl?: string;
}

const sortTarget = (
  id: string,
  name: string,
  fn: { c: string; cpp: string; java: string; python: string },
  /** 个别模块的 C++ 签名收裸数组/额外参数，需要单独写调用串 */
  cppCall?: string,
): Target => ({
  id,
  name,
  c: () => `${fn.c}(a, n)`,
  cpp: () => cppCall ?? `${fn.cpp}(a)`,
  java: () => `${fn.java}(a)`,
  python: () => `${fn.python}(a)`,
});

const SORT_TARGETS: readonly Target[] = [
  // C++ 的 insertionSort 收的是裸数组（int a[], int n），不是 vector——
  // 这正是面板上写的签名，harness 用 a.data() 对接即可。
  sortTarget(
    'insertion',
    '直接插入排序',
    { c: 'insertionSort', cpp: 'insertionSort', java: 'insertionSort', python: 'insertion_sort' },
    'insertionSort(a.data(), n)',
  ),
  sortTarget('binary-insertion', '折半插入排序', {
    c: 'binaryInsertionSort',
    cpp: 'binaryInsertionSort',
    java: 'binaryInsertionSort',
    python: 'binary_insertion_sort',
  }),
  sortTarget('shell', '希尔排序', { c: 'shellSort', cpp: 'shellSort', java: 'shellSort', python: 'shell_sort' }),
  sortTarget('bubble', '冒泡排序', { c: 'bubbleSort', cpp: 'bubbleSort', java: 'bubbleSort', python: 'bubble_sort' }),
  {
    id: 'quick',
    name: '快速排序',
    cDecl: 'int partition(int a[], int low, int high);',
    cppDecl: 'int partition(std::vector<int>& a, int low, int high);',
    // 0 基 [0, n-1]；1 基 [1, n]（n 是最后一个下标）
    c: (base) => `quickSort(a, ${base}, ${base === 0 ? 'n - 1' : 'n'})`,
    cpp: (base) => `quickSort(a, ${base}, (int)a.size() - 1)`,
    java: (base) => `quickSort(a, ${base}, a.length - 1)`,
    python: (base) => `quick_sort(a, ${base}, len(a) - 1)`,
  },
  sortTarget('selection', '简单选择排序', {
    c: 'selectionSort',
    cpp: 'selectionSort',
    java: 'selectionSort',
    python: 'selection_sort',
  }),
  sortTarget('heap', '堆排序', { c: 'heapSort', cpp: 'heapSort', java: 'heapSort', python: 'heap_sort' }),
  sortTarget('merge', '归并排序', { c: 'mergeSort', cpp: 'mergeSort', java: 'mergeSort', python: 'merge_sort' }),
  sortTarget('radix', '基数排序', { c: 'radixSort', cpp: 'radixSort', java: 'radixSort', python: 'radix_sort' }),
];

const SEARCH_TARGET: Target = {
  id: 'binary-search',
  name: '折半查找（返回下标）',
  c: () => 'binarySearch(a, n, target)',
  cpp: () => 'binarySearch(a, target)',
  java: () => 'binarySearch(a, target)',
  python: () => 'binary_search(a, target)',
};

const TARGETS: readonly Target[] = [...SORT_TARGETS, SEARCH_TARGET];

const moduleById = (id: string): CodeModule => {
  const mod = (listAlgorithms() as unknown as CodeModule[]).find((m) => m.id === id);
  expect(mod, `注册表里没有 ${id}`).toBeDefined();
  return mod!;
};

/** 面板文本 = 该口径下逐行渲染出的源码（不加任何额外缩进） */
const sourceOf = (id: string, lang: LangKey, order: Order, base: Base): string => {
  const mod = moduleById(id);
  expect(mod.code, `${id} 缺少 code`).toBeDefined();
  const lines = mod.code![lang];
  expect(lines?.length, `${id} 没有 ${lang} 代码`).toBeGreaterThan(0);
  return lines.map((l) => codeText(l, { order, base })).join('\n');
};

// ───────────────────────── 构建「可独立运行的程序」 ─────────────────────────

interface ProgramOptions {
  source: string;
  base: Base;
  /** 调用表达式（不含分号） */
  expr: string;
  /** true = 打印返回值（折半查找）；false = 打印排好序的数组 */
  asIndex?: boolean;
  /** asIndex 时要找的目标值 */
  target?: number;
  /** C 的前置声明 */
  cDecl?: string;
  /** C++ 的前置声明 */
  cppDecl?: string;
  /** 喂给程序的数组（折半查找要传排好序的那份；默认 DATA） */
  values?: readonly number[];
}

const C_INCLUDES = '#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n';
const CPP_INCLUDES = '#include <vector>\n#include <algorithm>\n#include <iostream>\n';

const programC = ({ source, base, expr, asIndex, target, cDecl, values }: ProgramOptions): string => {
  const lo = base;
  const hi = N + base; // 打印 [base, N+base) 这 8 个元素
  const body = asIndex
    ? `    int target = ${target};\n    printf("%d\\n", ${expr});`
    : `    ${expr};\n    for (int i = ${lo}; i < ${hi}; i++) printf("%d ", a[i]);\n    printf("\\n");`;
  return `${C_INCLUDES}${cDecl ? `${cDecl}\n` : ''}\n${source}\n\nint main(void) {\n    int n = ${N};\n    int a[${N + 1}] = ${initList(base, values)};\n${body}\n    return 0;\n}\n`;
};

const programCpp = ({ source, base, expr, asIndex, target, values, cppDecl }: ProgramOptions): string => {
  const lo = base;
  const body = asIndex
    ? `    int target = ${target};\n    std::cout << ${expr} << std::endl;`
    : `    ${expr};\n    for (int i = ${lo}; i < (int)a.size(); ++i) std::cout << a[i] << " ";\n    std::cout << std::endl;`;
  return `${CPP_INCLUDES}${cppDecl ? `${cppDecl}\n` : ''}\n${source}\n\nint main() {\n    std::vector<int> a = ${initList(base, values)};\n    [[maybe_unused]] int n = ${N};\n${body}\n    return 0;\n}\n`;
};

const programJava = ({ source, base, expr, asIndex, target, values }: ProgramOptions): string => {
  const lo = base;
  const body = asIndex
    ? `        int target = ${target};\n        System.out.println(new T().${expr});`
    : `        new T().${expr};\n        for (int i = ${lo}; i < a.length; i++) System.out.print(a[i] + " ");\n        System.out.println();`;
  const indented = source
    .split('\n')
    .map((l) => (l.trim() === '' ? l : `    ${l}`))
    .join('\n');
  return `import java.util.*;\n\npublic class T {\n${indented}\n\n    public static void main(String[] args) {\n        int[] a = ${initList(base, values)};\n${body}\n    }\n}\n`;
};

const programPython = ({ source, base, expr, asIndex, target, values }: ProgramOptions): string =>
  asIndex
    ? `${source}\n\n\na = ${literal(base, values)}\ntarget = ${target}\nprint(${expr})\n`
    : `${source}\n\n\na = ${literal(base, values)}\n${expr}\nprint(' '.join(map(str, a[${base}:])))\n`;

const programFor = (lang: LangKey, opts: ProgramOptions): string => {
  if (lang === 'c') return programC(opts);
  if (lang === 'cpp') return programCpp(opts);
  if (lang === 'java') return programJava(opts);
  return programPython(opts);
};

// ───────────────────────── 工具链探测与真实执行 ─────────────────────────

const probe = (cmd: string, args: readonly string[]): { ok: boolean; version: string } => {
  try {
    const res = spawnSync(cmd, args, { encoding: 'utf8' });
    if (res.error) return { ok: false, version: '' };
    const version = `${(res.stdout ?? '').trim() || (res.stderr ?? '').trim()}`.split('\n')[0] ?? '';
    return { ok: res.status === 0, version };
  } catch {
    return { ok: false, version: '' };
  }
};

const PROBES = {
  c: probe('cc', ['--version']),
  cpp: probe('clang++', ['--version']),
  java: (() => {
    const javac = probe('javac', ['-version']);
    const java = probe('java', ['-version']);
    return { ok: javac.ok && java.ok, version: `${javac.version} / ${java.version}` };
  })(),
  python: probe('python3', ['--version']),
} as const;

const LANG_LABEL: Record<LangKey, string> = { c: 'C（cc）', cpp: 'C++（clang++）', java: 'Java（javac+java）', python: 'Python（python3）' };

const env = ((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}) as Record<
  string,
  string | undefined
>;
const VERIFY_ALL = env.VERIFY_ALL_LANGS === '1';
const RUN_LANGS: readonly LangKey[] = VERIFY_ALL ? ['c', 'cpp', 'java', 'python'] : ['python'];

interface ExecOutcome {
  stdout: string;
  /** 编译/解释器给出的 stderr（成功时也为空，非空即算错） */
  stderr: string;
}

/** 把程序写成文件、编译、运行；失败时拼一条信息量足够大的错误 */
const execute = (lang: LangKey, program: string, label: string): ExecOutcome => {
  const ctx = `--- ${label} ---\n--- 程序全文 ---\n${program}`;

  if (lang === 'python') {
    const res = spawnSync('python3', ['-c', program], { encoding: 'utf8' });
    if (res.error) throw res.error;
    const stderr = (res.stderr ?? '').trim();
    expect(res.status, `python3 非零退出（status=${res.status}）\n--- stderr ---\n${stderr}\n${ctx}`).toBe(0);
    expect(stderr, `python3 打了警告/异常输出：\n${stderr}\n${ctx}`).toBe('');
    return { stdout: (res.stdout ?? '').trim(), stderr };
  }

  const dir = nodeFs.mkdtempSync('/tmp/sortviz-code-');
  try {
    const file = lang === 'c' ? 't.c' : lang === 'cpp' ? 't.cpp' : 'T.java';
    const bin = `${dir}/t`;
    nodeFs.writeFileSync(`${dir}/${file}`, program, 'utf8');

    const compileCmd =
      lang === 'c'
        ? { cmd: 'cc', args: ['-O0', '-w', '-o', bin, `${dir}/${file}`] }
        : lang === 'cpp'
          ? { cmd: 'clang++', args: ['-O0', '-std=c++17', '-w', '-o', bin, `${dir}/${file}`] }
          : { cmd: 'javac', args: ['-d', dir, `${dir}/${file}`] };

    const build = spawnSync(compileCmd.cmd, compileCmd.args, { encoding: 'utf8' });
    if (build.error) throw build.error;
    const buildLog = `${(build.stderr ?? '').trim()}${(build.stdout ?? '').trim() ? `\n${(build.stdout ?? '').trim()}` : ''}`;
    expect(
      build.status,
      `${LANG_LABEL[lang]} 编译失败（status=${build.status}）\n--- 编译器输出 ---\n${buildLog}\n${ctx}`,
    ).toBe(0);

    const runCmd =
      lang === 'java'
        ? { cmd: 'java', args: ['-cp', dir, 'T'] }
        : { cmd: bin, args: [] as string[] };
    const res = spawnSync(runCmd.cmd, runCmd.args, { encoding: 'utf8' });
    if (res.error) throw res.error;
    const stderr = `${(res.stderr ?? '').trim()}${buildLog ? `\n${buildLog}` : ''}`.trim();
    expect(
      res.status,
      `${LANG_LABEL[lang]} 运行非零退出（status=${res.status}）\n--- stderr / 编译输出 ---\n${stderr}\n--- stdout ---\n${(res.stdout ?? '').trim()}\n${ctx}`,
    ).toBe(0);
    expect(stderr, `${LANG_LABEL[lang]} 打了警告/异常输出：\n${stderr}\n${ctx}`).toBe('');
    return { stdout: (res.stdout ?? '').trim(), stderr };
  } finally {
    nodeFs.rmSync(dir, { recursive: true, force: true });
  }
};

resetRegistry();
registerBuiltinAlgorithms();

// 工具链清单永远打印出来（含被跳过的语言），方便在 CI 日志里一眼看清跑了什么
it('工具链探测：缺哪个就跳过哪个，不算失败', () => {
  const lines = (['c', 'cpp', 'java', 'python'] as const).map((lang) => {
    const p = PROBES[lang];
    const state = p.ok ? `可用（${p.version}）` : '缺失 → 该语言 it.skip';
    const run = RUN_LANGS.includes(lang) ? '本轮执行' : '本轮不跑（默认只跑 Python）';
    return `${LANG_LABEL[lang]}：${state}；${run}`;
  });
  console.log(`[verify:code] VERIFY_ALL_LANGS=${VERIFY_ALL ? '1' : '0'}\n${lines.join('\n')}`);
  expect(RUN_LANGS.length).toBeGreaterThan(0);
});

for (const lang of RUN_LANGS) {
  const suite = PROBES[lang].ok ? describe : describe.skip;
  suite(`代码面板可执行性：${LANG_LABEL[lang]} 真跑四种口径`, () => {
    it('注册表里正好有 10 个模块需要验证（防止有模块偷偷漏掉）', () => {
      for (const t of TARGETS) {
        expect(moduleById(t.id).code?.[lang], `${t.id} 缺 ${lang} 代码`).toBeDefined();
      }
      expect(TARGETS.length).toBe(10);
    });

    for (const target of TARGETS) {
      describe(target.name, () => {
        for (const order of ['asc', 'desc'] as const) {
          for (const base of [0, 1] as const) {
            const label = `${target.name} · ${ORDER_LABEL(order)} · ${BASE_LABEL(base)} · ${lang}`;
            const isSearch = target.id === SEARCH_TARGET.id;
            if (isSearch) {
              // 折半查找要两档：中间元素（下标 3/4）与最后一个元素（下标 7/8）——
              // 只查中间那档照不出「high 少取一格 / a.length 差一」这类边界错误。
              const sorted = order === 'asc' ? ASC : DESC;
              for (const slot of [3, N - 1]) {
                const expectedIndex = base === 0 ? slot : slot + 1;
                it(`${label} · 目标 sorted[${slot}]=${sorted[slot]}`, () => {
                  const source = sourceOf(target.id, lang, order, base);
                  const program = programFor(lang, {
                    source,
                    base,
                    expr: target[lang](base),
                    asIndex: true,
                    target: sorted[slot],
                    values: sorted,
                  });
                  const { stdout } = execute(lang, program, `${label} · 目标 ${sorted[slot]}`);
                  expect(
                    stdout,
                    `${label}：返回下标不对（期望 ${expectedIndex}，target=${sorted[slot]}）\n--- 面板代码 ---\n${source}\n--- 数据 ---\na = ${literal(base, sorted)}`,
                  ).toBe(String(expectedIndex));
                });
              }
            } else {
              it(label, () => {
                const source = sourceOf(target.id, lang, order, base);
                const program = programFor(lang, {
                  source,
                  base,
                  expr: target[lang](base),
                  cDecl: target.cDecl,
                  cppDecl: target.cppDecl,
                });
                const { stdout } = execute(lang, program, label);
                const expected = order === 'asc' ? ASC_TEXT : DESC_TEXT;
                expect(
                  stdout,
                  `${label}：排序结果不对\n期望：${expected}\n实际：${stdout}\n--- 面板代码 ---\n${source}\n--- 数据 ---\na = ${literal(base)}`,
                ).toBe(expected);
              });
            }
          }
        }
      });
    }
  });
}
