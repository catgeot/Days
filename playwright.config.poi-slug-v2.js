import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './e2e',
  testMatch: /poi-admin-slug-v2\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 45_000 },
  reporter: [['list']],
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'off',
  },
  projects: [
    {
      name: 'webkit-390',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        locale: 'ko-KR',
      },
    },
  ],
});
