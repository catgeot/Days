import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /korea-festival-course-modal-webkit-390\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 60_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5196',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command:
      'BROWSER=none DEV_SSL=0 VITE_GATEO_NEARBY_CARDS=0 VITE_SUPABASE_URL=https://example.supabase.co VITE_SUPABASE_ANON_KEY=e2e npx vite --host 127.0.0.1 --port 5196',
    url: 'http://127.0.0.1:5196/korea/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'webkit',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});