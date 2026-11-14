import { defineConfig, devices } from '@playwright/test';

const port = 5198;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /logbook-review-filter-cards\.spec\.js/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  reporter: process.env.CI ? [['line']] : [['list']],
  webServer: {
    command: `BROWSER=none DEV_SSL=0 VITE_GATEO_LOGBOOK_REVIEW_FILTER_E2E=1 npx vite --host 127.0.0.1 --port ${port}`,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      name: 'chromium-logbook-review-filter-390',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'chromium-logbook-review-filter-1280',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'webkit-logbook-review-filter-390',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});