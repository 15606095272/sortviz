import { parseDataInput, createControls } from '../../src/ui/controls';
import { registerBuiltinAlgorithms } from '../../src/algorithms';
import { listAlgorithms, resetRegistry } from '../../src/core/registry';

describe('数据输入解析', () => {
  it('支持逗号/空格/中文顿号/换行混合分隔', () => {
    expect(parseDataInput('49,38 65、97\n76')).toEqual({ ok: true, data: [49, 38, 65, 97, 76] });
  });
  it('允许负数与重复值', () => {
    expect(parseDataInput('-5, 3, 3, 0')).toEqual({ ok: true, data: [-5, 3, 3, 0] });
  });
  it('少于 2 个元素报错（中文提示）', () => {
    const r = parseDataInput('7');
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.message).toContain('至少');
  });
  it('超过 64 个元素报错', () => {
    const raw = Array.from({ length: 65 }, (_, i) => i + 1).join(',');
    expect(parseDataInput(raw).ok).toBe(false);
  });
  it('非数字内容报错', () => {
    const r = parseDataInput('1,2,abc');
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.message).toContain('数字');
  });
  it('超出值域 |v| ≤ 9999 报错', () => {
    expect(parseDataInput('1,10000').ok).toBe(false);
  });
});

describe('控制条', () => {
  const setup = () => {
    resetRegistry();
    registerBuiltinAlgorithms();
    const host = document.createElement('div');
    const calls: string[] = [];
    const applied: number[][] = [];
    const controls = createControls(host, {
      algorithmIds: listAlgorithms().map((a) => a.id),
      onAlgorithm: (id) => calls.push(`algo:${id}`),
      onData: (d) => { applied.push(d); calls.push('data'); },
      onRandom: () => calls.push('random'),
      onPlayToggle: () => calls.push('play'),
      onStepForward: () => calls.push('forward'),
      onStepBack: () => calls.push('back'),
      onSeek: (i) => calls.push(`seek:${i}`),
      onSpeed: (m) => calls.push(`speed:${m}`),
    });
    return { host, controls, calls, applied };
  };

  it('算法 chips 按注册顺序渲染，点击回调带 id', () => {
    const { host, calls } = setup();
    const chips = [...host.querySelectorAll('.chip')];
    expect(chips.map((c) => c.textContent)).toEqual(['直接插入排序', '冒泡排序', '快速排序']);
    (chips[2] as HTMLElement).click();
    expect(calls).toContain('algo:quick');
  });

  it('输入非法时显示错误文案且不触发 onData', () => {
    const { host, controls, applied } = setup();
    controls.setError('至少需要 2 个数据');
    expect(host.querySelector('.err')!.textContent).toContain('至少');
    expect(applied).toHaveLength(0);
  });

  it('setProgress 更新步数文案与播放按钮状态', () => {
    const { host, controls } = setup();
    controls.setProgress(3, 10, 2, true);
    expect(host.textContent).toContain('第 3 / 10 步');
    const buttons = [...host.querySelectorAll('button')];
    expect(buttons.some((b) => b.textContent === '暂停')).toBe(true);
    controls.setProgress(10, 10, 2, false);
    expect(buttons.some((b) => b.textContent === '重播' || b.textContent === '播放')).toBe(true);
  });
});
