import {
  renderPseudocode,
  renderCode,
  renderVars,
  deriveVars,
  renderCounters,
  renderActionNote,
  renderComplexity,
} from '../../src/ui/panels';
import type { CodeBook } from '../../src/core/code';
import { COPY } from '../../src/copy/zh';
import { replay } from '../../src/core/replay';
import { listAlgorithms, getAlgorithm, resetRegistry } from '../../src/core/registry';
import { createLayout } from '../../src/ui/layout';
import { registerBuiltinAlgorithms } from '../../src/algorithms';
import { quick } from '../../src/algorithms/quick';
import { INPUT } from '../fixtures/golden';

const quickPseudo = () => {
  resetRegistry();
  registerBuiltinAlgorithms();
  return getAlgorithm('quick').pseudocode;
};

describe('伪代码面板', () => {
  it('行数等于伪代码长度，恰好一行高亮，行号取自 CodeLine.line', () => {
    const pseudo = quickPseudo();
    const host = document.createElement('div');
    const target = pseudo[6].line;
    renderPseudocode(host, pseudo, target);
    expect(host.querySelectorAll('.ln')).toHaveLength(pseudo.length);
    expect(host.querySelectorAll('.ln.hl')).toHaveLength(1);
    expect(host.querySelector('.ln.hl b')!.textContent).toBe(String(target));
    expect(host.querySelectorAll('.ln b')[0].textContent).toBe(String(pseudo[0].line));
  });
});

describe('deriveVars 变量面板（真值优先）', () => {
  it('快排中途：变量面板给出 i/j/pivot/low/high 的真实值', () => {
    const steps = quick.run(INPUT);
    const state = replay(INPUT, steps, Math.floor(steps.length * 0.3));
    const vars = deriveVars(state, 'quick');
    const map = new Map(vars.map((v) => [v.label, v.value]));
    expect(map.get('pivot')).toBeDefined();
    expect(map.get('low')).toBeDefined();
    expect(map.get('high')).toBeDefined();
    for (const v of vars) expect(v.value).not.toBe('—');   // 真值优先后不应再出现占位符
  });

  it('插入类算法的面板给出待插入值 key（408 手算最盯的量）', () => {
    for (const id of ['insertion', 'binary-insertion', 'shell']) {
      const algo = getAlgorithm(id);
      const steps = algo.run(INPUT);
      const state = replay(INPUT, steps, Math.floor(steps.length / 2));
      const vars = deriveVars(state, id);
      expect(vars.some((v) => v.label === 'key'), `${id} 缺 key`).toBe(true);
    }
  });

  it('切到 1 基：索引类变量 +1，值类变量（pivot/key/增量/段长）不动', () => {
    const steps = quick.run(INPUT);
    const state = replay(INPUT, steps, Math.floor(steps.length * 0.3));
    const at0 = new Map(deriveVars(state, 'quick', 0).map((v) => [v.label, v.value]));
    const at1 = new Map(deriveVars(state, 'quick', 1).map((v) => [v.label, v.value]));
    for (const key of ['i', 'j', 'low', 'high']) {
      if (!at0.has(key)) continue;
      expect(Number(at1.get(key)), key).toBe(Number(at0.get(key)) + 1);
    }
    if (at0.has('pivot')) expect(at1.get('pivot')).toBe(at0.get('pivot'));
  });

  it('9 个算法的变量面板都不为空、且值都是数字（表驱动）', () => {
    resetRegistry();
    registerBuiltinAlgorithms();
    for (const algo of listAlgorithms()) {
      const steps = algo.run(INPUT);
      const state = replay(INPUT, steps, Math.floor(steps.length / 2));
      const vars = deriveVars(state, algo.id);
      expect(vars.length, algo.id).toBeGreaterThan(0);
      for (const v of vars) expect(Number.isFinite(Number(v.value)), `${algo.id}.${v.label}=${v.value}`).toBe(true);
    }
  });
});

describe('计数器与动作说明', () => {
  it('renderCounters 渲染比较/交换/移动三个数字', () => {
    const host = document.createElement('div');
    renderCounters(host, { compare: 7, swap: 3, move: 9 });
    const text = host.textContent!;
    expect(text).toContain(COPY.counters.compare);
    expect(text).toContain(COPY.counters.swap);
    expect(text).toContain(COPY.counters.move);
    expect(text).toContain('7');
    expect(text).toContain('3');
    expect(text).toContain('9');
  });

  it('renderActionNote 写入当前动作说明', () => {
    const host = document.createElement('div');
    renderActionNote(host, '一趟划分结束：pivot 落在下标 3');
    expect(host.textContent).toBe('一趟划分结束：pivot 落在下标 3');
  });
});

describe('复杂度面板', () => {
  it('渲染平均/最坏/空间/稳定性四行', () => {
    const host = document.createElement('div');
    renderComplexity(host, { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' }, true);
    const text = host.textContent!;
    expect(text).toContain(COPY.complexityAvg);
    expect(text).toContain(COPY.complexityWorst);
    expect(text).toContain(COPY.complexitySpace);
    expect(text).toContain(COPY.complexityStable);
    expect(text).toContain('O(n²)');
    expect(host.querySelectorAll('.cxrow')).toHaveLength(4);
  });
});

describe('变量区渲染', () => {
  it('renderVars 把 deriveVars 的真值结果写进宿主（每个变量一张小卡片）', () => {
    const steps = quick.run(INPUT);
    const state = replay(INPUT, steps, Math.floor(steps.length * 0.3));
    const host = document.createElement('div');
    renderVars(host, state, 'quick');
    const expected = deriveVars(state, 'quick');
    expect(host.querySelectorAll('.stat')).toHaveLength(expected.length);
    expect(expected.length).toBeGreaterThan(0);
    // 标签走 COPY，值来自算法带出的真值（不再是 '—'）
    expect(host.textContent).toContain(COPY.varLabels.pivot);
    expect(host.textContent).toContain(COPY.varPlaced);
    for (const entry of expected) expect(host.textContent).toContain(entry.value);
  });
});

describe('动作说明的无障碍标注', () => {
  it('动作说明是 aria-live=polite 的组', () => {
    const root = document.createElement('div');
    const layout = createLayout(root);
    expect(layout.noteHost.getAttribute('role')).toBe('group');
    expect(layout.noteHost.getAttribute('aria-live')).toBe('polite');
  });
});

describe('真实代码面板', () => {
  // anchor 4 故意出现在两行上（while 的开括号行 + 循环体）：一个语义行可以对多行真实代码
  const BOOK: CodeBook = {
    c: [
      { text: 'void f(int a[], int n) {' },
      { text: '    for (int i = 1; i < n; i++) {', anchor: 1 },
      { text: '        int key = a[i];', anchor: 2 },
      // 这一行既随方向变（descText）也随下标进制变（text1）：1 基时下界从 0 变 1
      {
        text: '        while (j >= 0 && a[j] > key) {',
        descText: '        while (j >= 0 && a[j] < key) {',
        text1: '        while (j >= 1 && a[j] > key) {',
        descText1: '        while (j >= 1 && a[j] < key) {',
        anchor: 4,
      },
      { text: '            a[j + 1] = a[j];', anchor: 4 },
      { text: '        }' },
    ],
    cpp: [{ text: 'cpp' }],
    java: [{ text: 'java' }],
    python: [{ text: 'python' }],
  };

  it('renderCode 按 anchor 高亮（含多行命中同一语义行）', () => {
    const host = document.createElement('div');
    renderCode(host, BOOK, 'c', 4);
    expect(host.querySelectorAll('.ln')).toHaveLength(BOOK.c.length);
    const hl = [...host.querySelectorAll('.ln.hl')];
    expect(hl).toHaveLength(2);
    expect(hl[0].textContent).toContain('while (j >= 0 && a[j] > key)');
    expect(hl[1].textContent).toContain('a[j + 1] = a[j];');
    // 行号是展示序号 1..n，不是 anchor（anchor 只是语义行号的引用）
    expect(host.querySelectorAll('.ln b')[0].textContent).toBe('1');
    expect(host.querySelectorAll('.ln')[3].querySelector('b')!.textContent).toBe('4');
    // 全文逐行落进宿主，未命中的行不带 hl
    expect(host.textContent).toContain('void f(int a[], int n) {');
    expect(host.querySelectorAll('.ln')[0].classList.contains('hl')).toBe(false);
  });

  it('renderCode 传 desc：命中的行显示 descText', () => {
    const host = document.createElement('div');
    renderCode(host, BOOK, 'c', 4, { order: 'desc', base: 0 });
    const hl = [...host.querySelectorAll('.ln.hl')];
    expect(hl).toHaveLength(2);
    expect(hl[0].textContent).toContain('while (j >= 0 && a[j] < key)');
    expect(host.textContent).not.toContain('a[j] > key');
    // 没有 descText 的行仍然照抄原文
    expect(host.textContent).toContain('void f(int a[], int n) {');
    expect(hl[1].textContent).toContain('a[j + 1] = a[j];');
  });

  it('renderCode 传 asc（或不传）时显示 text', () => {
    const asc = document.createElement('div');
    renderCode(asc, BOOK, 'c', 4, { order: 'asc', base: 0 });
    const dflt = document.createElement('div');
    renderCode(dflt, BOOK, 'c', 4);
    for (const host of [asc, dflt]) {
      expect(host.textContent).toContain('while (j >= 0 && a[j] > key)');
      expect(host.textContent).not.toContain('a[j] < key');
    }
    expect(asc.textContent).toBe(dflt.textContent);
  });

  it('renderCode 传 1 基：命中的行显示 text1（下标口径跟着变）', () => {
    const host = document.createElement('div');
    renderCode(host, BOOK, 'c', 4, { order: 'asc', base: 1 });
    const hl = [...host.querySelectorAll('.ln.hl')];
    expect(hl).toHaveLength(2);
    expect(hl[0].textContent).toContain('while (j >= 1 && a[j] > key)');
    expect(host.textContent).not.toContain('j >= 0');
    // 没声明 text1 的行照抄原文
    expect(hl[1].textContent).toContain('a[j + 1] = a[j];');
  });

  it('renderCode 传 1 基·降序：优先 descText1（既换进制又反方向）', () => {
    const host = document.createElement('div');
    renderCode(host, BOOK, 'c', 4, { order: 'desc', base: 1 });
    const hl = [...host.querySelectorAll('.ln.hl')];
    expect(hl[0].textContent).toContain('while (j >= 1 && a[j] < key)');
    expect(host.textContent).not.toContain('a[j] > key');
    expect(host.textContent).not.toContain('j >= 0');
  });

  it('renderCode 在 codeLine 为 undefined 时不加任何 hl', () => {
    const host = document.createElement('div');
    renderCode(host, BOOK, 'c', undefined);
    expect(host.querySelectorAll('.ln')).toHaveLength(BOOK.c.length);
    expect(host.querySelectorAll('.ln.hl')).toHaveLength(0);
  });
});
