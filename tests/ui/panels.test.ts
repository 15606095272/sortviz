import {
  renderPseudocode,
  renderVars,
  deriveVars,
  renderCounters,
  renderActionNote,
  renderComplexity,
} from '../../src/ui/panels';
import { COPY } from '../../src/copy/zh';
import { applyStep, createViewState } from '../../src/core/replay';
import { markStep, compareStep } from '../../src/core/step';
import { getAlgorithm, resetRegistry } from '../../src/core/registry';
import { registerBuiltinAlgorithms } from '../../src/algorithms';

const quickPseudo = () => {
  resetRegistry();
  registerBuiltinAlgorithms();
  return getAlgorithm('quick').pseudocode;
};

const valueOf = (vars: { label: string; value: string }[], label: string): string | undefined =>
  vars.find((v) => v.label === label)?.value;

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

describe('deriveVars 变量推导（纯函数）', () => {
  it('quick：pivot 取 pivot 标记下标的值，low/high 取调用栈顶区间，j 取 activeIndices[0]', () => {
    const data = [49, 38, 65, 97, 76, 13];
    let state = createViewState(data);
    state = applyStep(state, markStep('range', [0, 5], 6, '划分区间', [0, 5]));
    state = applyStep(state, markStep('pivot', [2], 7, 'pivot'));
    state = applyStep(state, compareStep(4, 2, 9, '比较'));
    const vars = deriveVars(state, 'quick');
    expect(valueOf(vars, 'pivot')).toBe(String(data[2]));
    expect(valueOf(vars, 'low')).toBe('0');
    expect(valueOf(vars, 'high')).toBe('5');
    expect(valueOf(vars, 'j')).toBe('4');
    // 公共项：递归深度 = 调用栈长度（range 进栈一次）
    expect(valueOf(vars, '递归深度')).toBe('1');
  });

  it('insertion：key 取 active 标记下标的值，j / i 依次映射 activeIndices', () => {
    const data = [49, 38, 65, 97, 76, 13];
    let state = createViewState(data);
    state = applyStep(state, markStep('active', [5], 5, 'key 暂存'));
    state = applyStep(state, compareStep(3, 5, 6, '比较'));
    const vars = deriveVars(state, 'insertion');
    expect(valueOf(vars, 'key')).toBe(String(data[5]));
    expect(valueOf(vars, 'j')).toBe('3');
    expect(valueOf(vars, 'i（空位）')).toBe('5');
  });

  it('取不到的量显示占位符，不猜数字', () => {
    const vars = deriveVars(createViewState([3, 1]), 'bubble');
    expect(valueOf(vars, 'j')).toBe('—');
    expect(valueOf(vars, '递归深度')).toBeUndefined();
    expect(valueOf(vars, '已就位')).toBe('0');
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
  it('renderVars 把 deriveVars 的结果写进宿主', () => {
    const data = [49, 38, 65];
    let state = createViewState(data);
    state = applyStep(state, markStep('pivot', [0], 7, 'pivot'));
    const host = document.createElement('div');
    renderVars(host, state, 'quick');
    expect(host.textContent).toContain('pivot');
    expect(host.textContent).toContain(String(data[0]));
  });
});
