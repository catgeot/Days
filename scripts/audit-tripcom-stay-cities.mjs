/**
 * 트립닷컴 숙소 city 연결 현황.
 * Trip.com을 호출하지 않는다. 다음 세션이 라이브로 볼 배치와 남은 수를 찍는다.
 *
 * node scripts/audit-tripcom-stay-cities.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canShowMrtStayStrip } from '../src/utils/mrtStayQuery.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 하와이처럼 지명이 도시가 아니어서 세션 잔존이 나기 쉬운 1차 배치. 이미 연결된 slug는 빠진다. */
const BATCH_1 = [
  'guam',
  'maldives',
  'seychelles',
  'palawan',
  'canary-islands',
  'galapagos',
  'mauritius',
  'zanzibar',
  'new-caledonia',
  'saipan',
  'okinawa',
  'hokkaido',
  'phuket',
  'boracay',
  'cebu',
  'crete',
  'sicily',
  'madeira',
  'bahamas',
  'cape-verde',
  'la-reunion',
  'uyuni-salt-flat',
  'komodo-island',
  'raja-ampat',
];

function readMappedSlugs() {
  const src = readFileSync(join(root, 'src/utils/affiliate.js'), 'utf8');
  const start = src.indexOf('export const PLANNER_TRIPCOM_HOTEL_CITY_IDS');
  const end = src.indexOf('export const TRIPCOM_HOTEL_SPARSE_INVENTORY_SLUGS');
  if (start < 0 || end < start) throw new Error('city ID block not found');
  const block = src.slice(start, end);
  const map = new Map();
  for (const match of block.matchAll(/^\s*'?([a-z0-9-]+)'?\s*:\s*'(\d+)'/gm)) {
    map.set(match[1], match[2]);
  }
  return map;
}

function readSparseSlugs() {
  const src = readFileSync(join(root, 'src/utils/affiliate.js'), 'utf8');
  const start = src.indexOf('export const TRIPCOM_HOTEL_SPARSE_INVENTORY_SLUGS');
  const end = src.indexOf('function getLocationSlugKey');
  const block = src.slice(start, end);
  return new Set([...block.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]));
}

function isKorea(spot) {
  return /한국|대한민국|South Korea/i.test(`${spot.country || ''} ${spot.country_en || ''}`);
}

const mapped = readMappedSlugs();
const sparse = readSparseSlugs();
const spots = JSON.parse(readFileSync(join(root, 'src/pages/Home/data/travelSpots-list.json'), 'utf8'));
const bySlug = new Map(spots.map((spot) => [String(spot.slug || '').toLowerCase(), spot]));
const eligible = spots.filter((spot) => canShowMrtStayStrip(spot));
const unmapped = eligible.filter((spot) => !mapped.has(String(spot.slug).toLowerCase()));

const missingBatch = BATCH_1.filter((slug) => !bySlug.has(slug));
if (missingBatch.length) {
  console.error(`batch slug missing from travelSpots-list: ${missingBatch.join(', ')}`);
  process.exit(1);
}

const openBatch = BATCH_1.filter((slug) => !mapped.has(slug));
const doneBatch = BATCH_1.filter((slug) => mapped.has(slug));

console.log(`mapped ${mapped.size} · stay-eligible ${eligible.length} · unmapped ${unmapped.length}`);
console.log(
  `unmapped overseas ${unmapped.filter((s) => !isKorea(s)).length} · unmapped korea ${unmapped.filter(isKorea).length}`,
);
console.log(`batch1 open ${openBatch.length} · batch1 already mapped ${doneBatch.length}`);
console.log('');
console.log('batch1');
for (const slug of openBatch) {
  const spot = bySlug.get(slug);
  const flag = sparse.has(slug) ? 'sparse' : 'check';
  console.log(`${flag}\t${slug}\t${spot.name}\t${spot.name_en || ''}\t${spot.country || ''}`);
}
if (doneBatch.length) {
  console.log('');
  console.log('batch1 mapped');
  for (const slug of doneBatch) console.log(`${slug}\t${mapped.get(slug)}`);
}
