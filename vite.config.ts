import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    cloudflare({ configPath: path.resolve(__dirname, 'wrangler.jsonc') }),
  ],
  root: 'src/frontend',
  build: {
    outDir: '../../dist-app',
  },
});
