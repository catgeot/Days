import { defineConfig, devices } from '@playwright/test';

const port = 5233;
// webServer는 DEV_SSL=0으로 HTTP만 띄운다. 부모 프로세스 env와 어긋나면 기동 대기가 끝난다.
const baseURL = `http://127.0.0.1:${port}`;

const previewEnv = {
  BROWSER: 'none',
  DEV_SSL: '0',
};

export default defineConfig({
  testDir: './e2e',
  testMatch: /explore-collection-card-tap\.spec\.js/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  repeatEach: 5,
  workers: process.env.CI ? 2 : 2,
  timeout: 180_000,
  reporter: process.env.CI ? [['line']] : [['list']],
  webServer: {
    command: `mkdir -p dist && npm run build && npx vite preview --host 127.0.0.1 --port ${port} --strictPort --outDir dist`,
    env: previewEnv,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: 'off',
    screenshot: 'only-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      name: 'webkit-explore-card-tap-390',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-explore-card-tap-1280',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'chromium-explore-card-tap-1024',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'chromium-explore-card-tap-390-touch',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
