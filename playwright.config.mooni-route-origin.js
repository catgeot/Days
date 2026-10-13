import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /mooni-route-origin-screenshots\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 90_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:4173',
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  },
  projects: [{ name: 'webkit', use: { ...devices['iPhone 13'] } }],
});
