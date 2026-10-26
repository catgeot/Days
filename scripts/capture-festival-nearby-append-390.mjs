/**
 * 390px WebKit screenshots: 주변 볼거리 더보기 append (before / after first tap).
 *
 *   npm run build && npx vite preview --host 127.0.0.1 --port 4173
 *   node scripts/capture-festival-nearby-append-390.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { webkit, devices } from 'playwright';
import {
  ensureFestivalNearbyMoreButtonVisible,
  tapFestivalNearbyLoadMore,
  waitFestivalNearbyAttractionsReady,
  waitFestivalNearbyMoreButtonEnabled,
} from './lib/festival-nearby-load-more-qa.mjs';
import {
  analyzeNearbyRestAppend,
  INITIAL_VISIBLE,
  VISIBLE_STEP,
} from './lib/festival-nearby-append-report.mjs';

const OUT_DIR = '/opt/cursor/artifacts/festival-nearby-append-390';
const BASE = (process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:4173').replace(/\/$/, '');

/** 양평·지평, 대전, 강원 — three distinct festivals */
const CAPTURE_FESTIVALS = [
  { id: '4134834', label: 'yangpyeong-jipyeong', titleHint: '지평' },
  { id: '2770434', label: 'daejeon', titleHint: '대전' },
  { id: '2930716', label: 'gangwon-gangneung', titleHint: '강릉' },
  { id: '141105', label: 'gyeongnam-goseong', titleHint: '고성' },
];

const OVERRIDE_IDS = (process.env.FESTIVAL_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

async function rowSnapshots(page) {
  return page.evaluate(() => {
    const list = document.querySelector('[data-nearby-list]');
    if (!list) return [];
    return [...list.querySelectorAll('[data-nearby-attraction-row]')].map((el) => {
      const id = el.getAttribute('data-nearby-row-key') || '';
      const title = el.querySelector('.text-sm.font-bold')?.textContent?.trim() || '';
      const distChip = el.querySelector('.rounded-full.bg-stone-100');
      const distText = distChip?.textContent?.trim() || '';
      let distanceKm = null;
      const kmMatch = distText.match(/([\d.]+)\s*km/i);
      const mMatch = distText.match(/([\d.]+)\s*m\b/i);
      if (kmMatch) distanceKm = Number(kmMatch[1]);
      else if (mMatch) distanceKm = Number(mMatch[1]) / 1000;
      return {
        id,
        title,
        distanceKm,
        distanceLabel: distText || null,
      };
    });
  });
}

async function openFestival(page, festivalId) {
  await page.goto(`${BASE}/korea/?festival=${festivalId}`, {
    waitUntil: 'load',
    timeout: 120_000,
  });
  await page.waitForSelector('#korea-festival-sheet-title', { timeout: 120_000 });
  await page.waitForFunction(
    (id) => new URL(window.location.href).searchParams.get('festival') === id,
    festivalId,
    { timeout: 30_000 },
  );
  await page.waitForTimeout(800);
}

async function clipShot(page, path) {
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

async function readNearbyRestQa(page) {
  return page.evaluate(() => {
    const sheet = document.querySelector('[role="dialog"]');
    if (!sheet?.dataset?.nearbyRestJson) {
      return { rest: [], visibleCount: 5 };
    }
    return {
      rest: JSON.parse(sheet.dataset.nearbyRestJson),
      visibleCount: Number(sheet.dataset.nearbyRestVisible) || INITIAL_VISIBLE,
    };
  });
}

const browser = await webkit.launch({ headless: true });
const context = await browser.newContext({
  ...devices['iPhone 12'],
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
  locale: 'ko-KR',
  ignoreHTTPSErrors: true,
});
await mkdir(OUT_DIR, { recursive: true });

const targets = OVERRIDE_IDS.length
  ? OVERRIDE_IDS.map((id, i) => ({ id, label: `custom-${i + 1}` }))
  : CAPTURE_FESTIVALS;

const report = {
  gitHead: process.env.CAPTURE_GIT_HEAD || null,
  baseUrl: BASE,
  festivals: [],
};

for (const { id: festivalId, label, titleHint } of targets) {
  const page = await context.newPage();
  const fileSlug = `${label}-${festivalId}`;
  const beforePath = `${OUT_DIR}/${fileSlug}-before-more-390.png`;
  const afterPath = `${OUT_DIR}/${fileSlug}-after-more-390.png`;
  try {
    await openFestival(page, festivalId);
    await waitFestivalNearbyAttractionsReady(page);
    const title = await page.locator('#korea-festival-sheet-title').innerText();
    if (titleHint && !title.includes(titleHint)) {
      throw new Error(`title mismatch for ${festivalId}: got "${title}" expected "${titleHint}"`);
    }
    const more = page.locator('[data-festival-near-scenic-more]:not([disabled])').first();
    if (!(await more.count())) {
      report.festivals.push({ id: festivalId, label, title, skipped: 'no 더보기 button' });
      continue;
    }
    await ensureFestivalNearbyMoreButtonVisible(page);
    const restBeforeQa = await readNearbyRestQa(page);
    const itemsBefore = await rowSnapshots(page);
    await clipShot(page, beforePath);
    await waitFestivalNearbyMoreButtonEnabled(page);
    await tapFestivalNearbyLoadMore(page);
    await page.waitForFunction(
      () => {
        const sheet = document.querySelector('[role="dialog"]');
        const visible = Number(sheet?.dataset?.nearbyRestVisible || 0);
        return visible >= 9;
      },
      { timeout: 60_000 },
    );
    await page.waitForTimeout(600);
    const restAfterQa = await readNearbyRestQa(page);
    const itemsAfter = await rowSnapshots(page);
    await clipShot(page, afterPath);
    const restAnalysis = analyzeNearbyRestAppend(
      restBeforeQa.rest,
      restAfterQa.rest,
      restBeforeQa.visibleCount,
    );
    const prefixLen = itemsBefore.length;
    const prefixOk =
      prefixLen > 0 &&
      itemsAfter.length >= prefixLen &&
      itemsBefore.every((row, i) => itemsAfter[i]?.id === row.id);
    report.festivals.push({
      id: festivalId,
      label,
      title,
      beforePath,
      afterPath,
      itemsBefore,
      itemsAfter,
      restBefore: restBeforeQa.rest,
      restAfter: restAfterQa.rest,
      prefixOk,
      appendedCount: restAnalysis.actualAppended.length,
      appendedItems: restAnalysis.actualAppended,
      expectedAppended: restAnalysis.expectedAppended,
      appendedNextNearestOk: restAnalysis.appendedNextNearestOk,
      skippedNearerCandidates: restAnalysis.skippedNearerCandidates,
      remainingSortedHead: restAnalysis.remainingSortedHead,
    });
  } catch (err) {
    report.festivals.push({ id: festivalId, label, error: String(err?.message || err) });
  } finally {
    await page.close();
  }
}

await writeFile(`${OUT_DIR}/capture-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
await browser.close();
