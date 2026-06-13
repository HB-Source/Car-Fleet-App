/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH is set by the GitHub Actions workflow so the app works when
// served from a sub-path on GitHub Pages (e.g. /Car-Fleet-App/).
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
    // The backend has its own vitest config in server/.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
