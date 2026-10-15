/**
 * TourAPI festivalDetail → placeCrosslinkFestivalSeed.json
 *
 *   npm run generate:place-crosslink-festival-seed
 *
 * Needs VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (tourapi-proxy).
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from './lib/load-env-file.mjs';
import { PLACE_CROSSLINK_FESTIVAL_ANCHOR_IDS } from './data/place-crosslink-festival-anchors.mjs';
import { hasHangul } from '../src/pages/Home/lib/placeCrosslinkFestivals.js';

loadEnvFile();

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '../src/pages/Home/data/placeCrosslinkFestivalSeed.json');

const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const anon = process.env.VITE_SUPABASE_ANON_KEY;

async function fetchFestivalDetail(contentId) {
  if (!url || !anon) {
    throw new Error(
      'generate:place-crosslink-festival-seed requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
    );
  }
  const res = await fetch(`${url}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'festivalDetail', contentId, locale: 'ko' }),
  });
  if (!res.ok) {
    throw new Error(`festivalDetail ${contentId} HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data?.ok) {
    throw new Error(`festivalDetail ${contentId} not ok: ${data?.message || data?.error || 'unknown'}`);
  }
  return data;
}

function rowFromDetail(contentId, detail) {
  const common = detail?.common || {};
  const intro = detail?.intro || {};
  const title = String(common.title || intro.title || '').trim();
  const eventStartDate = String(intro.eventStartDate || common.eventStartDate || '').trim();
  const eventEndDate = String(intro.eventEndDate || common.eventEndDate || '').trim();
  const row = {
    contentId: String(contentId),
    title,
    addr1: String(common.addr1 || '').trim(),
    mapx: String(common.mapx || '').trim(),
    mapy: String(common.mapy || '').trim(),
    areaCode: String(common.areaCode || intro.areaCode || '').trim(),
    eventStartDate,
    eventEndDate,
  };
  if (title && !hasHangul(title)) {
    row.missingKoreanTitle = true;
  }
  return row;
}

async function main() {
  const items = [];
  const missingKoreanTitles = [];
  for (const contentId of PLACE_CROSSLINK_FESTIVAL_ANCHOR_IDS) {
    const detail = await fetchFestivalDetail(contentId);
    const row = rowFromDetail(contentId, detail);
    items.push(row);
    if (row.missingKoreanTitle) missingKoreanTitles.push(contentId);
    console.log(
      `OK ${contentId} ${row.title} ${row.eventStartDate || '?'}-${row.eventEndDate || '?'}`,
    );
  }

  const generatedAt = new Date().toISOString();
  const payload = {
    meta: {
      version: 2,
      generatedAt,
      source: 'tourapi-proxy festivalDetail (ko)',
      anchorContentIds: PLACE_CROSSLINK_FESTIVAL_ANCHOR_IDS,
      note: 'Supplements manualFestivalEntries.json; regenerate when anchor festivals change.',
      ...(missingKoreanTitles.length
        ? { missingKoreanTitles, missingKoreanTitleReport: 'TourAPI ko detail has no Hangul title for these contentIds' }
        : {}),
    },
    items,
  };
  writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUT_PATH} generatedAt=${generatedAt}`);
  if (missingKoreanTitles.length) {
    console.warn(
      `WARN missing Korean title (TourAPI): ${missingKoreanTitles.join(', ')}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
