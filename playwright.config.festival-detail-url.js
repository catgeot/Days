import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /korea-festival-detail-url\.spec\.js|korea-search-festival-click\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 60_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:4173',
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'webkit',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
