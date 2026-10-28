/** Flag-off baseline + flag-on — compare mobile cairo at 390. */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const BASE = (process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:4173').replace(/\/$/, '');
const OUT = process.env.PLACE_LEFT_INFO_SHOT_DIR || '/opt/cursor/artifacts/place-desktop-left-info';

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: 'ko-KR', viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/place/cairo?lang=ko`, { waitUntil: 'networkidle' });
  await page.getByText('카이로').first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(OUT, 'cairo-1440-flag-off-baseline.png') });
  console.log('wrote flag-off baseline (only when preview built without flag)');
  await browser.close();
}

main();
