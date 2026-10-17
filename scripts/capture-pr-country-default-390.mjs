/**
 * 390px WebKit screenshots for pr-country-default QA.
 * Usage:
 *   CAPTURE_LABEL=before CAPTURE_BASE_URL=https://www.gateo.kr/ node scripts/capture-pr-country-default-390.mjs
 *   CAPTURE_LABEL=after CAPTURE_BASE_URL=http://127.0.0.1:4173/ node scripts/capture-pr-country-default-390.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { webkit } from 'playwright';

const OUT_DIR = join(process.cwd(), 'docs/qa/pr-country-default');
const WIDTH = 390;
const HEIGHT = 844;
const LABEL = process.env.CAPTURE_LABEL === 'after' ? 'after' : 'before';
const BASE_URL = (process.env.CAPTURE_BASE_URL || 'https://www.gateo.kr/').replace(/\/?$/, '/');

const CASES = [
  { slug: 'romblon', queries: ['롬블론', 'Romblon'], pick: /롬블론|Romblon/i },
  { slug: 'pamir', queries: ['파미르 고원', '파미르', 'Pamir'], pick: /파미르|Pamir/i },
  {
    slug: 'sao-tome-and-principe',
    queries: ['상투메 프린시페', '상투메', 'Sao Tome'],
    pick: /상투메|프린시페|Sao\s*Tome/i,
  },
  { slug: 'tinian', queries: ['티니안', 'Tinian'], pick: /티니안|Tinian|San\s*Jose/i },
];

async function openExploreSearch(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await search.waitFor({ state: 'visible', timeout: 60_000 });
  await search.click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.waitFor({ state: 'visible', timeout: 20_000 });
  return input;
}

async function clipShot(page, filePath) {
  await page.screenshot({
    path: filePath,
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const manifest = [];

  for (const caseRow of CASES) {
    const input = await openExploreSearch(page);
    await input.click();
    let row = null;
    for (const query of caseRow.queries) {
      await input.fill('');
      await input.fill(query);
      const candidate = page
        .locator('[data-search-popover] button')
        .filter({ hasNotText: 'MOONi' })
        .filter({ hasText: caseRow.pick })
        .first();
      try {
        await candidate.waitFor({ state: 'visible', timeout: 12_000 });
        row = candidate;
        caseRow.query = query;
        break;
      } catch {
        // try next query variant
      }
    }
    if (!row) {
      throw new Error(`no search row for ${caseRow.slug}`);
    }
    const searchFile = `${caseRow.slug}-search-${LABEL}-webkit-390.png`;
    await clipShot(page, join(OUT_DIR, searchFile));
    manifest.push({
      file: searchFile,
      slug: caseRow.slug,
      phase: LABEL,
      surface: 'explore search popover 390',
      query: caseRow.query,
      baseUrl: BASE_URL,
    });

    await row.click();
    await page.waitForTimeout(1200);
    const cardFile = `${caseRow.slug}-card-${LABEL}-webkit-390.png`;
    await clipShot(page, join(OUT_DIR, cardFile));
    manifest.push({
      file: cardFile,
      slug: caseRow.slug,
      phase: LABEL,
      surface: 'home place summary card 390',
      query: caseRow.query,
      baseUrl: BASE_URL,
    });
  }

  const manifestPath = join(OUT_DIR, `manifest-${LABEL}.json`);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await browser.close();
  console.log(`saved ${manifest.length} shots under ${OUT_DIR} (${LABEL})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
