import { defineConfig } from 'vite';

export default defineConfig({
  base: './',            // 相对路径：产物能部署在任意子路径（GitHub Pages 的 /repo/ 下也正常）
  build: { outDir: 'dist', target: 'es2022' },
  test: { environment: 'jsdom', globals: true, include: ['tests/**/*.test.ts'] },
});
