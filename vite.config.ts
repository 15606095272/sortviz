import { defineConfig } from 'vite';

export default defineConfig({
  base: './',            // 关键：产物用相对路径，dist/index.html 可被 file:// 直接打开
  build: { outDir: 'dist', target: 'es2022' },
  test: { environment: 'jsdom', globals: true, include: ['tests/**/*.test.ts'] },
});
