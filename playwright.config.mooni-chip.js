import { defineConfig, devices } from '@playwright/test';

const siteUrl =
  process.env.SMOKE_SITE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'https://www.gateo.kr/';

export default defineConfig({
  testDir: './e2e',
  testMatch: /korea-mooni-festival-chip-(persist|race|main-baseline)\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 480_000,
  expect: { timeout: 90_000 },
  reporter: [['list']],
  use: {
    baseURL: siteUrl,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-mobile',
      timeout: 600_000,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
