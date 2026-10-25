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
        /place-travelogue-card\.spec\.js/,
        /place-travelogue-card-qa-screenshots\.spec\.js/,
        /place-visit-story-review-focus\.spec\.js/,
        /korea-festival-date-chip\.spec\.js/,
        /place-lightbox-history\.spec\.js/,
        /tinian-search-planner-390\.spec\.js/,
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
      name: 'webkit-place-travelogue-card',
      testMatch: /place-travelogue-card\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        locale: 'ko-KR',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      },
    },
    {
      name: 'webkit-place-travelogue-qa',
      testMatch: /place-travelogue-card-qa-screenshots\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        locale: 'ko-KR',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      },
    },
    {
      name: 'webkit-place-visit-story-review-focus',
      testMatch: /place-visit-story-review-focus\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        locale: 'ko-KR',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      },
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
      name: 'webkit-place-local-info-freshness',
      testMatch: /place-local-info-freshness-screenshots\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        locale: 'ko-KR',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      },
    },
    {
      name: 'webkit-festival-hero-credit',
      testMatch: /korea-festival-hero-credit-en\.spec\.js/,
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'webkit-pr492-qa',
      testMatch: /pr492-qa-screenshots\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      },
    },
    {
      name: 'webkit-pr493-qa',
      testMatch: /pr493-qa-screenshots\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      },
    },
    {
      name: 'chromium-pr493-followup',
      testMatch: /pr493-followup-nearby-culture\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
        video: 'off',
        trace: 'off',
      },
    },
    {
      name: 'webkit-pr493-followup',
      testMatch: /pr493-followup-nearby-culture\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
        video: 'off',
        trace: 'off',
      },
    },
    {
      name: 'webkit-pr1-festival',
      testMatch: /pr1-festival-detail-screenshots\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      },
    },
    {
      name: 'webkit-festival-lightbox-ios',
      testMatch: /festival-lightbox-ios\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
        locale: 'ko-KR',
        ignoreHTTPSErrors: true,
        video: 'off',
        trace: 'off',
      },
    },
    {
      name: 'webkit-festival-back-overview',
      testMatch: /korea-festival-back-overview\.spec\.js/,
      timeout: process.env.CI ? 120_000 : 240_000,
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      },
    },
    {
      name: 'webkit-festival-external-return',
      testMatch: /korea-festival-external-return\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      },
    },
    {
      name: 'webkit-external-return-qa-record',
      testMatch: /pr-external-return-qa-record\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      },
    },
    {
      name: 'webkit-festival-back-qa-capture',
      testMatch: /pr-festival-back-blank-qa-capture\.spec\.js/,
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      },
    },
  ],
});
