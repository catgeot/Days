import { webkit } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const baseURL = process.env.PREVIEW_URL || 'https://127.0.0.1:4173';
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/screenshots/mooni-festival-access-r7';

const CASES = [
  { testId: 'mooni-access-638576-seoul', file: '638576-seoul-access-390x844.png' },
  { testId: 'mooni-access-637693-daegu', file: '637693-daegu-access-390x844.png' },
];

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Preview not ready: ${url}`);
}

let previewProc;
if (!process.env.PREVIEW_URL) {
  previewProc = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    env: { ...process.env, VITE_GATEO_QA_MOONI_MD_FIXTURE: '1' },
  });
  await waitForServer(`${baseURL}/`);
}

await mkdir(outDir, { recursive: true });

const browser = await webkit.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

for (const { testId, file } of CASES) {
  await page.goto(`${baseURL}/qa/mooni-festival-access-polish`, { waitUntil: 'networkidle' });
  const panel = page.locator(`[data-testid="${testId}"]`);
  await panel.waitFor({ state: 'visible', timeout: 60_000 });
  await panel.screenshot({
    path: path.join(outDir, file),
  });
}

await browser.close();
if (previewProc) previewProc.kill('SIGTERM');

console.log(`mooni festival access screenshots → ${outDir}`);
