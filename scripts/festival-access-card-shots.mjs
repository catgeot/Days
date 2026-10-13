/**
 * Manual WebKit 390 walk: home → festival chip → region chip → festival → 가는 법 → MOONi.
 * Calls the live transport-proxy. Not part of CI.
 *
 *   DEV server on http://127.0.0.1:5173
 *   node scripts/festival-access-card-shots.mjs
 */
import { mkdirSync } from 'node:fs';
import { webkit } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';
const outDir = process.env.FESTIVAL_ACCESS_SHOTS_DIR || '/opt/cursor/artifacts';
mkdirSync(outDir, { recursive: true });

const targets = [
  { id: 'gangneung', region: '강원', title: /강릉 국수/ },
  { id: 'hampyeong', region: '전남', title: /국향대전/ },
  { id: 'masan', region: '경남', title: /마산가고파|가고파국화/ },
];

function shot(page, name) {
  return page.screenshot({ path: `${outDir}/${name}.png` });
}

async function dismissHint(page) {
  const close = page.getByRole('button', { name: /^닫기$|^Close$/ }).first();
  if (await close.isVisible().catch(() => false)) {
    await close.click();
  }
}

async function openKoreaFromHome(page, { captureHome = false, label = 'flow' } = {}) {
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  const expand = page.getByRole('button', { name: /바로가기 메뉴 펼치기/ });
  await expand.waitFor({ timeout: 30_000 });
  if (captureHome) await shot(page, `${label}-00-home`);
  await expand.click();
  if (captureHome) await shot(page, `${label}-01-chips`);
  await page.locator('a[href="/korea"]:visible').first().click();
  await page.getByRole('heading', { name: /한국의 축제|Korea festivals/ }).waitFor({ timeout: 60_000 });
  await dismissHint(page);
}

async function openFestival(page, target) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  const region = page.locator('header').getByRole('button', { name: new RegExp(`^${target.region}(?:\\s|$)`) });
  await region.click();
  const row = page.getByRole('main').getByRole('button').filter({ hasText: target.title }).first();
  try {
    await row.waitFor({ timeout: 90_000 });
  } catch (error) {
    const names = await page.getByRole('main').getByRole('button').allInnerTexts();
    console.log(`${target.id} list sample:\n${names.slice(0, 25).join('\n')}`);
    throw error;
  }
  await row.scrollIntoViewIfNeeded();
  await shot(page, `${target.id}-01-list`);
  await row.click();
  await page.locator('#korea-festival-sheet-title').waitFor({ timeout: 30_000 });
  const card = page.locator('#festival-access');
  await card.waitFor({ timeout: 30_000 });
  await card.scrollIntoViewIfNeeded();
  const status = card.locator('[data-festival-access-status]');
  await status.waitFor();
  await page.waitForFunction(() => {
    const node = document.querySelector('[data-festival-access-status]');
    return node && node.getAttribute('data-festival-access-status') !== 'loading';
  }, null, { timeout: 45_000 });
  const state = await status.getAttribute('data-festival-access-status');
  const text = (await card.innerText()).replace(/\s+/g, ' ').slice(0, 500);
  console.log(`${target.id} status=${state} text=${text}`);
  if (state !== 'ready') throw new Error(`${target.id} access status ${state}`);
  if (!/\d{2}:\d{2}/.test(text)) throw new Error(`${target.id} has no clock`);
  if (/무료|(^|[^\d,])0원/.test(text)) throw new Error(`${target.id} shows a zero fare`);
  await page.evaluate(() => {
    document.querySelector('[data-flight-debug-panel]')?.remove();
    document.querySelector('[data-cloud-preview-work-log]')?.remove();
  });
  const trainRow = card.locator('[data-festival-access-mode="train"]').first();
  await trainRow.scrollIntoViewIfNeeded();
  await trainRow.evaluate((node) => node.scrollIntoView({ block: 'center' }));
  await shot(page, `${target.id}-02-access`);
  const busChip = card.getByRole('button', { name: /동서울|서울경부/ }).first();
  if (await busChip.count()) {
    await busChip.click();
    const busRow = card.locator('[data-festival-access-mode="expBus"], [data-festival-access-mode="suburbsBus"]').first();
    await busRow.waitFor({ timeout: 10_000 });
    await busRow.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    const busText = (await card.innerText()).replace(/\s+/g, ' ');
    if (!/고속버스|시외버스/.test(busText)) throw new Error(`${target.id} bus origin has no bus label`);
    console.log(`${target.id} bus ${busText.slice(0, 280)}`);
    await shot(page, `${target.id}-02b-bus`);
  }
  await page.locator('[data-festival-access-mooni]').click();
  await page.getByRole('button', { name: '채팅 닫기' }).waitFor({ timeout: 20_000 });
  await page.getByTestId('mooni-festival-opening').waitFor({ timeout: 20_000 });
  await shot(page, `${target.id}-03-mooni`);
  await page.getByRole('button', { name: '🚆 가는 법' }).click();
  await page.getByTestId('mooni-festival-access-dock').waitFor({ timeout: 15_000 });
  await shot(page, `${target.id}-04-mooni-access`);
  await page.getByRole('button', { name: '채팅 닫기' }).click();
}

async function openUnsupported(page) {
  await openKoreaFromHome(page);
  await page.getByRole('button', { name: /지역 대분류/ }).click();
  await page.locator('header').getByRole('button', { name: /^서울(?:\s|$)/ }).click();
  const row = page.getByRole('main').getByRole('button').filter({ hasText: /축제|제|페스티벌/ }).first();
  await row.waitFor({ timeout: 90_000 });
  await row.click();
  await page.locator('#korea-festival-sheet-title').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  const count = await page.locator('#festival-access').count();
  const title = await page.locator('#korea-festival-sheet-title').innerText();
  console.log(`unsupported title=${title.replace(/\s+/g, ' ')} accessCards=${count}`);
  if (count !== 0) throw new Error('unsupported festival rendered an access card');
  await shot(page, 'seoul-fallback-sheet');
}

const browser = await webkit.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
});
page.setDefaultTimeout(30_000);
try {
  for (const target of targets) {
    await openKoreaFromHome(page, { captureHome: true, label: target.id });
    await openFestival(page, target);
  }
  await openUnsupported(page);
  console.log('shots ok');
} finally {
  await browser.close();
}
