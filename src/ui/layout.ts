import { COPY } from '../copy/zh';

/** 界面骨架暴露给装配层的挂载点（main.ts / 面板渲染函数往这些容器里注入内容） */
export interface Layout {
  controlsHost: HTMLElement;    // 控制卡内部容器（控件由 controls.ts 注入）
  arrayTag: HTMLElement;        // 左卡标题右侧标签（下标范围，动态）
  structTag: HTMLElement;       // 右卡标题右侧标签（当前算法的结构说明，动态）
  stateTag: HTMLElement;        // 状态卡标题右侧标签（趟次 / 递归深度，动态）
  arrayHost: HTMLElement;       // 左卡「数组视图」的内容区
  structHost: HTMLElement;      // 右卡「结构视图」的内容区
  pseudoHost: HTMLElement;      // 伪代码卡内容区
  passesHost: HTMLElement;      // 每趟结果卡内容区
  varsHost: HTMLElement;        // 状态卡：变量区
  countersHost: HTMLElement;    // 状态卡：计数器区
  noteHost: HTMLElement;        // 状态卡：当前动作说明
  complexityHost: HTMLElement;  // 状态卡：复杂度区（底部）
}

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** 卡片标题：左侧文案（来自 COPY）+ 右侧小标签（返回 tag 供装配层动态填内容） */
function pane(title: string, tight = false, tagText?: string): { card: HTMLElement; tag: HTMLElement } {
  const card = el('div', tight ? 'card pane tight' : 'card pane');
  const h2 = el('h2', undefined, title);
  const tag = el('span', 'tag', tagText);
  h2.append(tag);
  card.append(h2);
  return { card, tag };
}

/** 数组视图底部的状态图例（与 .cell 的 data-mark 颜色一一对应） */
function legend(): HTMLElement {
  const box = el('div', 'legend');
  const items: Array<[string, string]> = [
    ['d-sorted', COPY.legendSorted],
    ['d-comparing', COPY.legendComparing],
    ['d-pivot', COPY.legendPivot],
    ['d-default', COPY.legendDefault],
  ];
  for (const [dotClass, text] of items) {
    const span = el('span');
    span.append(el('i', `dot ${dotClass}`), document.createTextNode(text));
    box.append(span);
  }
  return box;
}

/**
 * 按实物稿 C（米白卡片风 · 双视图 · 底部三卡）搭骨架。
 * 只负责结构、class 与文案，不写任何颜色（颜色统一归 theme.css）。
 */
export function createLayout(root: HTMLElement): Layout {
  root.innerHTML = '';

  const app = el('div', 'app');

  // 顶栏
  const header = el('header');
  const h1 = el('h1', undefined, COPY.appTitle);
  h1.append(el('em', undefined, COPY.appSubtitle));
  header.append(h1);

  // 控制卡：控件（chips / 数据 / 播放 / 速度 / 进度）由 controls.ts 注入到内部容器
  const controlCard = el('div', 'card ctrl');
  const controlsHost = el('div', 'ctrl-inner');
  controlCard.append(controlsHost);

  // 主区：上半双视图，下半三卡
  const main = el('main');

  const views = el('div', 'views');
  // 数组卡：居中区里放「数组挂载点 + 图例」，图例不会被视图的 mount 清空
  const arrayPane = pane(COPY.arrayView);
  const arrayWrap = el('div', 'arraywrap');
  const arrayHost = el('div');
  arrayWrap.append(arrayHost, legend());
  arrayPane.card.append(arrayWrap);

  const structPane = pane(COPY.structureView);
  const structHost = el('div', 'structwrap');
  structPane.card.append(structHost);

  views.append(arrayPane.card, structPane.card);

  const bottom = el('div', 'bottom');

  const pseudoPane = pane(COPY.panelPseudo, true, COPY.panelPseudoTag);
  const pseudoHost = el('pre', 'code');
  pseudoPane.card.append(pseudoHost);

  const passesPane = pane(COPY.panelPasses, true, COPY.panelPassesTag);
  const passesHost = el('div', 'passtable');
  passesPane.card.append(passesHost);

  const statePane = pane(COPY.panelState, true);
  const varsHost = el('div', 'stats vars');
  const countersHost = el('div', 'stats counters');
  const noteHost = el('div', 'status');
  // 动作说明每步都在变：挂 aria-live=polite，屏幕阅读器会在空闲时报出当前动作
  noteHost.setAttribute('role', 'group');
  noteHost.setAttribute('aria-live', 'polite');
  const complexityHost = el('div', 'cx');
  statePane.card.append(varsHost, countersHost, noteHost, complexityHost);

  bottom.append(pseudoPane.card, passesPane.card, statePane.card);

  main.append(views, bottom);
  app.append(header, controlCard, main);
  root.append(app);

  return {
    controlsHost,
    arrayTag: arrayPane.tag,
    structTag: structPane.tag,
    stateTag: statePane.tag,
    arrayHost,
    structHost,
    pseudoHost,
    passesHost,
    varsHost,
    countersHost,
    noteHost,
    complexityHost,
  };
}
