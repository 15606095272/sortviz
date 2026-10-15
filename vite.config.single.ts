import { defineConfig } from 'vite';

/**
 * 单文件产物：IIFE + CSS 不拆分，配合 scripts/inline-single.mjs 把 JS/CSS 内联进一个 HTML。
 * 目的：file:// 双击可用（module 脚本 + crossorigin CSS 在 file:// 下会被 CORS 拦掉）。
 */
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist-single',
    target: 'es2019',
    cssCodeSplit: false,
    rollupOptions: { output: { format: 'iife', entryFileNames: 'app.js', assetFileNames: 'app.[ext]' } },
  },
});
