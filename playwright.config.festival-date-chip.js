import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /korea-festival-date-chip\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5193',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  webServer: {
    command:
      'BROWSER=none DEV_SSL=0 VITE_GATEO_FESTIVAL_DATE_CHIP=1 npx vite --host 127.0.0.1 --port 5193',
    url: 'http://127.0.0.1:5193/korea/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
