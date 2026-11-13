import { defineConfig, devices } from '@playwright/test';

const previewPort = process.env.THEME_SPOT_LIGHTBOX_PORT || '4173';
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${previewPort}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'theme-scenic-nested-lightbox.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 60_000 },
  reporter: [['list']],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `DEV_SSL=0 npx vite preview --host 127.0.0.1 --port ${previewPort} --strictPort`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  use: {
    baseURL,
    ...devices['Desktop Chrome'],
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
});
