import { defineConfig, devices } from '@playwright/test';

const port = 5246;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /airport-pickup-links\.spec\.js/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: process.env.CI ? [['line']] : [['list']],
  webServer: {
    command: `BROWSER=none DEV_SSL=0 VITE_GATEO_AIRPORT_PICKUP_LINKS=1 npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      BROWSER: 'none',
      DEV_SSL: '0',
      VITE_GATEO_AIRPORT_PICKUP_LINKS: '1',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'e2e-anon-placeholder',
      VITE_MAPBOX_TOKEN: process.env.VITE_MAPBOX_TOKEN || 'pk.e2e-airport-pickup',
    },
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
      name: 'webkit-390',
      use: {
        ...devices['Desktop Safari'],
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
