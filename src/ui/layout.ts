import { COPY } from '../copy/zh';

/** 界面骨架暴露给装配层的挂载点（main.ts / 面板渲染函数往这些容器里注入内容） */
export interface Layout {
  controlsHost: HTMLElement;    // 控制卡内部容器（控件由 controls.ts 注入）
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

/** 卡片标题：左侧文案（来自 COPY）+ 右侧小标签（tagText 省略时留空，由后续任务补） */
function pane(title: string, tight = false, tagText?: string): HTMLElement {
  const card = el('div', tight ? 'card pane tight' : 'card pane');
  const h2 = el('h2', undefined, title);
  h2.append(el('span', 'tag', tagText));
  card.append(h2);
  return card;
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
  const arrayCard = pane(COPY.arrayView);
  const arrayHost = el('div', 'arraywrap');
  arrayCard.append(arrayHost);

  const structCard = pane(COPY.structureView);
  const structHost = el('div', 'structwrap');
  structCard.append(structHost);

  views.append(arrayCard, structCard);

  const bottom = el('div', 'bottom');

  const pseudoCard = pane(COPY.panelPseudo, true, COPY.panelPseudoTag);
  const pseudoHost = el('pre', 'code');
  pseudoCard.append(pseudoHost);

  const passesCard = pane(COPY.panelPasses, true, COPY.panelPassesTag);
  const passesHost = el('div', 'passtable');
  passesCard.append(passesHost);

  const stateCard = pane(COPY.panelState, true);
  const varsHost = el('div', 'stats vars');
  const countersHost = el('div', 'stats counters');
  const noteHost = el('div', 'status');
  const complexityHost = el('div', 'cx');
  stateCard.append(varsHost, countersHost, noteHost, complexityHost);

  bottom.append(pseudoCard, passesCard, stateCard);

  main.append(views, bottom);
  app.append(header, controlCard, main);
  root.append(app);

  return {
    controlsHost,
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
