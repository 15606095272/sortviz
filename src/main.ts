import './theme.css';
import { registerView, getAlgorithm, getView, listAlgorithms, type ViewContext } from './core/registry';
import { registerBuiltinAlgorithms } from './algorithms';
import { createPlayer } from './core/player';
import { replay, deriveStats, derivePasses } from './core/replay';
import { createArrayView } from './views/array-view';
import { createStructureView } from './views/structure-view';
import { createLayout } from './ui/layout';
import { createControls, type Controls } from './ui/controls';
import { renderPseudocode, renderVars, renderCounters, renderActionNote, renderComplexity } from './ui/panels';
import { renderPassTable } from './ui/pass-table';
import { COPY } from './copy/zh';
import type { Step } from './core/step';
import { formatIndex, type IndexBase } from './core/index-base';

const MAX_STEPS = 20000;
const DEFAULT_DATA = [49, 38, 65, 97, 76, 13, 27, 49];

export function mountApp(root: HTMLElement): void {
  registerBuiltinAlgorithms();
  registerView(createArrayView());
  registerView(createStructureView());

  const layout = createLayout(root);
  let algorithmId = listAlgorithms()[0].id;
  let data = [...DEFAULT_DATA];
  let steps: Step[] = [];
  let controls: Controls | null = null;      // 先声明后赋值：renderAt 内部要用
  let indexBase: IndexBase = 0;              // 展示口径：内部一律 0 基，切 1 基只改显示与文案

  const renderAt = (index: number): void => {
    const algo = getAlgorithm(algorithmId);
    const ctx: ViewContext = { data, algorithmId, indexBase };
    const state = replay(data, steps, index);
    getView('array')?.render(state, ctx);
    getView('structure')?.render(state, ctx);
    // 卡片右上角标签（实物稿里是「下标 0 – 7」「快排 → 递归划分树」这类动态说明）
    layout.arrayTag.textContent = COPY.indexRange
      .replace('{from}', String(formatIndex(0, indexBase)))
      .replace('{to}', String(formatIndex(Math.max(data.length - 1, 0), indexBase)));
    layout.structTag.textContent =
      (COPY.structureTag as Record<string, string>)[algorithmId] ?? COPY.structureTagDefault;
    // 第 0 步还没执行任何一步，state.lastCodeLine 是 0（哨兵值，伪代码里没有第 0 行）。
    // 此时回落到本算法的第一行伪代码，避免「当前执行行已高亮」的标签下没有任何高亮行。
    const activeLine = state.lastCodeLine || algo.pseudocode[0]?.line || 0;
    renderPseudocode(layout.pseudoHost, algo.pseudocode, activeLine);
    renderVars(layout.varsHost, state, algorithmId);
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

  const player = createPlayer({ steps, onIndex: renderAt });

  controls = createControls(layout.controlsHost, {
    algorithmIds: listAlgorithms().map((a) => a.id),
    onAlgorithm: (id) => rebuild(id, data),
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
  });

  function rebuild(nextAlgorithmId = algorithmId, nextData = data): void {
    algorithmId = nextAlgorithmId;
    data = [...nextData];
    const ctx: ViewContext = { data, algorithmId, indexBase };
    steps = getAlgorithm(algorithmId).run(data);
    if (steps.length > MAX_STEPS) { steps = steps.slice(0, MAX_STEPS); controls?.setError(COPY.errorTooLong); }
    // 先 mount 再 setSteps：setSteps 会立刻 emit renderAt(0)，而视图的 render 在
    // mount 之前会直接 return（内部 host 还是 null）。反过来的话首帧就是 8 个空格子。
    getView('array')?.mount(layout.arrayHost, ctx);
    getView('structure')?.mount(layout.structHost, ctx);
    player.setSteps(steps);                      // 会重置到第 0 步并触发 renderAt(0)
  }

  rebuild();
  controls?.setIndexBase(indexBase);
}

function randomData(count: number): number[] {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 999));
}

mountApp(document.querySelector('#app')!);
