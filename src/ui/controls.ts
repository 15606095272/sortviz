import { COPY } from '../copy/zh';
import { getAlgorithm, type ViewKind } from '../core/registry';
import type { IndexBase } from '../core/index-base';

export type ParseResult = { ok: true; data: number[] } | { ok: false; message: string };

const MIN_COUNT = 2;
const MAX_COUNT = 64;
const MAX_ABS = 9999;

export function parseDataInput(raw: string): ParseResult {
  const parts = raw.split(/[\s,，、;；]+/).filter((s) => s.length > 0);
  if (parts.length < MIN_COUNT) return { ok: false, message: COPY.errorTooFew };
  if (parts.length > MAX_COUNT) return { ok: false, message: COPY.errorTooMany };
  const data: number[] = [];
  for (const p of parts) {
    const value = Number(p);
    if (!Number.isFinite(value) || !Number.isInteger(value)) return { ok: false, message: COPY.errorNotNumber };
    if (Math.abs(value) > MAX_ABS) return { ok: false, message: COPY.errorTooLarge };
    data.push(value);
  }
  return { ok: true, data };
}

export interface ControlsHandlers {
  algorithmIds: string[];                      // 算法 chips 的顺序（来自注册表 listAlgorithms）
  onAlgorithm(id: string): void;
  onData(data: number[]): void;
  onRandom(): void;
  onPlayToggle(): void;
  onStepForward(): void;
  onStepBack(): void;
  onSeek(index: number): void;
  onSpeed(multiplier: number): void;
  onIndexBase(base: IndexBase): void;
  onView(kind: ViewKind): void;               // 主视图切换：数组视图 ↔ 柱状图（结构视图始终保留）
}

export interface Controls {
  setError(message: string | null): void;
  setProgress(index: number, total: number, speed: number, playing: boolean): void;
  setPass(text: string): void;         // 进度条右侧的趟次文案（实物稿有，缺省留空）
  setIndexBase(base: IndexBase): void; // 装配层回灌当前下标进制，同步胶囊高亮（与 setPass 同风格）
  setView(kind: ViewKind): void;       // 装配层回灌当前主视图，同步胶囊高亮（与 setIndexBase 同风格）
  setAlgorithm(id: string): void;      // 装配层回灌当前算法，同步 chip 高亮（键盘数字键切算法时用）
}

/** 实物稿里的默认演示数据（数据结构的经典样例序列） */
const DEFAULT_DATA = '49, 38, 65, 97, 76, 13, 27, 49';
const DEFAULT_COUNT = 8;
const MIN_SPEED = 0.25;
const MAX_SPEED = 8;
const SPEED_STEP = 0.25;

/** 把滑块「已走部分」的百分比写进 --fill（theme.css 用它给轨道左侧上色） */
function setFill(input: HTMLInputElement): void {
  const min = Number(input.min || '0');
  const max = Number(input.max || '100');
  const value = Number(input.value);
  input.style.setProperty('--fill', max > min ? `${((value - min) / (max - min)) * 100}%` : '0%');
}

function mk(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function rangeInput(className: string, min: number, max: number, step: number, value: number): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'range';
  input.className = className;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  return input;
}

function buttonEl(className: string, text: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.textContent = text;
  return btn;
}

/**
 * 把 span 胶囊做成可聚焦、可用键盘触发的按钮：
 * role=button + tabindex=0，Enter/空格 等同点击。
 * 这里 stopPropagation 是必须的 —— 空格同时也是全局「播放/暂停」，
 * 不拦住的话一次按键会被算两遍（胶囊的动作 + 全局快捷键）。
 */
function activatable(el: HTMLElement, activate: () => void): void {
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
    event.preventDefault();
    event.stopPropagation();
    activate();
  });
}

/** 随机序列（1..99，贴近教材样例的两位正整数） */
function randomData(count: number): number[] {
  const n = Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.trunc(count)));
  return Array.from({ length: n }, () => Math.floor(Math.random() * 99) + 1);
}

/**
 * 控制条：算法 chips / 数据输入 / 元素个数 / 播放控制 / 速度 / 进度。
 * 只负责 DOM 与事件转发，不持有播放状态（状态由装配层通过 setProgress 回灌）。
 */
export function createControls(host: HTMLElement, handlers: ControlsHandlers): Controls {
  host.innerHTML = '';
  const shortNames = COPY.algoShort as Record<string, string>;

  let playing = false;
  let total = 0;
  let index = 0;

  // —— 算法 chips ——（初始高亮第一个，点击后由本地状态维护高亮，不依赖装配层回调）
  const chipRow = mk('div', 'chips');
  const chips: HTMLElement[] = [];
  const setAlgorithm = (id: string): void => {
    chips.forEach((chip, i) => chip.classList.toggle('on', handlers.algorithmIds[i] === id));
  };
  for (const id of handlers.algorithmIds) {
    // chips 用短名（COPY.algoShort），取不到才回落到算法全名
    const chip = mk('span', 'chip', shortNames[id] ?? getAlgorithm(id).name.zh);
    chip.dataset.id = id;
    const pick = (): void => {
      setAlgorithm(id);             // 本地先亮（与下标进制/主视图胶囊同风格），装配层随后回灌
      handlers.onAlgorithm(id);     // 键盘数字键走的是同一条路（main 里复用同一个 selectAlgorithm）
    };
    chip.addEventListener('click', pick);
    activatable(chip, pick);        // 鼠标点 ↔ 键盘 Enter/空格 等价
    chips.push(chip);
    chipRow.append(chip);
  }
  setAlgorithm(handlers.algorithmIds[0] ?? '');

  // —— 错误行 ——
  const errRow = mk('span', 'err');
  const setError = (message: string | null): void => {
    errRow.textContent = message ?? '';
  };

  // —— 数据区 ——
  const dataGroup = mk('div', 'ctrlgroup data');
  const dataInput = document.createElement('input');
  dataInput.type = 'text';
  dataInput.className = 'datainput';
  dataInput.value = DEFAULT_DATA;
  dataInput.setAttribute('aria-label', COPY.ariaData);
  const applyBtn = buttonEl('pri', COPY.apply);
  const randomBtn = buttonEl('', COPY.random);

  const applyData = (): void => {
    const result = parseDataInput(dataInput.value);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    handlers.onData(result.data);
  };

  applyBtn.addEventListener('click', applyData);
  dataInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') applyData();
  });
  randomBtn.addEventListener('click', () => handlers.onRandom());

  const countInput = rangeInput('count', MIN_COUNT, MAX_COUNT, 1, DEFAULT_COUNT);
  countInput.setAttribute('aria-label', COPY.countLabel);
  const countValue = mk('span', 'countval', String(DEFAULT_COUNT));
  setFill(countInput);
  countInput.addEventListener('input', () => {
    countValue.textContent = countInput.value;
    setFill(countInput);
  });
  countInput.addEventListener('change', () => {
    setError(null);
    handlers.onData(randomData(Number(countInput.value)));
  });

  dataGroup.append(
    mk('span', 'lab', COPY.dataLabel),
    dataInput,
    applyBtn,
    randomBtn,
    mk('span', 'sep'),
    mk('span', 'lab', COPY.countLabel),
    countInput,
    countValue,
  );

  // —— 下标进制（0 基 / 1 基）——
  // 内部一律 0 基，这里只切换展示口径：切到 1 基后数组下标与动作说明里的 a[k] 一起 +1，便于对照 408 教材
  const indexBaseGroup = mk('div', 'ctrlgroup indexbase');
  const baseCaps: { base: IndexBase; cap: HTMLElement }[] = [];
  const setIndexBase = (base: IndexBase): void => {
    for (const item of baseCaps) item.cap.classList.toggle('on', item.base === base);
  };
  const baseCap = (base: IndexBase, text: string): HTMLElement => {
    const cap = mk('span', 'chip', text);
    cap.dataset.base = String(base);
    const pick = (): void => {
      setIndexBase(base);              // 本地先亮（与算法 chips 同风格），装配层随后回灌
      handlers.onIndexBase(base);
    };
    cap.addEventListener('click', pick);
    activatable(cap, pick);
    baseCaps.push({ base, cap });
    return cap;
  };
  indexBaseGroup.append(
    mk('span', 'lab', COPY.indexBaseLabel),
    baseCap(0, COPY.indexBaseZero),
    baseCap(1, COPY.indexBaseOne),
  );
  setIndexBase(0);

  // —— 主视图（数组视图 / 柱状图）——
  // 只切换左侧主视图，右侧结构视图始终保留；容器类名 viewswitch 与算法 chips(.chips)、
  // 下标进制(.indexbase) 分开，互不影响既有选择器
  const viewGroup = mk('div', 'ctrlgroup viewswitch');
  const viewCaps: { kind: ViewKind; cap: HTMLElement }[] = [];
  const setView = (kind: ViewKind): void => {
    for (const item of viewCaps) item.cap.classList.toggle('on', item.kind === kind);
  };
  const viewCap = (kind: ViewKind, text: string): HTMLElement => {
    const cap = mk('span', 'chip', text);
    cap.dataset.view = kind;
    const pick = (): void => {
      setView(kind);                   // 本地先亮（与算法 chips 同风格），装配层随后回灌
      handlers.onView(kind);
    };
    cap.addEventListener('click', pick);
    activatable(cap, pick);
    viewCaps.push({ kind, cap });
    return cap;
  };
  viewGroup.append(
    mk('span', 'lab', COPY.viewLabel),
    viewCap('array', COPY.viewArrayLabel),
    viewCap('bar', COPY.viewBarLabel),
  );
  setView('array');

  // —— 播放区 ——
  const transport = mk('div', 'ctrlgroup transport');
  const toStartBtn = buttonEl('ic', '⏮');
  const backBtn = buttonEl('ic', '◀');
  const playBtn = buttonEl('play', COPY.play);
  const forwardBtn = buttonEl('ic', '⏭');

  // 图标按钮没有可读文本，必须显式给 aria-label（文案统一走 COPY）
  toStartBtn.setAttribute('aria-label', COPY.ariaReset);
  backBtn.setAttribute('aria-label', COPY.ariaStepBack);
  forwardBtn.setAttribute('aria-label', COPY.ariaStepForward);
  playBtn.setAttribute('aria-label', COPY.ariaPlay);

  toStartBtn.addEventListener('click', () => handlers.onSeek(0));
  backBtn.addEventListener('click', () => handlers.onStepBack());
  forwardBtn.addEventListener('click', () => handlers.onStepForward());
  playBtn.addEventListener('click', () => handlers.onPlayToggle());

  const speedInput = rangeInput('speed', MIN_SPEED, MAX_SPEED, SPEED_STEP, 1);
  speedInput.setAttribute('aria-label', COPY.ariaSpeed);
  const speedValue = mk('span', 'speedval', '1×');
  setFill(speedInput);
  speedInput.addEventListener('input', () => {
    const multiplier = Number(speedInput.value);
    speedValue.textContent = `${multiplier}×`;
    setFill(speedInput);
    handlers.onSpeed(multiplier);
  });

  transport.append(
    toStartBtn,
    backBtn,
    playBtn,
    forwardBtn,
    mk('span', 'sep'),
    mk('span', 'lab', COPY.speed),
    speedInput,
    speedValue,
  );

  // —— 进度区 ——（可视进度条 + 可拖拽 seek 滑块，两者都由 setProgress 同步）
  const progress = mk('div', 'progress');
  const bar = mk('div', 'bar');
  const barFill = document.createElement('i');
  bar.append(barFill);
  const stepText = mk('span', 'steptext', COPY.step.replace('{index}', '0').replace('{total}', '0'));
  const passText = mk('span', 'passtext');
  const ptext = mk('div', 'ptext');
  ptext.append(stepText, passText);
  const seekInput = rangeInput('seek', 0, 0, 1, 0);
  seekInput.setAttribute('aria-label', COPY.ariaSeek);
  seekInput.addEventListener('input', () => handlers.onSeek(Number(seekInput.value)));
  progress.append(bar, ptext, seekInput);

  host.append(chipRow, mk('span', 'sep'), dataGroup, mk('span', 'sep'), viewGroup, mk('span', 'sep'), indexBaseGroup, mk('span', 'sep'), transport, progress, errRow);

  const setProgress = (nextIndex: number, nextTotal: number, speed: number, isPlaying: boolean): void => {
    index = nextIndex;
    total = nextTotal;
    playing = isPlaying;
    playBtn.textContent = playing ? COPY.pause : total > 0 && index >= total ? COPY.replay : COPY.play;
    // aria-label 跟着按钮语义走：播放 / 暂停 / 重播三态
    playBtn.setAttribute('aria-label', playing ? COPY.ariaPause : total > 0 && index >= total ? COPY.ariaReplay : COPY.ariaPlay);
    stepText.textContent = COPY.step.replace('{index}', String(index)).replace('{total}', String(total));
    barFill.style.width = total > 0 ? `${Math.round((index / total) * 100)}%` : '0%';
    seekInput.max = String(total);
    seekInput.value = String(Math.min(index, total));
    setFill(seekInput);
    speedInput.value = String(speed);
    speedValue.textContent = `${speed}×`;
    setFill(speedInput);
  };

  const setPass = (text: string): void => { passText.textContent = text; };

  return { setError, setProgress, setPass, setIndexBase, setView, setAlgorithm };
}
