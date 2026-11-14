import { defineConfig, devices } from '@playwright/test';

const offPort = Number(process.env.EDITORIAL_BLOG_HEAD_PORT) || 5211;
const baseURL = `http://127.0.0.1:${offPort}`;

const buildAndPreview = [
  'npm run build',
  `BROWSER=none DEV_SSL=0 npx vite preview --host 127.0.0.1 --port ${offPort} --strictPort`,
].join(' && ');

export default defineConfig({
  testDir: './e2e',
  testMatch: /editorial-blog-head-meta\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 60_000 },
  reporter: process.env.CI ? [['line']] : [['list']],
  webServer: {
    command: buildAndPreview,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    launchOptions: {
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  projects: [{ name: 'chromium-mobile', use: { ...devices['Pixel 5'], locale: 'ko-KR' } }],
});