/**
 * 10대 절경 SSOT audit — count / rank / hub resolve / placeSlug.
 *
 *   npm run audit:korea-top10-scenic
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '../src/pages/Home/data/koreaTop10Scenic.json');
const HUBS_PATH = join(__dirname, '../src/pages/Home/data/cityAttractionHubs.json');

const EXPECTED_COUNT = 10;
const ALLOWED_REGIONS = new Set(['제주', '강원', '전라', '경상', '수도권', '충청']);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

function normalizeKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function toUrlSlug(nameEn) {
  if (!nameEn) return '';
  return String(nameEn)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function main() {
  const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const hubs = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));
  const spots = data.spots || [];

  assert(data.meta?.version === 1, 'meta.version === 1');
  assert(data.meta?.curation === 'GATEO', 'meta.curation === GATEO');
  assert(String(data.meta?.disclaimer || '').includes('GATEO'), 'meta.disclaimer mentions GATEO');
  assert(Array.isArray(spots), 'spots is array');
  assert(spots.length === EXPECTED_COUNT, `count === ${EXPECTED_COUNT}`);

  const hubIndex = new Map();
  for (const hub of hubs) {
    for (const attraction of hub.attractions || []) {
      hubIndex.set(`${normalizeKey(hub.hubId)}::${normalizeKey(attraction.name)}`, {
        hub,
        attraction,
      });
    }
  }

  const byId = new Map();
  const ranks = new Set();
  let prevRank = 0;

  for (const spot of spots) {
    const id = String(spot?.id || '');
    assert(Boolean(id) && /^[a-z0-9-]+$/.test(id), `id kebab: ${id || '(empty)'}`);
    assert(!byId.has(id), `unique id: ${id}`);
    byId.set(id, spot);

    const rank = Number(spot?.rank);
    assert(Number.isInteger(rank) && rank >= 1 && rank <= EXPECTED_COUNT, `${id}: rank 1–10`);
    assert(!ranks.has(rank), `${id}: unique rank ${rank}`);
    ranks.add(rank);
    assert(rank === prevRank + 1, `${id}: sorted contiguous (got ${rank} after ${prevRank})`);
    prevRank = rank;

    const name = String(spot?.name || '').trim();
    assert(Boolean(name) && name.length <= 40, `${id}: name`);
    const blurb = String(spot?.blurb || '').trim();
    assert(Boolean(blurb) && blurb.length <= 80, `${id}: blurb`);
    assert(ALLOWED_REGIONS.has(String(spot?.region || '')), `${id}: region`);

    const hubId = String(spot?.hubId || '');
    const attractionName = String(spot?.attractionName || '');
    const hit = hubIndex.get(`${normalizeKey(hubId)}::${normalizeKey(attractionName)}`);
    assert(Boolean(hit), `${id}: hub attraction resolve (${hubId} / ${attractionName})`);

    if (hit) {
      const expectedSlug = toUrlSlug(hit.attraction.name_en || hit.attraction.name);
      assert(spot.placeSlug === expectedSlug, `${id}: placeSlug === ${expectedSlug}`);
      assert(Number.isFinite(Number(spot.lat)), `${id}: lat`);
      assert(Number.isFinite(Number(spot.lng)), `${id}: lng`);
    }

    if (spot.contentId != null) {
      assert(/^\d+$/.test(String(spot.contentId)), `${id}: contentId digits or null`);
    }
  }

  for (let r = 1; r <= EXPECTED_COUNT; r += 1) {
    assert(ranks.has(r), `rank present: ${r}`);
  }

  if (failed) {
    console.error(`\n${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log(`\nkorea-top10-scenic audit PASS — ${spots.length} spots`);
}

main();
