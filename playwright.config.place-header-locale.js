import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLACE_HEADER_LOCALE_PORT) || 4182;
const localBase = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: ['place-header-locale-toggle.spec.js', 'place-header-chrome-overlap.spec.js'],
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: [['list']],
  ...(process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'
    ? {}
    : {
        webServer: {
          command: `DEV_SSL=0 BROWSER=none npx vite --host 127.0.0.1 --port ${port}`,
          url: `${localBase}/`,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      }),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || localBase,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      name: 'chromium-place-header-locale',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
