# sortviz · 排序可视化实验室

输入自己的数据，一步一步看清每种内部排序到底做了什么：数组格子 + 结构视图双屏对照、伪代码同步高亮、每趟结果可直接与手算答案核对。

为 408 数据结构复习而做，同时是一个工程完整的作品集项目：TypeScript + 单元测试 + 零运行时依赖 + 插件式算法注册。

## 快速开始

```bash
npm install
npm run dev        # 本地开发（http://localhost:5173）
npm run build      # 类型检查 + 产出 dist/
npm run preview    # 本地预览构建产物（http://localhost:4173）
npm test           # 单元测试
```

本地看效果请用 `npm run preview` 或 `npm run dev`。**不要**直接双击 `dist/index.html`：Chrome 对 `type="module"` 脚本与带 `crossorigin` 的 CSS 在 `file://` 下按 CORS 拦截，会得到空白页（真·双击即用的单文件版在 P2 计划中）。

## 已支持（P0）

| 算法 | 最好 | 平均 | 最坏 | 空间 | 稳定性 |
|------|------|------|------|------|--------|
| 直接插入排序 | O(n) | O(n²) | O(n²) | O(1) | 稳定 |
| 冒泡排序 | O(n) | O(n²) | O(n²) | O(1) | 稳定 |
| 快速排序 | O(n log n) | O(n log n) | O(n²) | O(log n) | 不稳定 |

功能：

- 自定义数据输入（2–64 个整数，逗号/空格/顿号分隔，允许重复值与负数），带中文校验提示
- 随机数据、元素个数选择、播放速度
- 播放 / 暂停 / 单步前进 / 单步后退 / 跳到任意步（进度条），回退即时
- 双视图：左侧数组格子（下标 + i/j/pivot 指针 + 状态色），右侧结构视图（快排递归划分树、插入/冒泡有序区条；堆排的完全二叉树在 P1）
- 伪代码面板（当前执行行高亮）、变量面板、比较/交换/移动计数器、每趟结果表（可直接对答案）、复杂度卡

P1 计划补齐折半插入、希尔、简单选择、堆、2-路归并、基数共 6 种算法；P2 做柱状图视图、深色主题、快捷键、部署 GitHub Pages。

## 架构

```
数据输入 ──► Algorithm.run(data) ──► Step[] ──► Player（游标/播放/速度）
                                                   │
                        ┌──────────────────────────┼──────────────────────────┐
                        ▼                          ▼                          ▼
                  View（数组/结构/柱状）      Panels（伪代码/变量/计数器）   PassTable（每趟结果）
```

要点：

1. **算法只产出步骤流**（`Step[]`），不碰 DOM。步骤类型：`compare` / `swap` / `assign` / `mark` / `unmark` / `auxWrite` / `auxRead` / `note` / `passEnd`。
2. **视图与面板都是步骤流的纯函数消费者**。`replay(data, steps, k)` 把「前 k 步」算成一个纯数据 `ViewState`（数组内容、标记、递归栈、堆大小、辅助数组、计数器、每趟快照）。
3. **回退 = 从头重放**，不做逆操作。视图无需维护撤销状态，也就没有「撤销后状态不一致」这类 bug；n ≤ 64 时重放耗时在毫秒级。
4. **插件式注册**：新增一个算法 = 一个文件（`run()` 产 `Step[]` + 伪代码 + 复杂度元数据）注册进 `registry`，界面自动出现入口、伪代码、复杂度卡，内核零改动。

### 408 计数口径

| 动作 | 计法 |
|------|------|
| 一次交换 | 1 次交换 + **3** 次移动 |
| 一次赋值（移位/落位） | 1 次移动 |
| 取出 key 暂存 | 不计移动（只做视觉高亮） |
| 比较 | 1 次比较 |

### 目录结构

```
src/
├─ core/          step.ts（步骤类型与构造函数）· replay.ts（重放内核）· player.ts（播放器）· registry.ts（注册表）
├─ algorithms/    每种算法一个文件 + index.ts 注册清单
├─ views/         array-view.ts（数组格子）· structure-view.ts（结构视图）
├─ ui/            layout.ts（骨架）· controls.ts（控制条）· panels.ts（面板）· pass-table.ts（每趟结果）
├─ copy/zh.ts     全部界面文案（组件内不硬编码中文）
└─ theme.css      颜色/间距 token（唯一色值来源，视图里不写死颜色）
```

分层约束：`core/` 不 import `views/`、`ui/`；`algorithms/` 只 import `core/step`；`views/` 只读 `ViewState` 与 `ViewContext`，不 import 算法。

## 测试

```bash
npm test
```

覆盖：步骤构造函数与计数口径、重放内核不变量（任意前缀重放 = 逐步 apply；`mark range` 压栈/`unmark` 出栈成对）、播放器（注入假时钟：推进/夹取/自动暂停/速度）、三个算法的教材口径黄金样例（每趟快照与比较/交换/移动次数）、视图与面板的 DOM 约定、控制条的真实输入路径校验。

黄金样例（`tests/fixtures/golden.ts`）是按王道/严蔚敏口径人工核算的，测试失败时改实现而不是改夹具。

## 状态

- P0（可用版本）：已完成并打标 `v0.1.0`
- P1（9 算法 + 教学面板补全）、P2（柱状图/深色主题/快捷键/单文件本地版/部署）、P3（插件化验收）见 life-os 仓库的 `docs/superpowers/plans/2026-10-15-sortviz-implementation.md`

## 许可

MIT。教学思路参考了 USFCA 的算法可视化站点（David Galles），未复制其代码。
