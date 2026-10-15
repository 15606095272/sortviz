/**
 * 动画减弱偏好。抽成纯函数便于单测：jsdom 里没有真正的 matchMedia。
 * 系统开启「减弱动态效果」时，播放不做逐帧动画（每步 0ms，直接跳变）。
 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(
  matchMediaFn?: ((query: string) => MediaQueryList | null) | null,
): boolean {
  try {
    if (typeof matchMediaFn !== 'function') return false;
    return matchMediaFn(REDUCED_MOTION_QUERY)?.matches === true;
  } catch {
    return false;
  }
}

/** 每步毫秒数：减弱动画时 0（直接跳变），否则用基础值 */
export function stepDuration(reduced: boolean, base: number): number {
  return reduced ? 0 : base;
}
