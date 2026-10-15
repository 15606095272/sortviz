import { createLayout } from '../../src/ui/layout';
import { COPY } from '../../src/copy/zh';

describe('布局骨架', () => {
  it('9 个 host 都存在且互不相同，双视图卡标题取文案字典', () => {
    const root = document.createElement('div');
    const layout = createLayout(root);

    const hosts = [
      layout.controlsHost,
      layout.arrayHost,
      layout.structHost,
      layout.pseudoHost,
      layout.passesHost,
      layout.varsHost,
      layout.countersHost,
      layout.noteHost,
      layout.complexityHost,
    ];
    expect(hosts).toHaveLength(9);
    for (const h of hosts) {
      expect(h).toBeInstanceOf(HTMLElement);
      expect(root.contains(h)).toBe(true);
    }
    expect(new Set(hosts).size).toBe(9);

    expect(root.querySelectorAll('.card.pane').length).toBeGreaterThanOrEqual(5);
    expect(root.querySelector('.views')).not.toBeNull();
    expect(root.querySelector('.bottom')).not.toBeNull();

    const titles = [...root.querySelectorAll('.pane h2')].map((h) => h.textContent);
    expect(titles.some((t) => t?.startsWith(COPY.arrayView))).toBe(true);
    expect(titles.some((t) => t?.startsWith(COPY.structureView))).toBe(true);
    // 视图标题右侧小标签占位（文案由后续任务补）
    expect(root.querySelectorAll('.views .tag')).toHaveLength(2);
  });

  it('重复调用会清空 root 后重建（可重入）', () => {
    const root = document.createElement('div');
    createLayout(root);
    const second = createLayout(root);
    expect(root.querySelectorAll('.views')).toHaveLength(1);
    expect(root.contains(second.controlsHost)).toBe(true);
  });

  it('组件 JS 不写死颜色：DOM 内不出现内联色值', () => {
    const root = document.createElement('div');
    createLayout(root);
    expect(root.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(root.innerHTML).not.toContain('rgb(');
  });
});
