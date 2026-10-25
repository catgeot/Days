import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /toolkit-freshness-screenshots\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5194',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  webServer: {
    command:
      'BROWSER=none DEV_SSL=0 VITE_GATEO_TOOLKIT_FRESHNESS=1 npx vite --host 127.0.0.1 --port 5194',
    url: 'http://127.0.0.1:5194/qa/toolkit-freshness',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'webkit',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
