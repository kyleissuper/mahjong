import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'app',
  build: {
    outDir: '../dist-app',
    rollupOptions: {
      input: {
        main: 'app/index.html',
        prototype: 'app/prototype.html',
      },
    },
  },
});
