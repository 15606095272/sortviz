import { handleKey, type KeyDeps } from '../../src/ui/keyboard';

function makeDeps(over: Partial<KeyDeps> = {}): { deps: KeyDeps; calls: string[] } {
  const calls: string[] = [];
  const deps: KeyDeps = {
    algorithmIds: ['insertion', 'bubble', 'quick'],
    nextPass: () => {
      calls.push('nextPass');
      return 12;
    },
    prevPass: () => {
      calls.push('prevPass');
      return 3;
    },
    onToggle: () => calls.push('toggle'),
    onStepForward: () => calls.push('forward'),
    onStepBack: () => calls.push('back'),
    onSeek: (i) => calls.push(`seek:${i}`),
    onAlgorithm: (id) => calls.push(`algo:${id}`),
    ...over,
  };
  return { deps, calls };
}

const press = (key: string, opts: Partial<KeyboardEventInit> = {}, target?: EventTarget) => {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, ...opts });
  if (target) Object.defineProperty(ev, 'target', { value: target });
  return ev;
};

describe('键盘快捷键', () => {
  it('空格切换播放', () => {
    const { deps, calls } = makeDeps();
    expect(handleKey(press(' '), deps)).toBe(true);
    expect(calls).toEqual(['toggle']);
  });

  it('方向键单步前进 / 后退', () => {
    const { deps, calls } = makeDeps();
    expect(handleKey(press('ArrowRight'), deps)).toBe(true);
    expect(handleKey(press('ArrowLeft'), deps)).toBe(true);
    expect(calls).toEqual(['forward', 'back']);
  });

  it('Shift + 右方向键跳到下一趟（seek 到 nextPass）', () => {
    const { deps, calls } = makeDeps();
    expect(handleKey(press('ArrowRight', { shiftKey: true }), deps)).toBe(true);
    expect(calls).toEqual(['nextPass', 'seek:12']);
  });

  it('Shift + 左方向键跳到上一趟', () => {
    const { deps, calls } = makeDeps();
    expect(handleKey(press('ArrowLeft', { shiftKey: true }), deps)).toBe(true);
    expect(calls).toEqual(['prevPass', 'seek:3']);
  });

  it('没有下一趟时不吞键（返回 false 且不 seek）', () => {
    const { deps, calls } = makeDeps({ nextPass: () => null });
    expect(handleKey(press('ArrowRight', { shiftKey: true }), deps)).toBe(false);
    expect(calls).toEqual([]);
  });

  it('数字键 1..9 切换算法', () => {
    const { deps, calls } = makeDeps();
    expect(handleKey(press('1'), deps)).toBe(true);
    expect(handleKey(press('3'), deps)).toBe(true);
    expect(calls).toEqual(['algo:insertion', 'algo:quick']);
  });

  it('数字超出算法数量时返回 false', () => {
    const { deps, calls } = makeDeps();
    expect(handleKey(press('9'), deps)).toBe(false);
    expect(calls).toEqual([]);
  });

  it('焦点在输入框里时不拦任何键（连空格也不拦）', () => {
    const { deps, calls } = makeDeps();
    const input = document.createElement('input');
    expect(handleKey(press(' ', {}, input), deps)).toBe(false);
    expect(handleKey(press('ArrowRight', {}, input), deps)).toBe(false);
    expect(handleKey(press('1', {}, input), deps)).toBe(false);
    expect(calls).toEqual([]);
  });

  it('Ctrl/Alt/Meta 组合键与未知键不拦', () => {
    const { deps, calls } = makeDeps();
    expect(handleKey(press(' ', { ctrlKey: true }), deps)).toBe(false);
    expect(handleKey(press('x'), deps)).toBe(false);
    expect(calls).toEqual([]);
  });
});
