import { prefersReducedMotion, stepDuration, REDUCED_MOTION_QUERY } from '../../src/ui/motion';

describe('动画减弱', () => {
  it('开启减弱时每步 0ms（直接跳变）', () => {
    expect(stepDuration(true, 260)).toBe(0);
  });

  it('未开启时用基础值', () => {
    expect(stepDuration(false, 260)).toBe(260);
    expect(stepDuration(false, 0)).toBe(0);
  });

  it('从 matchMedia 读偏好：matches=true → true', () => {
    const fn = (q: string) => ({ matches: q === REDUCED_MOTION_QUERY }) as MediaQueryList;
    expect(prefersReducedMotion(fn)).toBe(true);
  });

  it('matches=false → false；没有 matchMedia 时也 false', () => {
    expect(prefersReducedMotion(() => ({ matches: false }) as MediaQueryList)).toBe(false);
    expect(prefersReducedMotion(undefined)).toBe(false);
    expect(prefersReducedMotion(null)).toBe(false);
  });

  it('matchMedia 抛异常时静默回退 false', () => {
    expect(
      prefersReducedMotion(() => {
        throw new Error('nope');
      }),
    ).toBe(false);
  });
});
