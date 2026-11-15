import { defineConfig } from '@playwright/test';

const viewport1280 = { width: 1280, height: 800 };
const viewport390 = { width: 390, height: 844 };

export default defineConfig({
  testDir: './e2e',
  testMatch: /korea-mooni-festival-detail-wait\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5198',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'BROWSER=none DEV_SSL=0 npx vite --host 127.0.0.1 --port 5198',
    url: 'http://127.0.0.1:5198/korea/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium-1280',
      use: { browserName: 'chromium', viewport: viewport1280, deviceScaleFactor: 1 },
    },
    {
      name: 'chromium-390',
      use: {
        browserName: 'chromium',
        viewport: viewport390,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'webkit-1280',
      use: { browserName: 'webkit', viewport: viewport1280, deviceScaleFactor: 1 },
    },
    {
      name: 'webkit-390',
      use: {
        browserName: 'webkit',
        viewport: viewport390,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
