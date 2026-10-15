# sortviz · 排序可视化实验室

输入自己的数据，一步一步看清每种内部排序到底做了什么：数组格子 + 结构视图双屏对照、伪代码同步高亮、变量值与每趟结果都能直接与手算答案核对。

为 408 数据结构复习而做，同时是一个工程完整的作品集项目：TypeScript + 单元测试 + 零运行时依赖 + 插件式算法注册。

## 快速开始

```bash
npm install
npm run dev        # 本地开发（http://localhost:5173）
npm run build      # 类型检查 + 产出 dist/
npm run preview    # 本地预览构建产物（http://localhost:4173）
npm test           # 单元测试
```

### 本地使用

两种方式看效果（**不要**直接双击 `dist/index.html`）：

| 方式 | 命令 | 说明 |
|------|------|------|
| 起服务器看构建产物 | `npm run preview` | 打开提示的 http://localhost:4173 ；`npm run dev` 同理（带热更新） |
| 零服务器单文件 | `npm run build:single` | 产出 `dist-single/sortviz.html`，**双击即可**，`file://` 直接可用 |

单文件版做了什么：用第二个配置 `vite.config.single.ts` 打成 IIFE 且 CSS 不拆分（`dist-single/app.js` + `app.css`），再由 `scripts/inline-single.mjs` 把 JS/CSS 全部内联进同一个 HTML。

**为什么需要它**：`dist/index.html` 里的脚本是 `type="module"`、CSS 带 `crossorigin`；Chrome 在 `file://` 下会按 CORS 拦截这两者，于是双击打开是一片空白页。单文件版没有外部 module / 带 crossorigin 的 CSS 请求，所以双击就能用（也方便直接发给别人）。

## 已支持（9 种内部排序）

| 算法 | 最好 | 平均 | 最坏 | 空间 | 稳定性 | 特征 |
|------|------|------|------|------|--------|------|
| 直接插入排序 | O(n) | O(n²) | O(n²) | O(1) | 稳定 | 基本有序时最快 |
| 折半插入排序 | O(n log n) | O(n²) | O(n²) | O(1) | 稳定 | 只优化比较次数，移动次数不变 |
| 希尔排序 | O(n log n) | 约 O(n^1.3) | O(n²) | O(1) | 不稳定 | 增量序列 n/2 折半 |
| 冒泡排序 | O(n) | O(n²) | O(n²) | O(1) | 稳定 | 每趟区间收缩 + 零交换提前结束 |
| 快速排序 | O(n log n) | O(n log n) | O(n²) | O(log n) | 不稳定 | 王道「前后指针」版划分 |
| 简单选择排序 | O(n²) | O(n²) | O(n²) | O(1) | 不稳定 | 比较次数恒为 n(n-1)/2 |
| 堆排序 | O(n log n) | O(n log n) | O(n log n) | O(1) | 不稳定 | 自底向上建大顶堆，逐趟换出堆顶 |
| 2-路归并排序 | O(n log n) | O(n log n) | O(n log n) | O(n) | 稳定 | 自底向上，段长 1→2→4 |
| 基数排序 | O(d(n+r)) | O(d(n+r)) | O(d(n+r)) | O(n+r) | 稳定 | LSD，按位分桶 |

另附**折半查找**（`category: 'search'`，用来验证插件契约）：在有序表上按区间收窄查找，数组视图用区间标记显示「当前查找区间」；目标默认取第二个元素，`run(input, target?)` 也支持显式传入。伪代码 8 行、实现约 75 行，**加它时 `src/core/` 一行未改**。

## 功能

- 自定义数据（2–64 个整数，逗号/空格/顿号分隔，允许重复与负数），中文校验提示
- 随机数据、元素个数、播放速度（0.25×–8×）
- 播放 / 暂停 / 单步前进 / 单步后退 / 拖进度条跳任意步 / 回到开头；播完按钮变「重播」
- **双视图**：左侧数组格子（下标 + `i`/`j`/`pivot` 彩色指针 + 状态配色 + 堆区虚线框），右侧结构视图随算法切换——
  快排=递归划分树、堆排=完全二叉树（分层排布 + 数组下标）、归并=分治区间、插入/选择/冒泡/希尔=有序区条；
  归并与基数排序还会显示**辅助数组行**
- 教学面板：伪代码当前行高亮、变量面板（带出真实变量值：`i`/`j`/`pivot`/`low`/`high`/`key`/`minIndex`/`增量 d`/`段长 width`/`堆大小`/`当前位`/`递归深度`…）、比较/交换/移动计数器、每趟结果表（与教材逐趟对照）、复杂度与稳定性卡
- **下标 0 基 / 1 基开关**：内部一律 0 基，切到 1 基时下标显示与动作说明里的 `a[k]` 一起 +1，便于与教材的 `A[1..n]` 叙述对照
- **主视图切换**：数组格子 ↔ 柱状图（结构视图始终保留；柱高按 `|值| / 当前最大值`，0 与负数有最小高度）
- **深色主题**：只覆盖一套语义 token，切换后用 `localStorage` 记住；两套主题的正文/语义色对比度都按 WCAG 核过
- **窄屏降级**：≤1180px 收紧、≤1024px 主视图与信息栏上下堆叠；数组按容器宽度自动决定每行格数（4–16），64 个元素也不出现横向滚动条
- **键盘操作**（焦点在输入框里时不拦截）：

  | 按键 | 作用 |
  |------|------|
  | `空格` | 播放 / 暂停（播完变「重播」） |
  | `←` / `→` | 单步后退 / 前进 |
  | `Shift` + `←` / `→` | 跳到上一趟 / 下一趟 |
  | `1`–`9` | 切换到第 1–9 种算法 |

- **动画减弱**：系统开启「减弱动态效果」时，播放直接跳变、所有过渡动画关闭
- **无服务器也能用**：`npm run build:single` 产出 `dist-single/sortviz.html`（JS/CSS 全内联），双击即可打开

## 架构

```
数据输入 ──► Algorithm.run(data) ──► Step[] ──► Player（游标/播放/速度）
                                                   │
                        ┌──────────────────────────┼──────────────────────────┐
                        ▼                          ▼                          ▼
                  View（数组/结构/柱状）      Panels（伪代码/变量/计数器）   PassTable（每趟结果）
```

要点：

1. **算法只产出步骤流**（`Step[]`），不碰 DOM。步骤类型：`compare` / `swap` / `assign` / `mark` / `unmark` / `auxWrite` / `auxRead` / `note` / `passEnd`；步骤还可带 `vars`（该时刻的变量真值）。
2. **视图与面板都是步骤流的纯函数消费者**。`replay(data, steps, k)` 把「前 k 步」算成一个纯数据 `ViewState`（数组内容、标记、递归栈、堆大小、辅助数组、变量值、计数器、每趟快照）。
3. **回退 = 从头重放**，不做逆操作。视图无需维护撤销状态，就没有「撤销后状态不一致」这类 bug；n ≤ 64 时重放耗时在毫秒级。
4. **插件式注册**：新增一个算法 = 一个文件（`run()` 产 `Step[]` + 伪代码 + 复杂度元数据）注册进 `registry`，界面自动出现 chip、伪代码、复杂度卡与变量面板，内核零改动。
5. **递归类算法用 `mark('range')` 覆盖整个递归调用**（而不是单次划分），这样 `callStack` 就是真正的递归栈，结构视图才能画出嵌套的划分树。

### 408 计数口径

| 动作 | 计法 |
|------|------|
| 一次交换 | 1 次交换 + **3** 次移动 |
| 一次赋值（移位/落位/回填） | 1 次移动 |
| 取出 key 暂存 | 不计移动（只做视觉高亮） |
| 写入辅助数组 / 进桶 | 不计移动（与暂存同源） |
| 比较 | 1 次比较 |

`.cell` 的 `data-index` 始终是 0 基（DOM 契约），只有**显示**随下标开关变化。

### 目录结构

```
src/
├─ core/          step.ts（步骤类型/构造函数/withVars）· replay.ts（重放内核）· player.ts（播放器）
│                 registry.ts（注册表 + 视图契约）· index-base.ts（下标进制换算）
├─ algorithms/    每种算法一个文件 + index.ts 注册清单（9 种）
├─ views/         array-view.ts（数组格子 + 辅助数组行）· structure-view.ts（递归树/完全二叉树/有序区条）
├─ ui/            layout.ts（骨架）· controls.ts（控制条）· panels.ts（面板，变量真值优先）· pass-table.ts
├─ copy/zh.ts     全部界面文案（组件内不硬编码中文）
└─ theme.css      颜色/间距 token（唯一色值来源，视图里不写死颜色）
```

分层约束：`core/` 不 import `views/`、`ui/`；`algorithms/` 只 import `core/step`；`views/` 只读 `ViewState` 与 `ViewContext`，不 import 算法。

## 如何加一个算法（或查找模块）

三步，**内核零改动**（`src/core/` 一行都不用碰；折半查找就是这么加进去的，`git diff --stat v0.3.0 HEAD -- src/core/` 为空）：

1. **写模块文件** `src/algorithms/<id>.ts`，导出一个对象：

   ```ts
   export const myAlgo = {
     id: 'my-algo',
     name: { zh: '中文名', en: 'English' },
     category: 'insert',                    // insert | swap | select | merge | radix | search | tree
     stable: true,
     complexity: { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
     pseudocode: [ { line: 1, indent: 0, text: '…' } ],
     defaultViews: ['array', 'structure'] as const,
     run(input: number[]): Step[] { /* 只产步骤流，不碰 DOM */ },
   };
   ```

   `run()` 里可用的步骤构造器（都来自 `src/core/step`）：

   | 构造器 | 语义 | 计数 |
   |--------|------|------|
   | `compareStep(i, j, codeLine, note)` | 比较 a[i] 与 a[j] | 1 次比较 |
   | `swapStep(i, j, codeLine, note)` | 交换 | 1 交换 + 3 移动 |
   | `assignStep(i, v, codeLine, note)` | 赋值/移位/回填 | 1 移动 |
   | `markStep(label, indices, codeLine, note?, range?)` / `unmarkStep` | 打/取消标记：`sorted` `pivot` `range` `heap` `active` `aux` | — |
   | `noteStep(note, codeLine)` | 只解说、不改数据 | — |
   | `passEndStep(snapshot, codeLine, note)` | 一趟结束快照（喂「每趟结果」表） | — |
   | `withVars(step, { i, j, … })` | 带出该步的**变量真值**给面板 | — |

   两个易踩的点：
   - `markStep('range', …, range)` **传了第 5 个参数**才会进递归栈（结构视图画成划分树）；不传就只上色（折半查找的「当前查找区间」就是后者）。
   - `withVars` 的键只能用这套词表：`i j mid low high pivot key minIndex gap k width lo hi place heapSize depth placed`；其中索引类键（`i j mid low high minIndex k lo hi root child`）在切「下标 1 基」时会自动 +1，值类（`pivot key gap width place heapSize`）不会。

2. **注册**：`src/algorithms/index.ts` 里加一行 `import`，再往 `BUILTIN_ORDER`（界面顺序）与 `MODULES` 各加一项。界面 chip、伪代码卡、复杂度卡、变量面板会自动出现。

3. **写测试**：`tests/algorithms/<id>.test.ts`，按教材口径把每趟快照与比较/交换/移动次数**人工核算**成黄金样例，并加至少一条可证伪的性质断言（例如折半查找「比较次数 ≤ ⌈log2(n+1)⌉」、选择排序「比较次数恒为 n(n-1)/2」、堆排序「每趟后末尾 k 个是最大的 k 个」）。

最小示例：**`src/algorithms/binary-search.ts`**（折半查找，8 行伪代码、约 75 行实现，含区间标记、命中/失败文案与 `target` 可选参数），配套测试 `tests/algorithms/binary-search.test.ts`。

## 测试

```bash
npm test
```

覆盖：步骤构造函数与计数口径、重放内核不变量（任意前缀重放 = 逐步 apply；`mark range` 压栈/`unmark` 出栈成对；`vars` 后写覆盖）、播放器（注入假时钟：推进/夹取/自动暂停/速度）、**9 种算法的教材口径黄金样例**（每趟快照 + 比较/交换/移动次数）、视图与面板的 DOM 约定（含下标进制换算）、控制条的真实输入路径校验。

黄金样例（`tests/fixtures/golden.ts`）是按王道/严蔚敏口径**人工核算**的：插入 7 趟、冒泡含零交换那趟、快排首趟划分与计数、希尔增量 4/2/1 三趟、选择 7 趟且比较恒为 28、堆建初堆 `[97,76,65,49,49,13,27,38]`、归并段长 1/2/4、基数个位/十位两趟。**测试失败时改实现，不改夹具**（夹具本身若被重新核算证伪，会在注释里写清推导依据）。

稳定性断言是可证伪的：例如插入/折半插入用 `[49,49,38]` 的移动数锁定「等值插到右侧」，归并用「等值取左段」，基数用「个位相同的 97 仍排在 27 之前」。

另有一个浏览器交互冒烟脚本 `scripts/interaction-smoke.mjs`（零依赖，用 CDP 真点页面：播放推进/暂停/单步/回开头/切算法/伪代码与结构视图联动/非法输入/换数据），改动 UI 后可跑一遍确认「页面不是静态的」。用法见脚本头部注释。

单文件构建由 `scripts/inline-single.mjs` 完成（`npm run build:single` 调用它把 JS/CSS 内联进 `dist-single/sortviz.html`），配合 `vite.config.single.ts` 使用，详见「快速开始 → 本地使用」。

另有一个可重复的浏览器验收脚本 `scripts/p1-acceptance.mjs`（零依赖 CDP，逐个算法核对 DOM 与面板/结构视图/伪代码联动），改动视图或面板后可跑一遍做回归。

## 部署到 GitHub Pages

工作流文件 `.github/workflows/deploy.yml` 已随仓库提供：推送到 `main`（或在 Actions 页手动触发 `workflow_dispatch`）后，它会自动执行 `npm ci` → `npm test` → `npm run build`，再把 `dist/` 作为 Pages 制品上传并发布。两个 job：`build` 负责构建与测试，`deploy` 负责发布（`needs: build`，挂在 `github-pages` environment 上）。

前提：**`package-lock.json` 必须入库**（`npm ci` 依赖它；本仓库已入库）。另外 `vite.config.ts` 里是 `base: './'`，相对路径，因此 `/<仓库名>/` 这种子路径部署不会丢 JS/CSS。

**你自己需要执行的两条命令 / 两步**（本机没有 `gh` CLI、仓库也还没有 remote，所以这部分只能你来做，我没有代跑）：

1. **建远程仓库并推送**（把 `<用户名>` 换成你的 GitHub 用户名）：

   ```bash
   git remote add origin https://github.com/<用户名>/sortviz.git && git push -u origin main
   ```

2. **在仓库 Settings → Pages → Build and deployment → Source 里把来源选成 `GitHub Actions`**（这是一个网页操作，不是命令行；**不要**选 "Deploy from a branch"）。

之后每次推 `main` 都会重新构建与发布，预期访问地址形如：

```
https://<用户名>.github.io/sortviz/
```

## 状态

- P0（可用版本）：9 种算法中的 3 种 + 双视图 + 教学面板 → 已打标 `v0.1.0`
- P1：9 种算法齐全 + 变量面板真值 + 下标进制开关 → 已打标 `v0.2.0`
- P2（打磨与发布）：
  - 柱状图视图 → ✅ 已完成
  - 快捷键与无障碍 → ✅ 已完成
  - 深色主题 → ✅ 已完成
  - 窄屏降级 → ✅ 已完成
  - 动画减弱（`prefers-reduced-motion`）→ ✅ 已完成
  - 双击即用的单文件版（`npm run build:single`）→ ✅ 已完成
  - 内联 SVG favicon + meta，控制台零 404 → ✅ 已完成
  - GitHub Pages 部署工作流 → ✅ 工作流文件已就绪；**线上生效待你推送后生效**（本机无 `gh`/remote，未执行推送）
  - Lighthouse 验收（本地 `dist/`、移动端模拟节流）：performance **100** / accessibility **100** / best-practices **100** / seo **100**；控制台 0 错误 0 失败请求
    （修法：`--muted` 白卡上仅 3.71:1、`--c-accent` 上压白字仅 3.50:1、播放按钮借用的奶茶色仅 2.80:1，三处按 WCAG 加深后 `color-contrast` 失败节点归零）
- P3：折半查找模块（验证插件接口，内核零改动）与插件化文档 → 已完成，已打标 `v1.0.0`
- 完整计划见 life-os 仓库 `docs/superpowers/plans/2026-10-15-sortviz-implementation.md`

## 许可

MIT。教学思路参考了 USFCA 的算法可视化站点（David Galles），未复制其代码。
