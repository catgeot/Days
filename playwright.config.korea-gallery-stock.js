import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'korea-inland-gallery-stock-relevance.spec.js',
  timeout: 180_000,
  expect: { timeout: 45_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'webkit-390',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
      },
    },
    {
      name: 'webkit-1280',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
      },
    },
  ],
});
