import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // This project's postcss.config.mjs uses Tailwind v4's string-form
    // plugin reference, which Next's own build pipeline resolves but
    // Vite's generic CSS pipeline (what Vitest uses under the hood)
    // doesn't - component tests here never need rendered styles anyway.
    css: false,
  },
  css: {
    // Same reason as test.css above: bypass this project's root
    // postcss.config.mjs (Tailwind v4's string-form plugin, which only
    // Next's own pipeline knows how to resolve) so Vite doesn't try and
    // fail to load it at all.
    postcss: { plugins: [] },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
