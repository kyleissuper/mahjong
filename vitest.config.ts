import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    root: '.',
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['node_modules', 'tests/e2e.spec.ts', '.claude'],
  },
});
