import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT_DIR = '/opt/cursor/artifacts/explore-choseong';

function shotBox() {
  return { x: 0, y: 0, width: 390, height: 844 };
}

async function saveShot(page, name) {
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, name);
  await page.screenshot({ path, clip: shotBox() });
  return path;
}

async function silenceRemote(context) {
  await context.route(/\/functions\/v1\//i, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, items: [] }),
    });
  });
  await context.route(/api\.mapbox\.com/i, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"suggestions":[],"features":[]}',
    });
  });
}

async function openExplore(page, lang) {
  await page.goto(lang === 'en' ? '/explore?lang=en' : '/explore');
  const searchInput = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await expect(searchInput).toBeVisible({ timeout: 60_000 });
  return searchInput;
}

test('390 explore choseong, completed 서울, and english Seoul', async ({ page, context }, testInfo) => {
  await silenceRemote(context);
  const project = testInfo.project.name.includes('webkit') ? 'webkit' : 'chromium';

  const choseongInput = await openExplore(page, 'ko');
  await choseongInput.fill('ㅅㅇ');
  const seoulFromChoseong = page.getByRole('button', { name: /서울/ }).first();
  await expect(seoulFromChoseong).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: /수원/ }).first()).toBeVisible();
  await saveShot(page, `ko-choseong-390-${project}.png`);

  await choseongInput.fill('서울');
  const seoulFromSyllable = page.getByRole('button', { name: /서울/ }).first();
  await expect(seoulFromSyllable).toBeVisible({ timeout: 20_000 });
  await saveShot(page, `ko-complete-390-${project}.png`);

  const englishInput = await openExplore(page, 'en');
  await englishInput.fill('Seoul');
  await expect(page.getByRole('button', { name: /Seoul|서울/ }).first()).toBeVisible({
    timeout: 20_000,
  });
  await saveShot(page, `en-seoul-390-${project}.png`);
});
