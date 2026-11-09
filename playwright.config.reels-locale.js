import { defineConfig, devices } from '@playwright/test';

const offPort = Number(process.env.REELS_LOCALE_OFF_PORT) || 5210;
const baseURL = `http://127.0.0.1:${offPort}`;

const buildAndPreview = [
  'npm run build',
  `BROWSER=none DEV_SSL=0 npx vite preview --host 127.0.0.1 --port ${offPort} --strictPort`,
].join(' && ');

export default defineConfig({
  testDir: './e2e',
  testMatch: /reels-locale-en-first-visit\.spec\.js/,
  grep: /flag off/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 45_000 },
  reporter: process.env.CI ? [['line']] : [['list']],
  webServer: {
    command: buildAndPreview,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  use: {
    baseURL,
    locale: 'en-US',
    ignoreHTTPSErrors: true,
    ...devices['Pixel 5'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
