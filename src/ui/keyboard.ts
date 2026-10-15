/**
 * 全局键盘快捷键。纯函数：返回 true 表示「已处理」，调用方据此 preventDefault。
 * 焦点在输入类元素里时一概不拦（否则用户没法在数据框里打字）。
 */
export interface KeyDeps {
  /** 按界面 chip 顺序排列的算法 id（数字键 1..9 对应） */
  algorithmIds: string[];
  /** 下一个「趟」边界对应的步下标；没有则 null */
  nextPass(): number | null;
  /** 上一个「趟」边界对应的步下标；没有则 null */
  prevPass(): number | null;
  onToggle(): void;
  onStepForward(): void;
  onStepBack(): void;
  onSeek(index: number): void;
  onAlgorithm(id: string): void;
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  if (EDITABLE_TAGS.has(el.tagName)) return true;
  return el.isContentEditable === true;
}

export function handleKey(event: KeyboardEvent, deps: KeyDeps): boolean {
  if (isEditable(event.target)) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;

  const { key, shiftKey } = event;

  if (key === ' ' || key === 'Spacebar') {
    deps.onToggle();
    return true;
  }

  if (key === 'ArrowRight') {
    if (shiftKey) {
      const next = deps.nextPass();
      if (next === null) return false;
      deps.onSeek(next);
      return true;
    }
    deps.onStepForward();
    return true;
  }

  if (key === 'ArrowLeft') {
    if (shiftKey) {
      const prev = deps.prevPass();
      if (prev === null) return false;
      deps.onSeek(prev);
      return true;
    }
    deps.onStepBack();
    return true;
  }

  if (/^[1-9]$/.test(key)) {
    const id = deps.algorithmIds[Number(key) - 1];
    if (id === undefined) return false;
    deps.onAlgorithm(id);
    return true;
  }

  return false;
}
