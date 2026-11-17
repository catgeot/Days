import { defineConfig, devices } from '@playwright/test';

const port = 5242;
const baseURL = `http://127.0.0.1:${port}`;

const previewEnv = {
  BROWSER: 'none',
  DEV_SSL: '0',
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'e2e-anon-placeholder',
};

export default defineConfig({
  testDir: './e2e',
  testMatch: /korea-festival-city-place\.spec\.js/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 120_000,
  reporter: process.env.CI ? [['line']] : [['list']],
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${port} --strictPort`,
    env: previewEnv,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
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
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
