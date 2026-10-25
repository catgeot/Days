import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /festival-nearby-cards\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 60_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5196',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  webServer: {
    command:
      'BROWSER=none DEV_SSL=0 VITE_GATEO_NEARBY_CARDS=1 npx vite --host 127.0.0.1 --port 5196',
    url: 'http://127.0.0.1:5196/korea/',
    reuseExistingServer: !process.env.CI,
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
    {
      name: 'chromium-1280',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
