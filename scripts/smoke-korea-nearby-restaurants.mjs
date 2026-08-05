#!/usr/bin/env node
/**
 * 테마여행 #28 — 맛집(type39) 주변 API 스모크.
 *
 *   npm run smoke:korea-nearby-restaurants
 *
 * 정적 검사 + (Secrets 있을 때) locationBasedList LIVE.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

const proxySrc = readFileSync(
  join(root, 'supabase/functions/tourapi-proxy/index.ts'),
  'utf8',
);
assert(
  proxySrc.includes('locationBasedList'),
  'tourapi-proxy exposes locationBasedList',
);
assert(
  proxySrc.includes('locationBasedList2'),
  'tourapi-proxy maps to locationBasedList2',
);
assert(
  proxySrc.includes('LOCATION_CACHE_TTL_MS'),
  'locationBasedList has memory TTL cache',
);
assert(
  proxySrc.includes('firstmenu') && proxySrc.includes('opentimefood'),
  'normalizeItem keeps food intro fields',
);

const fetchSrc = readFileSync(
  join(root, 'src/utils/fetchNearbyTourRestaurants.js'),
  'utf8',
);
assert(
  fetchSrc.includes("action: 'locationBasedList'"),
  'fetchNearbyTourRestaurants calls locationBasedList',
);
assert(
  fetchSrc.includes("RESTAURANT_CONTENT_TYPE_ID = '39'"),
  'fetchNearbyTourRestaurants uses type39',
);
assert(
  !fetchSrc.includes("from('tourapi_"),
  'restaurants are not loaded from Supabase tables',
);

const sheetSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
assert(
  sheetSrc.includes('fetchNearbyTourRestaurants'),
  'FestivalDetailSheet imports fetchNearbyTourRestaurants',
);
assert(sheetSrc.includes('주변 맛집'), 'FestivalDetailSheet shows 주변 맛집');
assert(
  !sheetSrc.includes('KoreaFestivalMap'),
  'FestivalDetailSheet does not touch map component',
);

const modalSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
  'utf8',
);
assert(
  modalSrc.includes('fetchNearbyTourRestaurants'),
  'ThemeSpotDetailModal fetches nearby restaurants',
);
assert(
  modalSrc.includes('RESTAURANT_CONTENT_TYPE_ID'),
  'ThemeSpotDetailModal skips food recursion for type39',
);
assert(modalSrc.includes('opentimefood'), 'ThemeSpotDetailModal shows food intro');

const detailSrc = readFileSync(
  join(root, 'src/utils/fetchTourApiAttractionDetail.js'),
  'utf8',
);
assert(
  detailSrc.includes("'39'"),
  'attraction detail tries contentTypeId 39',
);

const url = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const anon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (url && anon) {
  const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anon}`,
      apikey: anon,
    },
    body: JSON.stringify({
      action: 'locationBasedList',
      mapX: 128.4617,
      mapY: 37.1836,
      radius: 3000,
      contentTypeId: '39',
      numOfRows: 5,
      pageNo: 1,
      arrange: 'E',
    }),
  });
  const data = await res.json().catch(() => null);
  const errMsg = String(data?.error || data?.message || '');
  if (!data?.ok && /must be one of/i.test(errMsg) && !/locationBasedList/.test(errMsg)) {
    console.log(
      'SKIP  LIVE locationBasedList (Edge not deployed yet — deploy tourapi-proxy)',
    );
  } else if (!data?.ok) {
    if (/not configured|TOUR_API/i.test(errMsg)) {
      console.log(`SKIP  LIVE (${errMsg})`);
    } else {
      assert(false, `LIVE locationBasedList (${errMsg || `HTTP ${res.status}`})`);
    }
  } else {
    assert(Array.isArray(data.items), 'LIVE locationBasedList items[]');
    assert(
      data.items.every(
        (it) => !it.contentTypeId || String(it.contentTypeId) === '39',
      ),
      'LIVE items are type39 (or unset)',
    );
    console.log(`OK    LIVE nearby food count=${data.items.length} raw=${data.rawCount}`);
  }
} else {
  console.log('SKIP  LIVE (no supabase secrets)');
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke:korea-nearby-restaurants PASS');
