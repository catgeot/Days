import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /mooni-food-names-qa\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 360_000,
  expect: { timeout: 90_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  },
  projects: [{ name: 'webkit', use: { ...devices['iPhone 13'] } }],
});
