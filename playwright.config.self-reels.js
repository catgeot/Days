import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.SELF_REELS_PREVIEW_PORT) || 5199;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /self-reels-feed\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: process.env.CI ? [['line']] : [['list']],
  webServer: {
    command: `BROWSER=none DEV_SSL=0 VITE_GATEO_SELF_REELS=1 VITE_GATEO_SELF_REELS_FIXTURE=1 npx vite --host 127.0.0.1 --port ${port}`,
    url: `${baseURL}/reels`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: {
    baseURL,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: process.env.CI ? 'off' : 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-self-reels',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
