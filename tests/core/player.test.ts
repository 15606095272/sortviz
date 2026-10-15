import { createPlayer, type Scheduler } from '../../src/core/player';
import { compareStep } from '../../src/core/step';

function fakeScheduler() {
  let t = 0; let id = 0; const queue = new Map<number, (t: number) => void>();
  const scheduler: Scheduler = {
    now: () => t,
    request: (cb) => { id += 1; queue.set(id, cb); return id; },
    cancel: (i) => { queue.delete(i); },
  };
  return {
    scheduler,
    advance(ms: number) {
      t += ms;
      for (const [i, cb] of [...queue]) { queue.delete(i); cb(t); }
    },
  };
}

const STEPS = [compareStep(0, 1, 1, '一步'), compareStep(1, 2, 2, '两步'), compareStep(2, 3, 3, '三步')];

describe('播放器', () => {
  const setup = () => {
    const clock = fakeScheduler();
    const seen: number[] = [];
    const player = createPlayer({ steps: STEPS, onIndex: (i) => seen.push(i), scheduler: clock.scheduler, msPerStep: 100 });
    return { clock, seen, player };
  };

  it('初始在第 0 步，未播放', () => {
    const { player } = setup();
    expect(player.state).toEqual({ index: 0, total: 3, playing: false, speed: 1 });
  });

  it('播放时按 msPerStep 推进', () => {
    const { clock, player } = setup();
    player.play();
    clock.advance(100);
    expect(player.state.index).toBe(1);
    clock.advance(200);
    expect(player.state.index).toBe(3);
  });

  it('走到末尾自动暂停，不越界', () => {
    const { clock, player } = setup();
    player.play();
    clock.advance(1000);
    expect(player.state.index).toBe(3);
    expect(player.state.playing).toBe(false);
  });

  it('速度 2x 时同样时间走两步', () => {
    const { clock, player } = setup();
    player.setSpeed(2);
    player.play();
    clock.advance(100);
    expect(player.state.index).toBe(2);
  });

  it('单步前进 / 后退夹在 [0, total]', () => {
    const { player } = setup();
    player.stepForward();
    player.stepForward();
    player.stepBack();
    expect(player.state.index).toBe(1);
    player.stepBack(); player.stepBack();
    expect(player.state.index).toBe(0);
  });

  it('seek 夹取范围并暂停播放', () => {
    const { clock, player } = setup();
    player.play();
    player.seek(99);
    expect(player.state.playing).toBe(false);
    expect(player.state.index).toBe(3);
    player.seek(-5);
    expect(player.state.index).toBe(0);
    clock.advance(500);
    expect(player.state.index).toBe(0);      // 已暂停，时钟再走也不动
  });

  it('setSteps 换数据后回到第 0 步', () => {
    const { player } = setup();
    player.stepForward();
    player.setSteps([STEPS[0]]);
    expect(player.state).toEqual({ index: 0, total: 1, playing: false, speed: 1 });
  });

  it('速度夹在 0.25x–8x', () => {
    const { player } = setup();
    player.setSpeed(100);
    expect(player.state.speed).toBe(8);
    player.setSpeed(0);
    expect(player.state.speed).toBe(0.25);
  });
});
