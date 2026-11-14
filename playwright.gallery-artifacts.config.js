import { defineConfig } from '@playwright/test';

const PROD_HOST = 'phdjnbfitvmrguqzverm';
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
if (!supabaseUrl || supabaseUrl.includes(PROD_HOST)) {
  throw new Error(`ABORT: VITE_SUPABASE_URL points at prod host ${PROD_HOST} or is empty`);
}

export default defineConfig({
  testDir: './e2e',
  testMatch: 'gallery-harness-artifacts.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    locale: 'ko-KR',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npx vite preview --outDir dist/gallery-writer-harness --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174/',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DEV_SSL: '0',
    },
  },
  projects: [{ name: 'chromium-capture', use: { browserName: 'chromium' } }],
});
