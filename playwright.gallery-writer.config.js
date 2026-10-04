import { defineConfig } from '@playwright/test';

const PROD_HOST = 'phdjnbfitvmrguqzverm';
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
if (!supabaseUrl || supabaseUrl.includes(PROD_HOST)) {
  throw new Error(`ABORT: VITE_SUPABASE_URL points at prod host ${PROD_HOST} or is empty`);
}

export default defineConfig({
  testDir: './e2e',
  testMatch: 'gallery-single-writer.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    locale: 'ko-KR',
  },
  webServer: {
    command: 'npx vite preview --outDir dist/gallery-writer-harness --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DEV_SSL: '0',
    },
  },
  projects: [
    {
      name: 'chromium-1280',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'webkit-390',
      use: { browserName: 'webkit', viewport: { width: 390, height: 844 } },
    },
  ],
});
