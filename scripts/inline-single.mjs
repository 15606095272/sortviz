// 把 dist-single 里的 app.js / app.css 内联进一个 HTML，产出 sortviz.html：一个文件、双击即用。
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const out = 'dist-single';
const html = readFileSync(join(out, 'index.html'), 'utf8');
const js = readFileSync(join(out, 'app.js'), 'utf8');
const cssFile = readdirSync(out).find((f) => f.endsWith('.css'));
const css = cssFile ? readFileSync(join(out, cssFile), 'utf8') : '';

// 为什么把脚本挪到 </body> 前而不是留在 <head>：
// vite 产物的入口是 <script type="module">，module 脚本天然 defer，等 DOM 解析完才执行；
// 内联的普通 <script> 没有 defer 可用，若留在 <head> 就会在 #app 存在之前跑，
// main.ts 顶层的 mountApp(document.querySelector('#app')!) 拿到 null
// → "Uncaught TypeError: Cannot set properties of null (setting 'innerHTML')" 空白页。
const single = html
  .replace(/<script[^>]*src="[^"]*app\.js"[^>]*><\/script>/, '')
  .replace(/<link[^>]*href="[^"]*\.css"[^>]*>/, `<style>\n${css}\n</style>`)
  .replace('</body>', `<script>\n${js}\n</script>\n</body>`);

writeFileSync(join(out, 'sortviz.html'), single);
console.log(`sortviz.html 生成：${(single.length / 1024).toFixed(1)} KB`);
