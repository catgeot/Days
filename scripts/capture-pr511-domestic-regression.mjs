#!/usr/bin/env node
/**
 * Compare domestic curated photo credit: production (main) vs local fix build.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const OUT = process.env.PR511_QA_OUT || '/opt/cursor/artifacts/pr511-qa';
const LOCAL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const PROD = 'https://www.gateo.kr/';

/** hub/scenic entry without country on location object */
const CASES = [
  {
    id: 'yanggu-hub-search',
    label: '양구 (curated hub, search)',
    query: '양구',
    result: '양구',
    expectKto: true,
  },
  {
    id: 'gyeongbokgung-search',
    label: '경복궁 (curated, Seoul)',
    query: '경복궁',
    result: '경복궁',
    expectKto: true,
  },
  {
    id: 'gangneung-search',
    label: '강릉 (curated domestic city)',
    query: '강릉',
    result: '강릉',
    expectKto: true,
  },
];

async function openFromSearch(page, base, query, resultText) {
  await page.goto(`${base}?lang=ko`, { waitUntil: 'networkidle', timeout: 120_000 });
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await search.waitFor({ state: 'visible', timeout: 120_000 });
  await search.click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.fill(query);
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: resultText })
    .first();
  await row.waitFor({ state: 'visible', timeout: 30_000 });
  await row.click();
  await page.waitForURL(/\/place\//, { timeout: 60_000 });
}

async function readPhotoCredit(page) {
  const credit = page.locator('[data-gallery-photo-credit]').or(page.getByText(/^사진:/)).first();
  await credit.waitFor({ state: 'attached', timeout: 120_000 });
  await credit.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const text = (await credit.innerText()).trim();
  const hasKto = /한국관광공사|Korea Tourism/i.test(text);
  return { text, hasKto };
}

async function captureOne(page, base, caseRow, env) {
  await openFromSearch(page, base, caseRow.query, caseRow.result);
  const { text, hasKto } = await readPhotoCredit(page);
  await page.screenshot({
    path: join(OUT, `pr511-domestic-${caseRow.id}-${env}-390.png`),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  return { text, hasKto };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const report = [];

  for (const caseRow of CASES) {
    const prod = await captureOne(page, PROD, caseRow, 'prod');
    const local = await captureOne(page, LOCAL, caseRow, 'local');
    const regression = caseRow.expectKto && prod.hasKto && !local.hasKto;
    report.push({
      id: caseRow.id,
      label: caseRow.label,
      prodCredit: prod.text,
      localCredit: local.text,
      prodHasKto: prod.hasKto,
      localHasKto: local.hasKto,
      regression,
    });
    console.log(
      `${caseRow.id}: prod KTO=${prod.hasKto} local KTO=${local.hasKto} regression=${regression}`,
    );
  }
  await browser.close();
  const md = [
    '# PR511 domestic curated regression (prod vs local)',
    '',
    ...report.map((r) => (
      `- **${r.label}** (${r.id}): prod「${r.prodCredit}」→ local「${r.localCredit}」 regression=${r.regression}`
    )),
    '',
  ].join('\n');
  await writeFile(join(OUT, 'domestic-regression-report.md'), md, 'utf8');
  console.log(md);
  if (report.some((r) => r.regression)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
