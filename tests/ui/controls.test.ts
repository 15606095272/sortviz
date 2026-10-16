import { parseDataInput, createControls } from '../../src/ui/controls';
import { COPY } from '../../src/copy/zh';
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
      onIndexBase: (base) => calls.push(`indexbase:${base}`),
      onView: (kind) => calls.push(`view:${kind}`),
      onOrder: (order) => calls.push(`order:${order}`),
      onTheme: (theme) => calls.push(`theme:${theme}`),
    });
    return { host, controls, calls, applied };
  };

  it('算法 chips 按注册顺序渲染，点击回调带 id', () => {
    const { host, calls } = setup();
    const chips = [...host.querySelectorAll('.chips .chip')];
    expect(chips.map((c) => c.textContent)).toEqual(['插入', '折半插入', '希尔', '冒泡', '快排', '选择', '堆排', '归并', '基数', '折半查找']);
    // 注册顺序变成 插入/折半插入/希尔/冒泡/快排/选择/堆排，快排（quick）仍是第 5 个 chip
    (chips[4] as HTMLElement).click();
    expect(calls).toContain('algo:quick');
  });

  it('走真实输入路径：非法内容报错、不触发 onData', () => {
    const { host, applied } = setup();
    const input = host.querySelector('input[type="text"]') as HTMLInputElement;
    input.value = '1,2,abc';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(applied).toHaveLength(0);
    expect(host.querySelector('.err')!.textContent).toContain('数字');
  });

  it('走真实输入路径：点「应用」用合法内容触发一次 onData', () => {
    const { host, applied } = setup();
    const input = host.querySelector('input[type="text"]') as HTMLInputElement;
    input.value = '5 3、9';
    const applyBtn = [...host.querySelectorAll('button')].find((b) => b.textContent === COPY.apply)!;
    applyBtn.click();
    expect(applied).toEqual([[5, 3, 9]]);
    expect(host.querySelector('.err')!.textContent).toBe('');
  });

  it('setProgress 精确更新步数文案与播放按钮三态（播放/暂停/重播）', () => {
    const { host, controls } = setup();
    const playBtn = (): string => [...host.querySelectorAll('button')].find((b) => b.className === 'play')!.textContent!;
    controls.setProgress(3, 10, 2, false);
    expect(host.textContent).toContain('第 3 / 10 步');
    expect(playBtn()).toBe(COPY.play);
    controls.setProgress(3, 10, 2, true);
    expect(playBtn()).toBe(COPY.pause);
    controls.setProgress(10, 10, 2, false);
    expect(playBtn()).toBe(COPY.replay);
    controls.setProgress(0, 0, 2, false);
    expect(playBtn()).toBe(COPY.play);
  });

  it('下标进制胶囊渲染且点击回调带 base', () => {
    const { host, controls, calls } = setup();
    const caps = [...host.querySelectorAll('.indexbase .chip')] as HTMLElement[];
    expect(caps.map((c) => c.textContent)).toEqual([COPY.indexBaseZero, COPY.indexBaseOne]);
    caps[1].click();
    expect(calls).toContain('indexbase:1');
    controls.setIndexBase(1);
    expect(caps[1].classList.contains('on')).toBe(true);
    expect(caps[0].classList.contains('on')).toBe(false);
  });

  it('主视图切换胶囊在 .viewswitch 里，点击回调带 kind', () => {
    const { host, controls, calls } = setup();
    const caps = [...host.querySelectorAll('.viewswitch .chip')] as HTMLElement[];
    expect(caps.map((c) => c.textContent)).toEqual([COPY.viewArrayLabel, COPY.viewBarLabel]);
    caps[1].click();
    expect(calls).toContain('view:bar');
    controls.setView('bar');
    expect(caps[1].classList.contains('on')).toBe(true);
    expect(caps[0].classList.contains('on')).toBe(false);
  });

  it('按钮与输入控件都有 aria-label', () => {
    const { host } = setup();
    expect((host.querySelector('input.datainput') as HTMLInputElement).getAttribute('aria-label')).toBe(COPY.ariaData);
    expect((host.querySelector('input.seek') as HTMLInputElement).getAttribute('aria-label')).toBe(COPY.ariaSeek);
    expect((host.querySelector('input.speed') as HTMLInputElement).getAttribute('aria-label')).toBe(COPY.ariaSpeed);
  });

  it('算法胶囊可聚焦且能键盘触发（role=button + tabindex=0）', () => {
    const { host, calls } = setup();
    const chip = host.querySelector('.chips .chip') as HTMLElement;
    expect(chip.getAttribute('role')).toBe('button');
    expect(chip.getAttribute('tabindex')).toBe('0');
    chip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(calls).toContain('algo:insertion');
  });

  it('顺序胶囊在 .orderswitch 里，点击回调带 asc/desc', () => {
    const { host, controls, calls } = setup();
    const caps = [...host.querySelectorAll('.orderswitch .chip')] as HTMLElement[];
    expect(caps.map((c) => c.textContent)).toEqual([COPY.orderAsc, COPY.orderDesc]);
    caps[1].click();
    expect(calls).toContain('order:desc');
    controls.setOrder('desc');
    expect(caps[1].classList.contains('on')).toBe(true);
    expect(caps[0].classList.contains('on')).toBe(false);
  });
});
