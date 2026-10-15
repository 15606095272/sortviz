// P1 验收脚本：用 CDP 真浏览器逐个走 9 种算法，核对视图/面板/交互是否都在位。
//
// 用法（三步）：
//   1) 构建并起静态服务：npm run build && python3 -m http.server 4180 --bind 0.0.0.0 --directory dist
//   2) 起调试版浏览器：
//      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
//        --remote-debugging-port=9225 --user-data-dir=/tmp/sortviz-accept http://127.0.0.1:4180/
//   3) node scripts/p1-acceptance.mjs           # 退出码非 0 表示有验收项失败
//
// 零依赖：Node 22 自带 fetch 与 WebSocket。

const PORT = process.env.CDP_PORT ?? '9225';
const URL_MATCH = process.env.CDP_URL_MATCH ?? '4180';

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const target = list.find((t) => t.type === 'page' && t.url.includes(URL_MATCH));
if (!target) {
  console.error('没找到目标页面，检查浏览器是否已用 --remote-debugging-port 打开目标地址');
  process.exit(2);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener('open', r));
const send = (method, params) => new Promise((res) => {
  const i = ++seq; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
});
const js = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send('Page.reload', { ignoreCache: true });
await sleep(1000);
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

const failures = [];
const check = (ok, label, detail) => {
  if (!ok) failures.push(`${label}：${detail}`);
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
};

// —— 期望的结构视图类型（按算法） ——
const STRUCTURE = {
  插入: 'zone', 折半插入: 'zone', 希尔: 'group', 冒泡: 'zone',
  快排: 'tree', 选择: 'zone', 堆排: 'heap', 归并: 'tree', 基数: 'hint',
};

console.log('\n=== 逐个算法：DOM 与面板 ===');
const chips = await js(`[...document.querySelectorAll('.chips .chip')].map(c => c.textContent)`);
console.log(`chips(${chips.length}): ${chips.join(' / ')}`);
check(chips.length === 9, '9 个算法 chip', `实际 ${chips.length}`);

for (const name of ['插入', '折半插入', '希尔', '冒泡', '快排', '选择', '堆排', '归并', '基数']) {
  await js(`(() => { [...document.querySelectorAll('.chips .chip')].find(x => x.textContent === '${name}').click(); return 1; })()`);
  await sleep(150);
  const total = Number(await js(`(document.body.textContent.match(/第 \\d+ \\/ (\\d+) 步/)||[0,0])[1]`));
  // 走到 40% 处，才看得到指针/树/辅助数组
  await js(`(() => { const s = document.querySelector('.seek'); s.value = String(${Math.floor(total * 0.4)}); s.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
  await sleep(200);
  const info = await js(`({
    步数: (document.body.textContent.match(/第 (\\d+) \\/ (\\d+) 步/)||['?'])[0],
    主格数: document.querySelectorAll('.cellrow:not(.auxrow) .cell').length,
    辅助行可见: [...document.querySelectorAll('.auxrow')].some(r => !r.hidden),
    变量: [...document.querySelectorAll('.stats.vars .stat')].map(s => s.textContent).join(' | '),
    计数器: [...document.querySelectorAll('.stats.counters .stat')].map(s => s.textContent).join(' '),
    高亮行: document.querySelector('.ln.hl')?.textContent?.trim().slice(0, 22) ?? null,
    高亮行数: document.querySelectorAll('.ln.hl').length,
    树层: document.querySelectorAll('.tree-level').length,
    堆节点: document.querySelectorAll('.heap-node').length,
    堆父索引全对: [...document.querySelectorAll('.heap-node')].every((n) => {
      const i = Number(n.dataset.index);
      return i === 0 || n.dataset.parent === String(Math.floor((i - 1) / 2));
    }),
    脚注: document.querySelector('.tree-footer')?.textContent ?? '',
    图例项数: document.querySelectorAll('.legend > span').length,
    图例同一行: (() => {
      const tops = [...document.querySelectorAll('.legend > span')].map((s) => Math.round(s.getBoundingClientRect().top));
      return tops.length > 0 && new Set(tops).size === 1;
    })(),
    提示: document.querySelector('.hint')?.textContent ?? '',
    区条: document.querySelectorAll('.zone').length,
    状态标签: document.querySelectorAll('.tag')[4]?.textContent,
    动作说明: document.querySelector('.status')?.textContent?.slice(0, 26) ?? '',
  })`);
  console.log(`\n[${name}] ${info.步数}  ${info.状态标签}`);
  console.log(`  变量: ${info.变量}`);
  console.log(`  计数: ${info.计数器}   动作: ${info.动作说明}`);
  check(total > 1, `${name} 有步骤流`, `总步数 ${total}`);
  check(info.主格数 === 8, `${name} 主数组 8 格`, `实际 ${info.主格数}`);
  check(info.高亮行数 === 1, `${name} 伪代码恰好 1 行高亮`, `${info.高亮行数} 行`);
  check(!!info.高亮行, `${name} 高亮行非空`, String(info.高亮行));
  check(info.变量.length > 0, `${name} 变量面板非空`, info.变量);
  check(!/—/.test(info.变量), `${name} 变量面板无占位符（真值优先）`, info.变量);
  const kind = STRUCTURE[name];
  if (kind === 'zone') check(info.区条 > 0, `${name} 结构视图=有序区条`, `区条 ${info.区条}`);
  if (kind === 'tree') check(info.树层 > 0, `${name} 结构视图=递归/分治树`, `层 ${info.树层}`);
  if (kind === 'heap') {
    // 节点数 = 当前堆中元素个数（随换出堆顶递减），层数 = ceil(log2(节点数+1))；父索引必须是 floor((i-1)/2)
    const levels = Math.ceil(Math.log2(info.堆节点 + 1));
    check(info.堆节点 > 0, `${name} 结构视图=完全二叉树有节点`, `节点 ${info.堆节点}`);
    check(info.堆父索引全对 === true, `${name} 完全二叉树父索引 = floor((i-1)/2)`, String(info.堆父索引全对));
    check(info.树层 === levels, `${name} 完全二叉树层数 = ceil(log2(n+1))`, `层 ${info.树层} vs 期望 ${levels}`);
  }
  if (kind === 'group') {
    check(info.区条 === 8, `${name} 结构视图=分组着色 8 格`, `区条 ${info.区条}`);
    check(info.脚注.includes('增量 d'), `${name} 分组视图有增量脚注`, info.脚注);
  }
  check(info.图例项数 === 4, `${name} 图例 4 项`, `${info.图例项数}`);
  check(info.图例同一行 === true, `${name} 图例横排未被误伤`, String(info.图例同一行));
  if (kind === 'hint') {
    check(info.提示.includes('没有结构视图'), `${name} 空态给准确提示（不是「尚未开始」）`, info.提示);
  }
  if (name === '归并' || name === '基数') check(info.辅助行可见 === true, `${name} 辅助数组行可见`, String(info.辅助行可见));
  if (name !== '归并' && name !== '基数') check(info.辅助行可见 === false, `${name} 辅助行隐藏`, String(info.辅助行可见));
}

// —— 交互：播放推进 / 暂停 / 非法输入 / 下标进制 ——
console.log('\n=== 交互 ===');
await js(`(() => { [...document.querySelectorAll('.chips .chip')].find(x => x.textContent === '快排').click(); return 1; })()`);
await sleep(200);
const stepOf = () => js(`Number((document.body.textContent.match(/第 (\\d+) \\//)||[0,0])[1])`);
const before = await stepOf();
await js(`[...document.querySelectorAll('button')].find(b => b.textContent === '播放').click(); 1`);
await sleep(900);
const during = await stepOf();
const stopped = await js(`[...document.querySelectorAll('button')].some(b => b.textContent === '暂停')`);
await js(`[...document.querySelectorAll('button')].find(b => b.textContent === '暂停')?.click(); 1`);
await sleep(300);
const after = await stepOf();
await sleep(300);
check(during > before, '播放推进步数', `${before} → ${during}`);
check(stopped === true, '播放中按钮变「暂停」', String(stopped));
check((await stepOf()) === after, '暂停后不再推进', `${after}`);

await js(`(() => { const i = document.querySelector('.datainput'); i.value = '1,2,abc'; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return 1; })()`);
await sleep(200);
const err = await js(`document.querySelector('.err')?.textContent ?? ''`);
check(err.length > 0, '非法输入给中文报错', err);

const varsAt0 = await js(`[...document.querySelectorAll('.stats.vars .stat')].map(s => s.textContent).join(' | ')`);
const idx0 = await js(`[...document.querySelectorAll('.idxnum')].slice(0, 3).map(n => n.textContent).join(',')`);
await js(`(() => { const c = [...document.querySelectorAll('.indexbase .chip')].find(x => x.textContent === '1 基'); if (!c) return 'no-chip'; c.click(); return 1; })()`);
await sleep(250);
const idx1 = await js(`[...document.querySelectorAll('.idxnum')].slice(0, 3).map(n => n.textContent).join(',')`);
const varsAt1 = await js(`[...document.querySelectorAll('.stats.vars .stat')].map(s => s.textContent).join(' | ')`);
check(/^0,1,2$/.test(idx0), '0 基下标从 0 开始', idx0);
check(/^1,2,3$/.test(idx1), '切 1 基后下标从 1 开始', idx1);
console.log(`  变量面板 0 基: ${varsAt0}`);
console.log(`  变量面板 1 基: ${varsAt1}`);
check(varsAt0 !== varsAt1, '变量面板里的索引类变量随进制换算', `${varsAt0} → ${varsAt1}`);
await js(`(() => { const c = [...document.querySelectorAll('.indexbase .chip')].find(x => x.textContent === '0 基'); if (c) c.click(); return 1; })()`);

// —— P2：主视图切换 / 主题 / 快捷键 / 窄屏 ——
console.log('\n=== P2 功能 ===');
const key = async (k, code, keyCode, modifiers = 0) => {
  const base = { key: k, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, modifiers };
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
};

const cellsArray = await js(`document.querySelectorAll('.cellrow:not(.auxrow) .cell').length`);
await js(`(() => { [...document.querySelectorAll('.viewswitch .chip')].find(x => x.textContent === '柱状图').click(); return 1 })()`);
await sleep(250);
const bars = await js(`document.querySelectorAll('.barcol').length`);
const heights = await js(`[...document.querySelectorAll('.barcol')].slice(0, 3).map(c => c.style.height)`);
const legendAfter = await js(`document.querySelectorAll('.legend > span').length`);
await js(`(() => { [...document.querySelectorAll('.viewswitch .chip')].find(x => x.textContent === '数组').click(); return 1 })()`);
await sleep(250);
const cellsBack = await js(`document.querySelectorAll('.cellrow:not(.auxrow) .cell').length`);
console.log(`  主视图：数组 ${cellsArray} 格 → 柱状图 ${bars} 柱 ${JSON.stringify(heights)} → 数组 ${cellsBack} 格`);
check(cellsArray === 8 && bars === 8 && cellsBack === 8, '主视图切换（数组 ↔ 柱状图，结构视图保留）', `${cellsArray}/${bars}/${cellsBack}`);
check(legendAfter === 4, '切换主视图后图例仍在', String(legendAfter));
check(heights.every((h) => String(h).endsWith('%')), '柱高按百分比计算', JSON.stringify(heights));

const lightBg = await js(`getComputedStyle(document.body).backgroundColor`);
await js(`(() => { [...document.querySelectorAll('.themeswitch .chip')].find(x => x.textContent === '深色').click(); return 1 })()`);
await sleep(250);
const darkState = await js(`({ theme: document.documentElement.dataset.theme, bg: getComputedStyle(document.body).backgroundColor })`);
await js(`(() => { [...document.querySelectorAll('.themeswitch .chip')].find(x => x.textContent === '浅色').click(); return 1 })()`);
await sleep(250);
const backState = await js(`({ theme: document.documentElement.dataset.theme, bg: getComputedStyle(document.body).backgroundColor })`);
console.log(`  主题：${lightBg} → ${darkState.bg}（${darkState.theme}）→ ${backState.bg}（${backState.theme}）`);
check(darkState.theme === 'dark' && darkState.bg !== lightBg, '深色主题真的换了底色', `${lightBg} → ${darkState.bg}`);
check(backState.theme === 'light' && backState.bg === lightBg, '切回浅色恢复原底色', backState.bg);

await js(`document.activeElement instanceof HTMLElement && document.activeElement.blur(); 1`);
const beforeKey = await stepOf();
await key('ArrowRight', 'ArrowRight', 39);
await sleep(200);
const afterKey = await stepOf();
check(afterKey === beforeKey + 1, '快捷键 ArrowRight 单步 +1', `${beforeKey} → ${afterKey}`);
await key('5', 'Digit5', 53);
await sleep(250);
const algoNow = await js(`[...document.querySelectorAll('.chips .chip')].find(c => c.classList.contains('on'))?.textContent`);
check(algoNow === '快排', '数字键 5 切到快排', String(algoNow));

await send('Emulation.setDeviceMetricsOverride', { width: 900, height: 900, deviceScaleFactor: 1, mobile: false });
await sleep(350);
const narrow = await js(`({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, cells: document.querySelectorAll('.cellrow:not(.auxrow) .cell').length })`);
console.log(`  900px：scrollWidth ${narrow.sw} / innerWidth ${narrow.iw} / ${narrow.cells} 格`);
check(narrow.sw <= narrow.iw, '900px 无横向滚动', `${narrow.sw} vs ${narrow.iw}`);
check(narrow.cells === 8, '窄屏下总格数不变', String(narrow.cells));
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

console.log(`\n=== 结论 ===`);
if (failures.length === 0) {
  console.log('全部验收项通过 ✓');
} else {
  console.log(`失败 ${failures.length} 项：`);
  for (const f of failures) console.log('  ✗ ' + f);
}
ws.close();
process.exit(failures.length === 0 ? 0 : 1);
