#!/usr/bin/env node
/**
 * Overseas gallery gate + live credit sample: main (legacy) vs branch gate.
 * Optional live browser: PROD vs LOCAL credit lines for ~10 continents.
 *
 *   node scripts/audit-overseas-live-gallery-sample.mjs
 *   SMOKE_SITE_URL=https://127.0.0.1:4173 node scripts/audit-overseas-live-gallery-sample.mjs --live
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  hasExplicitNonKoreaCountry,
  isDomesticKoreaCountry,
  isExplicitlyOverseasForTourApi,
  resolveTourApiPlace,
  shouldUseTourApiGalleryForPlace,
} from '../src/utils/tourApiMatch.js';
import {
  buildGalleryGateContext,
  shouldUseTourApiGalleryMainLegacy,
} from './lib/tourApiGalleryGateMainLegacy.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'gateo-ops/audit/overseas-live-gallery-sample-2026-10-19');

const LIVE_SAMPLE = [
  { slug: 'cairo', continent: 'africa', query: '카이로', result: '카이로여행지' },
  { slug: 'venice', continent: 'europe', query: '베니스', result: '베니스' },
  { slug: 'paris', continent: 'europe', query: '파리', result: '파리' },
  { slug: 'london', continent: 'europe', query: '런던', result: '런던' },
  { slug: 'dubai', continent: 'middle-east', query: '두바이', result: '두바이' },
  { slug: 'bangkok', continent: 'asia', query: '방콕', result: '방콕' },
  { slug: 'tokyo', continent: 'asia', query: '도쿄', result: '도쿄' },
  { slug: 'sydney', continent: 'oceania', query: '시드니', result: '시드니' },
  { slug: 'rio-de-janeiro', continent: 'south-america', query: '리우', result: '리우데자네이루' },
  { slug: 'new-york', continent: 'north-america', query: '뉴욕', result: '뉴욕' },
];

function isOverseasListSpot(spot) {
  const ko = String(spot.country || '').trim();
  const en = String(spot.country_en || '').trim();
  if (ko && isDomesticKoreaCountry(ko)) return false;
  if (en && isDomesticKoreaCountry(en)) return false;
  return Boolean(ko || en);
}

function gateRow(spot, fullSpot) {
  const merged = { ...spot, ...fullSpot };
  const { locations, mapping, koreanName } = buildGalleryGateContext(merged);
  const mainGate = shouldUseTourApiGalleryMainLegacy(locations, mapping, koreanName);
  const branchGate = shouldUseTourApiGalleryForPlace(locations, mapping);
  const explicit = isExplicitlyOverseasForTourApi(merged);
  const country = [merged.country, merged.country_en].filter(Boolean).join(' / ') || '(missing)';
  const coords = Number.isFinite(Number(merged.lat)) && Number.isFinite(Number(merged.lng))
    ? `${merged.lat},${merged.lng}`
    : '(missing)';
  return {
    slug: merged.slug,
    name: merged.name,
    country,
    coords,
    explicitOverseas: explicit,
    mainWouldTourApi: mainGate,
    branchWouldTourApi: branchGate,
    hangulName: /[\uAC00-\uD7A3]/.test(String(merged.name || '')),
    blockReason: explicit
      ? (hasExplicitNonKoreaCountry(merged) ? 'country' : 'coords-outside-korea')
      : '',
  };
}

async function loadFullSpotsBySlug() {
  const { TRAVEL_SPOTS } = await import('../src/pages/Home/data/travelSpots.js');
  const map = new Map();
  for (const spot of TRAVEL_SPOTS) {
    if (spot?.slug) map.set(spot.slug, spot);
  }
  return map;
}

async function liveCreditSample() {
  const { chromium } = await import('playwright');
  const local = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
  const prod = 'https://www.gateo.kr/';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const rows = [];

  async function openSearch(base, query, resultText) {
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

  async function readCredit() {
    const credit = page.locator('[data-gallery-photo-credit]').or(page.getByText(/^사진:/)).first();
    await credit.waitFor({ state: 'attached', timeout: 120_000 });
    await credit.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const text = (await credit.innerText()).trim();
    const hasKto = /한국관광공사|Korea Tourism/i.test(text);
    const hasTourOnly = hasKto && !/Unsplash|Pexels/i.test(text);
    return { text, hasKto, likelyLiveTourApi: hasTourOnly || (hasKto && /tourapi/i.test(text)) };
  }

  for (const sample of LIVE_SAMPLE) {
    try {
      await openSearch(prod, sample.query, sample.result);
      const prodCredit = await readCredit();
      await openSearch(local, sample.query, sample.result);
      const localCredit = await readCredit();
      rows.push({
        ...sample,
        prodCredit: prodCredit.text,
        prodKto: prodCredit.hasKto,
        prodLikelyLiveTourApi: prodCredit.hasKto,
        localCredit: localCredit.text,
        localKto: localCredit.hasKto,
        error: '',
      });
      console.log(
        `${sample.slug}: prod KTO=${prodCredit.hasKto} | local KTO=${localCredit.hasKto}`,
      );
    } catch (err) {
      rows.push({
        ...sample,
        prodCredit: '',
        prodKto: null,
        localCredit: '',
        localKto: null,
        error: String(err?.message || err),
      });
      console.warn(`${sample.slug}: LIVE sample skip — ${err?.message || err}`);
    }
  }
  await browser.close();
  return rows;
}

async function main() {
  const live = process.argv.includes('--live');
  mkdirSync(outDir, { recursive: true });
  const list = JSON.parse(
    readFileSync(join(root, 'src/pages/Home/data/travelSpots-list.json'), 'utf8'),
  );
  const fullMap = await loadFullSpotsBySlug();
  const overseas = list.filter(isOverseasListSpot);
  const allRows = overseas.map((spot) => gateRow(spot, fullMap.get(spot.slug) || {}));
  const mainLiveRisk = allRows.filter((r) => r.mainWouldTourApi && r.explicitOverseas);
  const venice = gateRow(
    list.find((s) => s.slug === 'venice'),
    fullMap.get('venice') || {},
  );

  let liveRows = [];
  if (live) {
    liveRows = await liveCreditSample();
    writeFileSync(
      join(outDir, 'live-credit-sample.json'),
      JSON.stringify(liveRows, null, 2),
      'utf8',
    );
  }

  const md = [
    '# Overseas live TourAPI gallery sample (main legacy gate vs branch)',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Overseas spots in list: **${overseas.length}**`,
    `Main (legacy) would enable TourAPI despite explicit overseas: **${mainLiveRisk.length}**`,
    '(Hangul name heuristic on places that already have non-Korea country or coords)',
    '',
    '## Venice identification',
    '',
    `- SSOT name: **${venice.name}** (Hangul display name triggers legacy main gate)`,
    `- country: **${venice.country}** → \`hasExplicitNonKoreaCountry\` = true`,
    `- coords: **${venice.coords}** → outside Korea bbox → \`isExplicitlyOverseasForTourApi\` = true`,
    `- Branch gate TourAPI: **${venice.branchWouldTourApi}** · Main legacy: **${venice.mainWouldTourApi}**`,
    '',
    '## Gate policy (branch / CEO P1)',
    '',
    'Block TourAPI only when **explicitly overseas** (non-Korea country or coords outside peninsula).',
    'Missing country/coords → **not** blocked (domestic curated hubs keep TourAPI).',
    '',
    '## 10-place live credit sample (run with `--live`)',
    '',
    '| slug | continent | main gate | branch gate | prod credit (KTO?) | local credit (KTO?) |',
    '|------|-----------|-----------|-------------|---------------------|---------------------|',
    ...LIVE_SAMPLE.map((s) => {
      const g = gateRow(
        list.find((x) => x.slug === s.slug) || { slug: s.slug },
        fullMap.get(s.slug) || {},
      );
      const live = liveRows.find((r) => r.slug === s.slug);
      const prodCell = live
        ? `${live.prodKto ? 'yes' : 'no'} — ${live.prodCredit.replace(/\|/g, '/')}`
        : '(run --live)';
      const localCell = live
        ? `${live.localKto ? 'yes' : 'no'} — ${live.localCredit.replace(/\|/g, '/')}`
        : '(run --live)';
      return `| ${s.slug} | ${s.continent} | ${g.mainWouldTourApi} | ${g.branchWouldTourApi} | ${prodCell} | ${localCell} |`;
    }),
    '',
    '## All overseas with legacy main live-fetch risk (first 30)',
    '',
    '| slug | country | coords | block | main | branch |',
    '|------|---------|--------|-------|------|--------|',
    ...mainLiveRisk.slice(0, 30).map((r) => (
      `| ${r.slug} | ${r.country} | ${r.coords} | ${r.blockReason} | ${r.mainWouldTourApi} | ${r.branchWouldTourApi} |`
    )),
    '',
  ].join('\n');

  writeFileSync(join(outDir, 'overseas-live-gallery-sample.md'), md, 'utf8');
  writeFileSync(
    join(outDir, 'overseas-live-gallery-gate.json'),
    JSON.stringify({ mainLiveRiskCount: mainLiveRisk.length, venice, sample: LIVE_SAMPLE.map((s) => gateRow(list.find((x) => x.slug === s.slug), fullMap.get(s.slug) || {})) }, null, 2),
    'utf8',
  );
  console.log(md);
  console.log(`\nWrote ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
