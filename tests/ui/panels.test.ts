import {
  renderPseudocode,
  renderVars,
  deriveVars,
  renderCounters,
  renderActionNote,
  renderComplexity,
} from '../../src/ui/panels';
import { COPY } from '../../src/copy/zh';
import { replay } from '../../src/core/replay';
import { listAlgorithms, getAlgorithm, resetRegistry } from '../../src/core/registry';
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
