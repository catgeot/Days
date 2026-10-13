/**
 * Gangneung festival 2930716 — nearby rows with landmark icons (no photo).
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const OUT =
  process.env.COS_QA_SCREENSHOT_DIR ||
  '/workspace/.qa-artifacts/cos-site-qa-445';
const PORT = Number(process.env.COS_QA_PREVIEW_PORT || 4174);
const BASE = `https://127.0.0.1:${PORT}`;
const FESTIVAL = '2930716';

async function waitPreview() {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${BASE}/korea/`)).ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview down');
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitPreview();
  const browser = await chromium.launch();
  const page = await (
    await browser.newContext({ ignoreHTTPSErrors: true, locale: 'ko-KR' })
  ).newPage();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${BASE}/korea/?festival=${FESTIVAL}&bust=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
  });
  const nearbyHeading = page.locator('[data-nearby-heading]');
  await nearbyHeading.waitFor({ state: 'visible', timeout: 120_000 });
  await nearbyHeading.scrollIntoViewIfNeeded();
  const rigo = page.locator('li', { hasText: '리고엠' }).first();
  const heo = page.locator('li', { hasText: '허균' }).first();
  await rigo.waitFor({ state: 'visible', timeout: 120_000 });
  await heo.waitFor({ state: 'visible', timeout: 120_000 });
  for (let i = 0; i < 90; i++) {
    const pending = await page.locator('[data-nearby-thumb-pending]').count();
    const rigoIcon = await rigo.locator('[data-nearby-thumb="empty"]').count();
    const heoIcon = await heo.locator('[data-nearby-thumb="empty"]').count();
    if (pending === 0 && rigoIcon > 0 && heoIcon > 0) break;
    await page.waitForTimeout(1000);
  }
  const rigoIcon = await rigo.locator('[data-nearby-thumb="empty"]').count();
  const heoIcon = await heo.locator('[data-nearby-thumb="empty"]').count();
  if (!rigoIcon || !heoIcon) {
    throw new Error(`expected landmark icons: 리고엠=${rigoIcon} 허균=${heoIcon}`);
  }
  const box = await nearbyHeading.boundingBox();
  const list = page.locator('[data-nearby-heading]').locator('..').locator('ul').first();
  const listBox = await list.boundingBox();
  if (!box || !listBox) throw new Error('layout missing');
  const y = Math.max(0, box.y - 4);
  const height = Math.min(520, listBox.y + listBox.height - y);
  const outPath = path.join(OUT, 'cos-gangneung-nearby-icons-390.png');
  await page.screenshot({
    path: outPath,
    clip: { x: 0, y, width: 390, height },
  });
  console.log(`saved ${outPath}`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
