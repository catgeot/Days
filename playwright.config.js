// @see plans/site-health-monitoring-plan.md Phase 2
import { defineConfig, devices } from '@playwright/test';

const siteUrl =
  process.env.SMOKE_SITE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'https://www.gateo.kr/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: process.env.CI ? [['line']] : [['list']],
  use: {
    baseURL: siteUrl,
    trace: process.env.CI ? 'off' : 'on-first-retry',
    screenshot: process.env.CI ? 'off' : 'only-on-failure',
    video: process.env.CI ? 'off' : 'retain-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: [
        /youtube-loadmore-session\.spec\.js/,
        /gallery-single-writer\.spec\.js/,
        /place-local-info\.spec\.js/,
        /korea-festival-date-chip\.spec\.js/,
      ],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'chromium-mobile',
      testMatch: /youtube-loadmore-session\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'webkit-mobile',
      testMatch: /youtube-loadmore-session\.spec\.js/,
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'webkit-iphone-nearby',
      testMatch: /gangneung-nearby-thumb-fallback\.spec\.js/,
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'webkit-390',
      testMatch: /home-search-place-nav\.spec\.js/,
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'webkit-place-local-info',
      testMatch: /place-local-info\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        locale: 'ko-KR',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'webkit-festival-hero-credit',
      testMatch: /korea-festival-hero-credit-en\.spec\.js/,
      use: { ...devices['iPhone 13'] },
    },
  ],
});
