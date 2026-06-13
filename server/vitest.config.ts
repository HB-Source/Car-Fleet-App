import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.ts'],
    hookTimeout: 120_000,
    testTimeout: 30_000,
    // Suites share one in-memory MongoDB; run them sequentially.
    fileParallelism: false,
  },
});
