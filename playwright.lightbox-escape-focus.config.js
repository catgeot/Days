// @ts-check
import { defineConfig, devices } from '@playwright/test';

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:4173';

export default defineConfig({
  testMatch: /lightbox-escape-focus\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: [['list']],
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  },
  projects: [
    { name: 'chromium-390', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'chromium-1280', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
});
