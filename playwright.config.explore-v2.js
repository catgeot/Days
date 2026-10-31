import { defineConfig, devices } from '@playwright/test';

const exploreV2Flag = process.env.VITE_GATEO_EXPLORE_V2 === '1' ? '1' : '';
const port = exploreV2Flag === '1' ? 5198 : 5195;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /explore-v2-monthly\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: process.env.CI ? [['line']] : [['list']],
  webServer: {
    command: `BROWSER=none DEV_SSL=0 VITE_GATEO_EXPLORE_V2=${exploreV2Flag} npx vite --host 127.0.0.1 --port ${port}`,
    url: `${baseURL}/explore`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: process.env.CI ? 'off' : 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
