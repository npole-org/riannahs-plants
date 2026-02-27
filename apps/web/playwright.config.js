import { defineConfig } from '@playwright/test';

const baseURL = globalThis.process?.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const isLocalBaseUrl = /127\.0\.0\.1|localhost/.test(baseURL);

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL
  },
  ...(isLocalBaseUrl
    ? {
        webServer: {
          command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
          url: 'http://127.0.0.1:4173',
          reuseExistingServer: true,
          timeout: 120000
        }
      }
    : {})
});
