import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.MOONI_PICK_E2E_PORT || 5194);
const localBase = `http://127.0.0.1:${port}`;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || localBase;

export default defineConfig({
  testDir: './e2e',
  testMatch: /mooni-destination-pick-reply\.spec\.js/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 60_000 },
  reporter: process.env.CI ? [['line']] : [['list']],
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
    trace: process.env.CI ? 'off' : 'retain-on-failure',
    screenshot: process.env.CI ? 'off' : 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-390',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'chromium-1280',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
