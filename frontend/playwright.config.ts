import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: "./e2e",
    webServer: {
    command: `"${process.execPath}" ./node_modules/vite/bin/vite.js --host 127.0.0.1`,
    url: 'http://localhost:5173',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
