/**
 * GATEO 선정 명소 SSOT audit — count / order / hub resolve / placeSlug / regions.
 *
 *   npm run audit:korea-scenic-spots
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '../src/pages/Home/data/koreaScenicSpots.json');
const HUBS_PATH = join(__dirname, '../src/pages/Home/data/cityAttractionHubs.json');

const MIN_COUNT = 12;
/** 권역·시군 hub 보강 여유 (품질 게이트는 hub exact + contentId) */
const MAX_COUNT = 150;
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
  assert(
    String(data.meta?.disclaimer || '').includes('인기 관광지'),
    'meta.disclaimer is short curated blurb',
  );
  assert(Array.isArray(spots), 'spots is array');
  assert(
    spots.length >= MIN_COUNT && spots.length <= MAX_COUNT,
    `count ${MIN_COUNT}–${MAX_COUNT} (got ${spots.length})`,
  );
  assert(data.meta?.count === spots.length, 'meta.count === spots.length');

  const hubIndex = new Map();
  for (const hub of hubs) {
    for (const attraction of hub.attractions || []) {
      hubIndex.set(`${normalizeKey(hub.hubId)}::${normalizeKey(attraction.name)}`, {
        hub,
        attraction,
      });
    }
  }

  const byId = new Set();
  const orders = new Set();
  let prevOrder = 0;
  const regionsSeen = new Set();

  for (const spot of spots) {
    const id = String(spot?.id || '');
    assert(Boolean(id) && /^[a-z0-9-]+$/.test(id), `id kebab: ${id || '(empty)'}`);
    assert(!byId.has(id), `unique id: ${id}`);
    byId.add(id);

    const order = Number(spot?.order);
    assert(Number.isInteger(order) && order >= 1, `${id}: order positive int`);
    assert(!orders.has(order), `${id}: unique order ${order}`);
    orders.add(order);
    assert(order > prevOrder, `${id}: sorted ascending (got ${order} after ${prevOrder})`);
    prevOrder = order;

    const name = String(spot?.name || '').trim();
    assert(Boolean(name) && name.length <= 40, `${id}: name`);
    const blurb = String(spot?.blurb || '').trim();
    assert(Boolean(blurb) && blurb.length <= 80, `${id}: blurb`);
    assert(ALLOWED_REGIONS.has(String(spot?.region || '')), `${id}: region`);
    regionsSeen.add(String(spot.region));

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

  assert(regionsSeen.size >= 4, `region diversity ≥4 (got ${regionsSeen.size})`);

  if (failed) {
    console.error(`\n${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log(`\nkorea-scenic-spots audit PASS — ${spots.length} spots · ${regionsSeen.size} regions`);
}

main();
