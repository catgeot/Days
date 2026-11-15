import { defineConfig, devices } from '@playwright/test';

const port = 5224;
const baseURL = `http://127.0.0.1:${port}`;

const previewEnv = {
  VITE_GATEO_LOGBOOK_REVIEW_HUB: '1',
  VITE_GATEO_LOGBOOK_REVIEW_FILTER: '1',
  VITE_GATEO_REVIEW_DEEPLINK: '1',
  BROWSER: 'none',
  DEV_SSL: '0',
};

export default defineConfig({
  testDir: './e2e',
  testMatch: /place-review-deeplink-order\.spec\.js/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  reporter: process.env.CI ? [['line']] : [['list']],
  webServer: {
    command: `mkdir -p dist && npm run build && npx vite preview --host 127.0.0.1 --port ${port} --strictPort --outDir dist`,
    env: previewEnv,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: 'off',
    screenshot: 'only-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      name: 'webkit-review-deeplink-390',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-review-deeplink-390',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
