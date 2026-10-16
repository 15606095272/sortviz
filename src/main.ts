import './theme.css';
import { registerView, getAlgorithm, getView, listAlgorithms, type ViewContext, type ViewKind } from './core/registry';
import { registerBuiltinAlgorithms } from './algorithms';
import { createPlayer } from './core/player';
import { replay, deriveStats, derivePasses } from './core/replay';
import { createArrayView } from './views/array-view';
import { createBarView } from './views/bar-view';
import { createStructureView } from './views/structure-view';
import { createLayout } from './ui/layout';
import { createControls, type Controls } from './ui/controls';
import { handleKey } from './ui/keyboard';
import { renderPseudocode, renderCode, renderVars, renderCounters, renderActionNote, renderComplexity } from './ui/panels';
import { renderPassTable } from './ui/pass-table';
import { COPY } from './copy/zh';
import type { Step } from './core/step';
import { formatIndex, type IndexBase } from './core/index-base';
import { applyTheme, loadTheme, saveTheme, type Theme } from './ui/theme';
import { loadOrder, saveOrder, type Order } from './core/order';
import { loadLang, saveLang, type CodeLang } from './core/code';
import { prefersReducedMotion, stepDuration } from './ui/motion';

const MAX_STEPS = 20000;
const DEFAULT_DATA = [49, 38, 65, 97, 76, 13, 27, 49];
// 1x 速度下每步毫秒数。240 是 createPlayer 的默认值（此前 main.ts 未传该参数），
// 这里只是把「隐含默认」显式化，不改默认播放速度。
const BASE_MS_PER_STEP = 240;
/** 代码语言的显示名（代码卡标签与语言胶囊共用一份，统一走 COPY） */
const LANG_TEXT: Record<CodeLang, string> = {
  c: COPY.langC,
  cpp: COPY.langCpp,
  java: COPY.langJava,
  python: COPY.langPython,
};

export function mountApp(root: HTMLElement): void {
  // 主题必须先落地再渲染第一帧：否则深色偏好用户会先看到一帧浅色（白闪）。
  // loadTheme 自带兜底，localStorage 不可用时静默回退浅色。
  let theme: Theme = loadTheme(window.localStorage);
  applyTheme(theme);

  registerBuiltinAlgorithms();
  registerView(createArrayView());
  registerView(createBarView());
  registerView(createStructureView());

  const layout = createLayout(root);
  let algorithmId = listAlgorithms()[0].id;
  let data = [...DEFAULT_DATA];
  let steps: Step[] = [];
  let controls: Controls | null = null;      // 先声明后赋值：renderAt 内部要用
  let indexBase: IndexBase = 0;              // 展示口径：内部一律 0 基，切 1 基只改显示与文案
  let viewKind: ViewKind = 'array';          // 左侧主视图：数组视图 / 柱状图（右侧结构视图始终保留）
  let order: Order = loadOrder(window.localStorage);   // 排序方向：默认升序，偏好存 localStorage
  let lang: CodeLang = loadLang(window.localStorage);  // 代码面板的展示语言：默认 C，偏好存 localStorage

  // 切换主视图时互斥：先销毁两个主视图再挂载当前那个（避免残留 DOM 与事件）
  const mountMainView = (ctx: ViewContext): void => {
    const arrayView = getView('array');
    const barView = getView('bar');
    arrayView?.destroy();
    barView?.destroy();
    if (viewKind === 'bar') barView?.mount(layout.arrayHost, ctx);
    else arrayView?.mount(layout.arrayHost, ctx);
  };

  const renderAt = (index: number): void => {
    const algo = getAlgorithm(algorithmId);
    const ctx: ViewContext = { data, algorithmId, indexBase };
    const state = replay(data, steps, index);
    if (viewKind === 'bar') getView('bar')?.render(state, ctx);
    else getView('array')?.render(state, ctx);
    getView('structure')?.render(state, ctx);
    // 卡片右上角标签（实物稿里是「下标 0 – 7」「快排 → 递归划分树」这类动态说明）
    layout.arrayTag.textContent = COPY.indexRange
      .replace('{from}', String(formatIndex(0, indexBase)))
      .replace('{to}', String(formatIndex(Math.max(data.length - 1, 0), indexBase)));
    layout.structTag.textContent =
      (COPY.structureTag as Record<string, string>)[algorithmId] ?? COPY.structureTagDefault;
    // 第 0 步还没执行任何一步，state.lastCodeLine 是 0（哨兵值，步骤流里没有第 0 行）。
    // 此时回落到本算法的第一个语义行，避免「当前执行行已高亮」的标签下没有任何高亮行。
    const activeLine = state.lastCodeLine || algo.pseudocode[0]?.line || 0;
    // 已迁移到真实代码的模块渲染四语言代码（高亮按 anchor 命中，可能多行），
    // 未迁移的模块回落渲染 pseudocode 骨架（保证 9 个模块不迁移也能正常用）
    if (algo.code) renderCode(layout.pseudoHost, algo.code, lang, activeLine);
    else renderPseudocode(layout.pseudoHost, algo.pseudocode, activeLine);
    // 代码卡标题与右上角标签：有真实代码时写「{lang} 代码」；降序时追加提示，
    // 说清「代码写的是升序写法、当前跑的是降序」（比较符反向即可）——伪代码回落时同样适用
    layout.pseudoTitle.textContent = algo.code ? COPY.panelCode : COPY.panelPseudo;
    layout.pseudoTag.textContent =
      (algo.code ? COPY.codeTag.replace('{lang}', LANG_TEXT[lang]) : COPY.panelPseudoTag) +
      (order === 'desc' ? ` · ${COPY.codeDescHint}` : '');
    renderVars(layout.varsHost, state, algorithmId, indexBase);
    renderCounters(layout.countersHost, deriveStats(steps, index));
    renderActionNote(layout.noteHost, state.lastNote, indexBase);
    renderComplexity(layout.complexityHost, algo.complexity, algo.stable);
    const passes = derivePasses(steps, index);
    renderPassTable(layout.passesHost, data, passes, passes.length > 0 ? passes.length : null);
    const passNo = passes.length;
    const depth = String(state.callStack.length);
    layout.stateTag.textContent =
      passNo > 0
        ? COPY.stateTagPass.replace('{pass}', String(passNo)).replace('{depth}', depth)
        : index > 0
          ? // 只有真的在递归里（callStack 非空）才报递归深度，堆/冒泡这类没有递归
            state.callStack.length > 0
            ? COPY.stateTagProgress.replace('{depth}', depth)
            : COPY.stateTagRunning
          : COPY.stateTagStart;
    controls?.setPass(passNo > 0 ? COPY.pass.replace('{pass}', String(passNo)) : '');
    controls?.setProgress(index, steps.length, player.state.speed, player.state.playing);
  };

  // 系统开启「减弱动态效果」时每步 0ms：播放直接跳变，不做逐帧动画。
  // matchMedia 缺失（老浏览器 / 非浏览器环境）由 prefersReducedMotion 内部兜底成 false。
  const msPerStep = stepDuration(
    prefersReducedMotion(window.matchMedia?.bind(window)),
    BASE_MS_PER_STEP,
  );
  const player = createPlayer({ steps, onIndex: renderAt, msPerStep });

  /** 走完一趟所需的「步数」：steps 里 passEnd 的下标 +1，seek 到它恰好停在那一趟末尾 */
  function passEnds(): number[] {
    const out: number[] = [];
    steps.forEach((s, i) => {
      if (s.kind === 'passEnd') out.push(i + 1);
    });
    return out;
  }

  /** 切换算法的唯一入口：chip 点击、键盘数字键都走这里，避免两份高亮/重建逻辑 */
  function selectAlgorithm(id: string): void {
    controls?.setAlgorithm(id);   // 先把高亮落到目标 chip（键盘切算法时没有鼠标点击去点亮它）
    rebuild(id, data);
  }

  controls = createControls(layout.controlsHost, {
    algorithmIds: listAlgorithms().map((a) => a.id),
    onAlgorithm: (id) => selectAlgorithm(id),
    onData: (next) => rebuild(algorithmId, next),
    onRandom: () => rebuild(algorithmId, randomData(data.length)),
    onPlayToggle: () => player.toggle(),
    onStepForward: () => player.stepForward(),
    onStepBack: () => player.stepBack(),
    onSeek: (i) => player.seek(i),
    onSpeed: (m) => player.setSpeed(m),
    // 只重渲染当前步：不重新 mount、不重跑算法（下标进制与算法结果无关）
    onIndexBase: (base) => {
      indexBase = base;
      controls?.setIndexBase(base);
      renderAt(player.state.index);
    },
    // 切主视图：不重跑算法，只换挂载点 + 按当前步重渲染
    onView: (kind) => {
      viewKind = kind;
      controls?.setView(kind);
      const ctx: ViewContext = { data, algorithmId, indexBase };
      mountMainView(ctx);
      renderAt(player.state.index);
    },
    // 切主题：只落 data-theme + 存偏好，不重建视图、不重跑算法（颜色只在 CSS token 里）
    onTheme: (next) => {
      theme = next;
      applyTheme(theme);
      saveTheme(theme, window.localStorage);
      controls?.setTheme(theme);
    },
    // 切排序方向：步骤流本身就依赖方向，所以必须重跑算法（不是只重渲染当前步）
    onOrder: (next) => {
      order = next;
      saveOrder(order, window.localStorage);
      controls?.setOrder(order);
      rebuild();
    },
    // 切代码语言：只换代码面板展示的实现，算法结果不变，所以只重渲染当前步（与 onIndexBase 同风格）
    onLang: (next) => {
      lang = next;
      saveLang(lang, window.localStorage);
      controls?.setLang(lang);
      renderAt(player.state.index);
    },
  });

  function rebuild(nextAlgorithmId = algorithmId, nextData = data): void {
    algorithmId = nextAlgorithmId;
    data = [...nextData];
    const ctx: ViewContext = { data, algorithmId, indexBase };
    // 方向作为可选参数传给每个算法模块（run 的契约仍是 (input) => Step[]，多一个可选参数不破坏契约）
    steps = getAlgorithm(algorithmId).run(data, { order });
    if (steps.length > MAX_STEPS) { steps = steps.slice(0, MAX_STEPS); controls?.setError(COPY.errorTooLong); }
    // 先 mount 再 setSteps：setSteps 会立刻 emit renderAt(0)，而视图的 render 在
    // mount 之前会直接 return（内部 host 还是 null）。反过来的话首帧就是 8 个空格子。
    mountMainView(ctx);
    getView('structure')?.mount(layout.structHost, ctx);
    player.setSteps(steps);                      // 会重置到第 0 步并触发 renderAt(0)
  }

  rebuild();
  controls?.setIndexBase(indexBase);
  controls?.setView(viewKind);
  controls?.setTheme(theme);
  controls?.setOrder(order);
  controls?.setLang(lang);

  // 全局键盘快捷键：空格播放/暂停、←/→ 单步、Shift+←/→ 跳趟、1..9 切算法。
  // handleKey 在输入框内一律返回 false，所以这里放心 preventDefault（也不会吞掉打字）。
  window.addEventListener('keydown', (event) => {
    const handled = handleKey(event, {
      algorithmIds: listAlgorithms().map((a) => a.id),
      nextPass: () => passEnds().find((n) => n > player.state.index) ?? null,
      prevPass: () => {
        const before = passEnds().filter((n) => n < player.state.index);
        return before.length > 0 ? before[before.length - 1] : null;
      },
      onToggle: () => player.toggle(),
      onStepForward: () => player.stepForward(),
      onStepBack: () => player.stepBack(),
      onSeek: (i) => player.seek(i),
      onAlgorithm: (id) => selectAlgorithm(id),
    });
    if (handled) event.preventDefault();
  });
}

function randomData(count: number): number[] {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 999));
}

mountApp(document.querySelector('#app')!);
