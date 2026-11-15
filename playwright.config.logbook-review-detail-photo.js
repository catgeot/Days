import { defineConfig, devices } from '@playwright/test';

const port = 5222;
const baseURL = `http://127.0.0.1:${port}`;

const previewEnv = {
  VITE_GATEO_LOGBOOK_REVIEW_HUB: '1',
  VITE_GATEO_LOGBOOK_REVIEW_FILTER: '1',
  VITE_GATEO_REVIEW_DEEPLINK: '1',
  VITE_GATEO_LOGBOOK_REVIEW_FILTER_E2E: '1',
  BROWSER: 'none',
  DEV_SSL: '0',
};

export default defineConfig({
  testDir: './e2e',
  testMatch: /logbook-review-detail-photo\.spec\.js/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 180_000,
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
    trace: 'off',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      name: 'webkit-logbook-detail-photo-390',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-logbook-detail-photo-1280',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
      },
    },
  ],
});