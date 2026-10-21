import { defineConfig, devices } from '@playwright/test';

const port = 5173;

export default defineConfig({
  testDir: './e2e',
  testMatch: /place-lightbox-history\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 45_000 },
  outputDir: '/opt/cursor/artifacts/place-lightbox-history-results',
  reporter: [['list']],
  use: {
    ...devices['Desktop Safari'],
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'webkit',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
    video: 'on',
    trace: 'off',
    screenshot: 'off',
  },
  webServer: {
    command: `BROWSER=none DEV_SSL=0 npx vite --host 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
