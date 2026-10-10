/**
 * Pull real festival detail + nearby places for staging screenshots.
 *
 *   node scripts/staging/capture-festival-opening-fixtures.mjs
 *
 * Uses the public tourapi-proxy (prod or VITE_SUPABASE_URL) with the public anon key.
 * Writes buildFestivalMooniContext inputs under scripts/staging/fixtures/festival-opening/.
 * Load one with FESTIVAL_FIXTURE=scripts/staging/fixtures/festival-opening/2930716.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isNearbyTourAttractionTitle } from '../../src/pages/Home/lib/koreaTourAttractionNearbyFilter.js';
import { isFestivalOpeningNearbyName } from '../../src/pages/Korea/lib/festivalMooniContext.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = join(root, 'scripts/staging/fixtures/festival-opening');
const TARGETS = [
  { contentId: '2930716', label: '강릉 국수 축제' },
  { contentId: '1998564', label: '서울 궁중문화축전' },
  { contentId: '2855626', label: '부산 옥토버페스트' },
];
const RADIUS_M = '1500';
const NEARBY_TYPES = ['12', '39'];

function degrees(value) {
  let n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (Math.abs(n) > 1000) n /= 1e7;
  return n;
}

async function invoke(action, payload) {
  const url = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const anon = String(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
  const res = await fetch(`${url}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
    signal: AbortSignal.timeout(25000),
  });
  const data = await res.json().catch(() => ({}));
  return { httpStatus: res.status, data };
}

function pick(row, ...keys) {
  for (const key of keys) {
    const value = String(row?.[key] ?? '').trim();
    if (value) return value;
  }
  return '';
}

function nearbyNames(items, title) {
  const rows = [];
  for (const item of items) {
    const name = pick(item, 'title', 'name');
    if (!name || name === title) continue;
    if (!isNearbyTourAttractionTitle(name) || !isFestivalOpeningNearbyName(name)) continue;
    const dist = Number(item?.dist);
    rows.push({
      name,
      dist: Number.isFinite(dist) ? dist : 999999,
      attraction: item?.contentTypeId === '12' ? 0 : 1,
    });
  }
  rows.sort((a, b) => a.attraction - b.attraction || a.dist - b.dist);
  const names = [];
  for (const row of rows) {
    if (names.includes(row.name)) continue;
    names.push(row.name);
    if (names.length >= 6) break;
  }
  return names;
}

async function loadNearby(mapx, mapy) {
  const lng = degrees(mapx);
  const lat = degrees(mapy);
  if (lng == null || lat == null || lng < 124 || lng > 132.5 || lat < 32.8 || lat > 39.5) {
    return [];
  }
  const items = [];
  for (const contentTypeId of NEARBY_TYPES) {
    const res = await invoke('locationBasedList', {
      mapX: lng,
      mapY: lat,
      radius: RADIUS_M,
      contentTypeId,
      numOfRows: '20',
      arrange: 'E',
    });
    if (res.data?.ok && Array.isArray(res.data.items)) {
      items.push(...res.data.items.map((item) => ({ ...item, contentTypeId })));
    }
  }
  return items;
}

function toInput(contentId, detail, nearbyItems) {
  const intro = detail.intro || {};
  const common = detail.common || {};
  const title = pick(common, 'title') || pick(intro, 'title');
  return {
    item: {
      contentId,
      title,
      titleEn: pick(common, 'titleEn') || pick(intro, 'titleEn'),
      eventStartDate: pick(intro, 'eventstartdate', 'eventStartDate') || pick(common, 'eventstartdate', 'eventStartDate'),
      eventEndDate: pick(intro, 'eventenddate', 'eventEndDate') || pick(common, 'eventenddate', 'eventEndDate'),
      addr1: pick(common, 'addr1') || pick(intro, 'addr1'),
      mapx: pick(common, 'mapx') || pick(intro, 'mapx'),
      mapy: pick(common, 'mapy') || pick(intro, 'mapy'),
    },
    intro: {
      eventplace: pick(intro, 'eventplace'),
      playtime: pick(intro, 'playtime'),
      program: pick(intro, 'program'),
      overview: pick(common, 'overview') || pick(intro, 'overview'),
    },
    summaryFields: {
      timeText: pick(intro, 'playtime'),
      fee: { text: pick(intro, 'usetimefestival') },
    },
    overview: pick(common, 'overview') || pick(intro, 'overview'),
    program: pick(intro, 'program'),
    homepage: pick(intro, 'eventhomepage', 'homepage') || pick(common, 'homepage'),
    nearbyPlaces: nearbyNames(nearbyItems, title),
    meta: {
      capturedAt: new Date().toISOString(),
      radiusM: Number(RADIUS_M),
      nearbyRawCount: nearbyItems.length,
    },
  };
}

async function southernFallback() {
  const window = await invoke('festivalWindow', {});
  const items = Array.isArray(window.data?.items) ? window.data.items : [];
  const hit = items.find((item) => /부산|경남|창원|진주|통영|거제|김해|마산/.test(`${item?.title || ''} ${item?.addr1 || ''} ${item?.addr2 || ''}`));
  if (!hit?.contentId) return null;
  return { contentId: String(hit.contentId), label: String(hit.title || 'southern') };
}

async function captureOne(target) {
  const detail = await invoke('festivalDetail', { contentId: target.contentId, contentTypeId: '15' });
  if (detail.httpStatus !== 200 || detail.data?.ok !== true || (!detail.data.intro && !detail.data.common)) {
    return { ok: false, target, message: detail.data?.message || detail.data?.error || `HTTP ${detail.httpStatus}` };
  }
  const common = detail.data.common || {};
  const intro = detail.data.intro || {};
  const nearbyItems = await loadNearby(common.mapx || intro.mapx, common.mapy || intro.mapy);
  const input = toInput(target.contentId, detail.data, nearbyItems);
  if (!input.item.title) return { ok: false, target, message: 'no title' };
  const path = join(outDir, `${target.contentId}.json`);
  writeFileSync(path, `${JSON.stringify(input, null, 2)}\n`);
  return {
    ok: true,
    contentId: target.contentId,
    title: input.item.title,
    nearby: input.nearbyPlaces.length,
    path,
  };
}

mkdirSync(outDir, { recursive: true });
const results = [];
for (const target of TARGETS) {
  let result = await captureOne(target);
  if (!result.ok && target.contentId === '2855626') {
    const fallback = await southernFallback();
    if (fallback && fallback.contentId !== target.contentId) {
      result = await captureOne(fallback);
      result.fallbackFrom = target.contentId;
    }
  }
  results.push(result);
  if (result.ok) console.log(`${result.contentId} ${result.title} nearby=${result.nearby}`);
  else console.log(`FAIL ${target.contentId} ${result.message || ''}`);
}

const failed = results.filter((row) => !row.ok);
if (failed.length) process.exitCode = 1;
