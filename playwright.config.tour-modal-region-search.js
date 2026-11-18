import { defineConfig, devices } from '@playwright/test';

const port = 5236;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /tour-modal-region-search\.spec\.js/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: process.env.CI ? [['line']] : [['list']],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    env: {
      BROWSER: 'none',
      DEV_SSL: '0',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'e2e-anon-placeholder',
      ...(process.env.VITE_MAPBOX_TOKEN
        ? { VITE_MAPBOX_TOKEN: process.env.VITE_MAPBOX_TOKEN }
        : {}),
    },
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: 'off',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      name: 'chromium-390',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'chromium-1280',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'webkit-390',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
