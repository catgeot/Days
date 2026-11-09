import { defineConfig, devices } from '@playwright/test';

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.LIVE_BASE_URL ||
  'https://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  testMatch: /joseon-tombs-promo-checklist\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 300_000,
  expect: { timeout: 90_000 },
  reporter: [['list']],
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    screenshot: 'off',
    video: 'off',
    trace: 'off',
  },
  projects: [
    {
      name: 'promo-checklist',
      use: {
        browserName: 'chromium',
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
