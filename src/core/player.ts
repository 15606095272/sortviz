import type { Step } from './step';

export interface Scheduler {
  now(): number;
  request(cb: (t: number) => void): number;
  cancel(id: number): void;
}

export const rafScheduler: Scheduler = {
  now: () => performance.now(),
  request: (cb) => requestAnimationFrame(cb),
  cancel: (id) => cancelAnimationFrame(id),
};

export interface PlayerState { index: number; total: number; playing: boolean; speed: number }

export interface PlayerOptions {
  steps: Step[];
  onIndex: (index: number) => void;
  scheduler?: Scheduler;
  msPerStep?: number;          // 1x 速度下每步耗时，默认 240ms
}

export interface Player {
  play(): void;
  pause(): void;
  toggle(): void;
  stepForward(): void;
  stepBack(): void;
  seek(index: number): void;
  setSpeed(multiplier: number): void;
  setSteps(steps: Step[]): void;
  readonly state: PlayerState;
}

export function createPlayer(options: PlayerOptions): Player {
  const scheduler = options.scheduler ?? rafScheduler;
  const msPerStep = options.msPerStep ?? 240;
  let steps = [...options.steps];
  let index = 0;
  let playing = false;
  let speed = 1;
  let frameId: number | null = null;
  let lastTime = 0;
  let carry = 0;

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const emit = () => options.onIndex(index);

  function pause(): void {
    playing = false;
    if (frameId !== null) { scheduler.cancel(frameId); frameId = null; }
    emit();
  }

  const tick = (t: number): void => {
    frameId = null;
    if (!playing) return;
    // lastTime 在 play() 里已按「开始播放的时刻」初始化，这里不再用 0 当哨兵：
    // 用哨兵会让第一帧的 elapsed 恒为 0，假时钟下表现为「推进了一个 msPerStep 却一步没走」
    carry += (t - lastTime) * speed;
    lastTime = t;
    const advance = Math.floor(carry / msPerStep);
    if (advance > 0) {
      carry -= advance * msPerStep;
      index = Math.min(steps.length, index + advance);
      emit();
      if (index >= steps.length) { pause(); return; }
    }
    frameId = scheduler.request(tick);
  };

  const api: Player = {
    play() {
      if (playing || index >= steps.length) return;
      playing = true;
      lastTime = scheduler.now();      // 计时基准 = 开始播放的时刻（rAF 时间戳与 performance.now() 同源）
      carry = 0;
      frameId = scheduler.request(tick);
      emit();
    },
    pause,
    toggle() { playing ? pause() : api.play(); },
    stepForward() { pause(); index = clamp(index + 1, 0, steps.length); emit(); },
    stepBack() { pause(); index = clamp(index - 1, 0, steps.length); emit(); },
    seek(i) { pause(); index = clamp(Math.trunc(i), 0, steps.length); emit(); },
    setSpeed(mult) { speed = clamp(mult, 0.25, 8); emit(); },
    setSteps(next) { pause(); steps = [...next]; index = 0; emit(); },
    get state() { return { index, total: steps.length, playing, speed }; },
  };
  return api;
}
