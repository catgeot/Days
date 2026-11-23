import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.MOONI_GBR_E2E_PORT || 5196);
const localBase = `http://127.0.0.1:${port}`;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || localBase;

export default defineConfig({
  testDir: './e2e',
  testMatch: /mooni-gbr-multifix\.spec\.js/,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 300_000,
  expect: { timeout: 60_000 },
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: `BROWSER=none DEV_SSL=0 npx vite --host 127.0.0.1 --port ${port} --strictPort`,
          url: `${localBase}/`,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      }),
  use: {
    baseURL,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      name: 'webkit-390',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'webkit-1280',
      use: {
        browserName: 'webkit',
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
      },
    },
  ],
});