import { defineConfig, devices } from '@playwright/test';

const port = 5248;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /home-monthly-(destinations|mooni-intro-bubble)\.spec\.js/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: process.env.CI ? [['line']] : [['list']],
  webServer: {
    command: `BROWSER=none DEV_SSL=0 VITE_MAPBOX_TOKEN=${process.env.VITE_MAPBOX_TOKEN || 'pk.e2e-home-monthly-placeholder'} VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL || 'https://example.supabase.co'} VITE_SUPABASE_ANON_KEY=${process.env.VITE_SUPABASE_ANON_KEY || 'e2e-anon-placeholder'} npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium-home-monthly-390',
      testMatch: /home-monthly-(destinations|mooni-intro-bubble|mooni-fab-overlap)\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-home-monthly-1280',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'webkit-home-monthly-390',
      testMatch: /home-monthly-(destinations|mooni-intro-bubble|mooni-fab-overlap|place-reason)\.spec\.js/,
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'webkit-home-monthly-1280',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'chromium-home-monthly-375',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-home-monthly-430',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 430, height: 932 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
