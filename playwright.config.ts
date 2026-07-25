import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'e2e.spec.ts',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npx vite --port 4173',
    port: 4173,
    reuseExistingServer: false,
  },
});
