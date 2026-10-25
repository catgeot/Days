import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /logbook-official-review-hub-390\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5197',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command:
      'BROWSER=none DEV_SSL=0 VITE_GATEO_LOGBOOK_REVIEW_HUB=1 npx vite --host 127.0.0.1 --port 5197',
    url: 'http://127.0.0.1:5197/blog?tab=public',
    reuseExistingServer: true,
    timeout: 120_000,
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
  ],
});
