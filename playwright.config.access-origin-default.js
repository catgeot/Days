import { defineConfig, devices } from '@playwright/test';

const port = 5198;
const base = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /access-origin-default\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: [['list']],
  webServer: {
    command: `BROWSER=none DEV_SSL=0 VITE_GATEO_AIRPORT_PICKUP_LINKS=1 VITE_SUPABASE_URL=https://example.supabase.co VITE_SUPABASE_ANON_KEY=e2e-anon-placeholder npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${base}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: base,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'webkit-390',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
      },
    },
    {
      name: 'webkit-1280',
      use: {
        browserName: 'webkit',
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
      },
    },
  ],
});
