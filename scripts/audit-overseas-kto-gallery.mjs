#!/usr/bin/env node
/**
 * Read-only audit: overseas travel spots whose place_stats gallery still has TourAPI/KTO rows.
 *
 *   node scripts/audit-overseas-kto-gallery.mjs
 *   node scripts/audit-overseas-kto-gallery.mjs --markdown
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isDomesticKoreaCountry,
  resolveTourApiPlace,
  shouldUseTourApiGalleryForPlace,
} from '../src/utils/tourApiMatch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'gateo-ops/audit/overseas-kto-gallery-2026-10-19');

function isTourApiStoredImage(img) {
  if (!img || typeof img !== 'object') return false;
  if (img.source === 'tourapi') return true;
  if (String(img.id ?? '').startsWith('tourapi')) return true;
  const url = String(
    img.urls?.regular || img.urls?.small || img.url || img.image_url || '',
  ).toLowerCase();
  return (
    url.includes('visitkorea')
    || url.includes('kto.or.kr')
    || url.includes('api.visitkorea')
    || url.includes('tong.visitkorea')
  );
}

function countTourApiImages(gallery) {
  const list = Array.isArray(gallery) ? gallery : [];
  const wrong = list.filter(isTourApiStoredImage);
  const sources = new Set();
  for (const img of wrong) {
    if (img.source === 'tourapi' || String(img.id ?? '').startsWith('tourapi')) {
      sources.add('tourapi');
    } else {
      sources.add('kto_url');
    }
  }
  return { wrongCount: wrong.length, sources: [...sources] };
}

function isOverseasSpot(spot) {
  const ko = String(spot.country || '').trim();
  const en = String(spot.country_en || '').trim();
  if (ko && isDomesticKoreaCountry(ko)) return false;
  if (en && isDomesticKoreaCountry(en)) return false;
  return Boolean(ko || en);
}

async function fetchPlaceStatsRows(slugs) {
  const url = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const anon = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) {
    return { rows: [], live: false };
  }
  const chunkSize = 80;
  const rows = [];
  for (let i = 0; i < slugs.length; i += chunkSize) {
    const chunk = slugs.slice(i, i + chunkSize);
    const q = new URL(`${url}/rest/v1/place_stats`);
    q.searchParams.set('select', 'place_id,name_ko,gallery_urls');
    q.searchParams.set('place_id', `in.(${chunk.map((s) => `"${s}"`).join(',')})`);
    const res = await fetch(q, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    });
    if (!res.ok) {
      throw new Error(`place_stats ${res.status}`);
    }
    const data = await res.json();
    if (Array.isArray(data)) rows.push(...data);
  }
  return { rows, live: true };
}

function wouldHangulBugEnableTourApi(spot) {
  const mapping = resolveTourApiPlace(spot);
  const hangulName = /[\uAC00-\uD7A3]/.test(String(spot.name || ''));
  return hangulName && shouldUseTourApiGalleryForPlace([spot], mapping) === false
    ? false
    : hangulName;
}

async function main() {
  const markdown = process.argv.includes('--markdown');
  const list = JSON.parse(
    readFileSync(join(root, 'src/pages/Home/data/travelSpots-list.json'), 'utf8'),
  );
  const overseas = list.filter(isOverseasSpot);
  const { rows, live } = await fetchPlaceStatsRows(overseas.map((s) => s.slug));
  const byId = new Map(rows.map((row) => [String(row.place_id), row]));

  const affected = [];
  let hangulRisk = 0;
  for (const spot of overseas) {
    const mapping = resolveTourApiPlace(spot);
    if (!shouldUseTourApiGalleryForPlace([spot], mapping)) {
      if (/[\uAC00-\uD7A3]/.test(String(spot.name || ''))) hangulRisk += 1;
    }
    const row = byId.get(spot.slug);
    if (!row?.gallery_urls?.length) continue;
    const { wrongCount, sources } = countTourApiImages(row.gallery_urls);
    if (wrongCount === 0) continue;
    affected.push({
      slug: spot.slug,
      name: spot.name,
      country: spot.country,
      wrongPhotos: wrongCount,
      sources: sources.join('|'),
      source: live ? 'place_stats_db' : 'unavailable',
    });
  }

  mkdirSync(outDir, { recursive: true });
  const csvHeader = 'slug,name,country,wrong_photos,sources,source\n';
  const csvBody = affected
    .map((row) => [
      row.slug,
      `"${String(row.name).replace(/"/g, '""')}"`,
      `"${String(row.country).replace(/"/g, '""')}"`,
      row.wrongPhotos,
      row.sources,
      row.source,
    ].join(','))
    .join('\n');
  const csvPath = join(outDir, 'overseas-kto-gallery.csv');
  writeFileSync(csvPath, csvHeader + csvBody + (csvBody ? '\n' : ''), 'utf8');

  const md = [
    '# Overseas places with KTO/TourAPI gallery rows (read-only audit)',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Overseas spots scanned: **${overseas.length}**`,
    `DB live (${live ? 'yes' : 'no — set VITE_SUPABASE_URL + anon for live rows'})`,
    `Affected overseas places (cached wrong photos): **${affected.length}**`,
    `Overseas spots with Hangul names (old bug surface): **${hangulRisk}**`,
    '',
    '| slug | name | country | wrong photos | sources |',
    '|------|------|---------|--------------|---------|',
    ...affected.map((row) => (
      `| ${row.slug} | ${row.name} | ${row.country} | ${row.wrongPhotos} | ${row.sources} |`
    )),
    '',
  ].join('\n');
  const mdPath = join(outDir, 'overseas-kto-gallery.md');
  writeFileSync(mdPath, md, 'utf8');

  console.log(`overseas scanned: ${overseas.length}`);
  console.log(`affected (wrong KTO/TourAPI in DB): ${affected.length}`);
  console.log(`csv: ${csvPath}`);
  console.log(`md: ${mdPath}`);
  if (markdown) console.log('\n' + md);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
