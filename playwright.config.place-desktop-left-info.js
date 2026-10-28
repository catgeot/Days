import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLACE_LEFT_INFO_PREVIEW_PORT) || 4174;
const localBase = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: ['place-desktop-left-info.spec.js'],
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: [['list']],
  ...(process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'
    ? {}
    : {
        webServer: {
          command: `mkdir -p dist && VITE_GATEO_PLACE_DESKTOP_LEFT_INFO=1 npx vite build && DEV_SSL=0 BROWSER=none npx vite preview --host 127.0.0.1 --port ${port}`,
          url: `${localBase}/`,
          reuseExistingServer: !process.env.CI,
          timeout: 300_000,
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
      name: 'chromium-place-desktop-left-info',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
