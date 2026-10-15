// 交互冒烟自测：用 CDP 真点页面，验证「不是静态页面」。
//
// 用法（两步）：
//   1) 起预览服务：   npm run build && python3 -m http.server 4173 --directory dist
//   2) 起调试版浏览器："/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//        --headless=new --disable-gpu --remote-debugging-port=9222 http://127.0.0.1:4173/
//   3) 跑本脚本：     node scripts/interaction-smoke.mjs
//
// 覆盖：播放推进 / 暂停 / 单步 / 回到开头 / 切算法 / 伪代码与结构视图联动 / 非法输入 / 换数据
// 零依赖：Node 22 自带 fetch 与 WebSocket，不装 puppeteer。

// 一次性交互自测：用 CDP 真点页面（不依赖 ego-browser，因为那个会话被用户接管了）
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find((t) => t.type === 'page' && t.url.includes('4173'));
if (!target) { console.log('没找到页面目标：', list.map((t) => t.url)); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener('open', r));
const send = (method, params) => new Promise((res) => { const i = ++seq; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const js = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) return 'ERR: ' + r.result.exceptionDetails.text;
  return r.result?.result?.value;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const step = () => js(`(document.body.textContent.match(/第 (\\d+) \\/ (\\d+) 步/)||[0,0,0])[1]`);
const counter = () => js(`document.querySelector('.counters, .cxrow, .bottom')?.textContent.replace(/\\s+/g,' ').slice(0,80)`);

console.log('① 页面就绪        :', await js(`document.title + ' | 格子数=' + document.querySelectorAll('.cell').length`));
console.log('② 初始步数        :', await step());

await js(`[...document.querySelectorAll('button')].find(b => b.textContent === '播放').click(); 'ok'`);
await sleep(1000);
const playing = await step();
console.log('③ 点「播放」1 秒后:', playing, '（>0 就说明动画真在跑）');

await js(`[...document.querySelectorAll('button')].find(b => b.textContent === '暂停')?.click(); 'ok'`);
const paused = await step();
await sleep(400);
const stillPaused = await step();
console.log('④ 点「暂停」      :', paused, '→ 再等 0.4 秒:', stillPaused, (paused === stillPaused ? '（确实停了）' : '（没停住！）'));

await js(`[...document.querySelectorAll('button')].find(b => b.textContent === '⏭')?.click(); 'ok'`);
console.log('⑤ 点「单步 ⏭」    :', paused, '→', await step());

await js(`[...document.querySelectorAll('button')].find(b => b.textContent === '⏮')?.click(); 'ok'`);
console.log('⑥ 点「回到开头 ⏮」:', await step());

await js(`[...document.querySelectorAll('.chip')].find(c => c.textContent === '快速排序').click(); 'ok'`);
await sleep(300);
console.log('⑦ 点「快速排序」chip:', await js(`({ 当前算法: [...document.querySelectorAll('.chip.on')].map(c => c.textContent), 总步数: (document.body.textContent.match(/第 \\d+ \\/ (\\d+) 步/)||[0,0])[1], 结构视图: document.querySelector('.structure-view')?.textContent.slice(0,40) })`));

await js(`[...document.querySelectorAll('button')].find(b => b.textContent === '⏭')?.click(); 'ok'`);
await sleep(200);
console.log('⑧ 快排单步一步后  :', await js(`({ 步数: (document.body.textContent.match(/第 (\\d+) \\//)||[0,0])[1], 伪代码高亮: document.querySelector('.ln.hl')?.textContent.trim().slice(0,28), 结构视图: document.querySelector('.structure-view')?.textContent.slice(0,30) })`));

await js(`(() => { const i = document.querySelector('.datainput'); i.value = '1,2,abc'; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return 'ok'; })()`);
await sleep(200);
console.log('⑨ 非法输入后      :', await js(`({ 错误提示: document.querySelector('.err')?.textContent, 步数未变: (document.body.textContent.match(/第 (\\d+) \\//)||[0,0])[1] })`));

await js(`(() => { const i = document.querySelector('.datainput'); i.value = '9 8 7 6 5'; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return 'ok'; })()`);
await sleep(300);
console.log('⑩ 改成 5 个数据后 :', await js(`({ 格子数: document.querySelectorAll('.cell').length, 值: [...document.querySelectorAll('.cell')].map(c => c.textContent).join(' '), 总步数: (document.body.textContent.match(/第 \\d+ \\/ (\\d+) 步/)||[0,0])[1] })`));

ws.close();
