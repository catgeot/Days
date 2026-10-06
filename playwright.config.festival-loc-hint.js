import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /korea-festival-loc-hint\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 60_000 },
  reporter: [['list']],
  use: {
    baseURL: 'https://127.0.0.1:4173',
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'https://127.0.0.1:4173/',
    reuseExistingServer: true,
    timeout: 120_000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
