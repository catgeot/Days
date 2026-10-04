/**
 * /place/:slug 로 열리는 정적 카탈로그 → fetch-place-videos 허용 목록.
 * 우선순위는 placeRouteHydrate.resolvePlaceTargetFromSlug 와 같다.
 *   travel spot → hub 명소 → hub → 정착지 → cities
 * 쿼리는 카탈로그 이름에서만 만든다. 클라이언트 query 는 쓰지 않는다.
 *
 *   node scripts/generate-place-video-catalog.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { citiesData } from '../src/pages/Home/data/citiesData.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'supabase/functions/fetch-place-videos/placeVideoCatalog.json');

const PLACEHOLDER = new Set(['', 'Explore', 'Global', '바다', 'Ocean']);
const SLUG_RE = /^[a-z0-9_]+(?:-[a-z0-9_]+)*$/;

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'));
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

function hasHangul(s) {
  return /[\u3131-\u318e\uac00-\ud7a3]/.test(s);
}

function isLatinLabel(value) {
  const s = String(value || '').trim();
  if (!s || hasHangul(s)) return false;
  return /[A-Za-z]/.test(s);
}

/** 제목의 <>·제어문자는 거절하지 않고 공백으로 뺀다. */
export function sanitizePlaceVideoQuery(input) {
  const text = String(input || '')
    .replace(/[<>]/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  return text.length > 180 ? text.slice(0, 180).trim() : text;
}

function baseQuery(entry) {
  const name = String(entry?.name || '').trim();
  const nameEn = String(entry?.name_en || '').trim();
  const latin = isLatinLabel(nameEn) ? nameEn : '';
  let country = '';
  if (latin) {
    const countryEn = String(entry?.country_en || '').trim();
    if (isLatinLabel(countryEn) && !PLACEHOLDER.has(countryEn)) country = countryEn;
  } else {
    const raw = String(entry?.country || '').trim();
    if (raw && !PLACEHOLDER.has(raw)) country = raw;
  }
  const primary = latin || name;
  if (!primary) return '';
  const q = country && country.toLowerCase() !== primary.toLowerCase()
    ? `${primary} ${country}`
    : primary;
  return sanitizePlaceVideoQuery(q);
}

function slugKeys(...values) {
  const out = [];
  const seen = new Set();
  for (const value of values) {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) continue;
    const kebab = toUrlSlug(value);
    for (const key of [raw, kebab]) {
      if (!key || seen.has(key) || !SLUG_RE.test(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

const places = new Map();
const scenic = new Map();
const worldEvents = new Map();

function putPlace(slug, entry) {
  const id = String(slug || '').trim().toLowerCase();
  if (!id || !SLUG_RE.test(id) || places.has(id)) return;
  const q = baseQuery(entry);
  if (!q) return;
  places.set(id, q);
}

function putScenic(key, entry) {
  const id = String(key || '').trim();
  if (!id || id.length > 80 || scenic.has(id)) return;
  const lowered = id.toLowerCase();
  if (lowered !== id && scenic.has(lowered)) return;
  const q = sanitizePlaceVideoQuery(entry?.name || entry?.name_en || '');
  if (!q) return;
  scenic.set(/^\d+$/.test(id) ? id : lowered, q);
}

const spots = readJson('src/pages/Home/data/travelSpots-list.json');
for (const spot of spots) {
  putPlace(spot.slug, spot);
}

const hubs = readJson('src/pages/Home/data/cityAttractionHubs.json');
for (const hub of hubs) {
  for (const attraction of hub.attractions || []) {
    const entry = {
      name: attraction.name,
      name_en: attraction.name_en,
      country: hub.country,
      country_en: hub.country_en,
    };
    for (const key of slugKeys(attraction.name_en, attraction.name)) putPlace(key, entry);
    if (attraction.contentId) putScenic(String(attraction.contentId).trim(), { name: attraction.name, name_en: attraction.name_en });
    const slug = toUrlSlug(attraction.name_en || attraction.name);
    if (slug) putScenic(slug, { name: attraction.name, name_en: attraction.name_en });
  }
}
for (const hub of hubs) {
  const entry = {
    name: hub.name,
    name_en: hub.name_en,
    country: hub.country,
    country_en: hub.country_en,
  };
  putPlace(hub.hubId, entry);
  for (const key of slugKeys(hub.name_en, hub.name, hub.hubId, ...(hub.aliases || []))) {
    putPlace(key, entry);
  }
}

const settlements = readJson('src/pages/Home/data/mapboxSettlementPlaces.json');
const hubById = new Map(hubs.map((hub) => [hub.hubId, hub]));
for (const row of settlements) {
  const hub = hubById.get(row.hubId);
  for (const settlement of row.settlements || []) {
    const entry = {
      name: settlement.name,
      name_en: settlement.name_en,
      country: hub?.country,
      country_en: hub?.country_en,
    };
    putPlace(settlement.placeId, entry);
    for (const key of slugKeys(settlement.name_en, settlement.name, settlement.placeId)) {
      putPlace(key, entry);
    }
  }
}

for (const city of citiesData || []) {
  putPlace(city.slug, city);
  for (const key of slugKeys(city.name_en, city.slug)) putPlace(key, city);
}

function addScenicSpot(spot) {
  if (!spot || typeof spot !== 'object') return;
  const name = spot.name || spot.attractionName || spot.tourTitle;
  const nameEn = spot.name_en || spot.attractionNameEn || spot.nameEn;
  const entry = { name, name_en: nameEn };
  if (spot.contentId) putScenic(String(spot.contentId).trim(), entry);
  if (spot.placeSlug) putScenic(spot.placeSlug, entry);
  if (spot.id) putScenic(spot.id, entry);
}

for (const spot of readJson('src/pages/Home/data/koreaScenicSpots.json').spots || []) addScenicSpot(spot);
for (const spot of readJson('src/pages/Home/data/koreaTop10Scenic.json').spots || []) addScenicSpot(spot);
for (const spot of readJson('src/pages/Home/data/koreaHeritageScenic.json').spots || []) addScenicSpot(spot);
for (const list of readJson('src/pages/Home/data/koreaLocalScenicLists.json')) {
  for (const member of list.members || []) {
    addScenicSpot({
      name: member.attractionName || member.name,
      name_en: member.name_en,
      contentId: member.contentId,
      placeSlug: member.placeSlug,
      id: member.id,
    });
  }
}
for (const row of Object.values(readJson('src/pages/Home/data/koreaThemeRegionTour.json').byAttractionId || {})) {
  addScenicSpot({ name: row.tourTitle, contentId: row.contentId });
}

const events = readJson('src/pages/Home/data/worldEvents.json').events || [];
for (const event of events) {
  const id = String(event.id || '').trim().toLowerCase();
  if (!id) continue;
  const ko = sanitizePlaceVideoQuery(event.youtubeSearchQueryKo || event.title || '');
  const en = sanitizePlaceVideoQuery(event.youtubeSearchQueryEn || event.titleEn || ko);
  if (ko) worldEvents.set(`${id}:ko`, ko);
  if (en) worldEvents.set(`${id}:en`, en);
}

const catalog = {
  places: Object.fromEntries([...places.entries()].sort(([a], [b]) => a.localeCompare(b))),
  scenic: Object.fromEntries([...scenic.entries()].sort(([a], [b]) => a.localeCompare(b))),
  worldEvents: Object.fromEntries([...worldEvents.entries()].sort(([a], [b]) => a.localeCompare(b))),
};

writeFileSync(outPath, `${JSON.stringify(catalog)}\n`);
console.log(
  `places ${places.size} scenic ${scenic.size} worldEvents ${worldEvents.size} → ${outPath}`,
);
