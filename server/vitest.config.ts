import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Inline (empty) PostCSS config so Vite/vitest does not search upward and
  // pick up the repo-root postcss.config.js (which needs tailwindcss, a
  // frontend-only dependency not installed here).
  css: {
    postcss: {},
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.ts'],
    css: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
    // Suites share one in-memory MongoDB; run them sequentially.
    fileParallelism: false,
  },
});
