#!/usr/bin/env node
/**
 * 테마여행 #30 — 레포츠(28)·문화(14) 주변 API 스모크.
 *
 *   npm run smoke:korea-nearby-leisure-culture
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

const fetchSrc = readFileSync(
  join(root, 'src/utils/fetchNearbyTourLeisureCulture.js'),
  'utf8',
);
assert(
  fetchSrc.includes("action: 'locationBasedList'"),
  'fetchNearbyTourLeisureCulture calls locationBasedList',
);
assert(
  fetchSrc.includes('fetchNearbyTourAreaBasedFallback'),
  'leports/culture fall back to areaBasedList on locationBased failure',
);
assert(
  fetchSrc.includes("LEPORTS_CONTENT_TYPE_ID = '28'"),
  'leports uses type28',
);
assert(
  fetchSrc.includes("CULTURE_CONTENT_TYPE_ID = '14'"),
  'culture uses type14',
);
assert(
  !fetchSrc.includes("from('tourapi_"),
  'leports/culture are not loaded from Supabase tables',
);

const proxySrc = readFileSync(
  join(root, 'supabase/functions/tourapi-proxy/index.ts'),
  'utf8',
);
assert(
  proxySrc.includes('usetimeculture') && proxySrc.includes('usetimeleports'),
  'proxy keeps culture/leports intro fields',
);
assert(
  proxySrc.includes('infocenterculture') &&
    proxySrc.includes('infocenterleports'),
  'proxy keeps culture/leports info center fields',
);

const sheetSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
assert(
  sheetSrc.includes('fetchNearbyTourLeports'),
  'FestivalDetailSheet fetches nearby leports',
);
assert(
  sheetSrc.includes('fetchNearbyTourCulture'),
  'FestivalDetailSheet fetches nearby culture',
);
assert(sheetSrc.includes('주변 레포츠'), 'FestivalDetailSheet shows 주변 레포츠');
assert(sheetSrc.includes('주변 문화'), 'FestivalDetailSheet shows 주변 문화');
assert(
  !sheetSrc.includes('KoreaFestivalMap'),
  'FestivalDetailSheet does not touch map component',
);

const modalSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
  'utf8',
);
assert(
  modalSrc.includes('fetchNearbyTourLeports'),
  'ThemeSpotDetailModal fetches nearby leports',
);
assert(
  modalSrc.includes('fetchNearbyTourCulture'),
  'ThemeSpotDetailModal fetches nearby culture',
);
assert(
  modalSrc.includes('isApiPoiCross') && modalSrc.includes('hideNearbyHubs'),
  'leports/culture modal hides hub 인근 여행지',
);
assert(
  modalSrc.includes('usetimeculture') || modalSrc.includes('usetimeleports'),
  'ThemeSpotDetailModal shows culture/leports intro',
);

const url = String(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
).trim();
const anon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();

async function liveCheck(contentTypeId, label) {
  if (!url || !anon) return;
  const res = await fetch(
    `${url.replace(/\/$/, '')}/functions/v1/tourapi-proxy`,
    {
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
        radius: 5000,
        contentTypeId,
        numOfRows: 5,
        pageNo: 1,
        arrange: 'E',
      }),
    },
  );
  const data = await res.json().catch(() => null);
  const errMsg = String(data?.error || data?.message || '');
  if (
    !data?.ok &&
    /must be one of/i.test(errMsg) &&
    !/locationBasedList/.test(errMsg)
  ) {
    console.log(
      `SKIP  LIVE ${label} (Edge not deployed yet — deploy tourapi-proxy)`,
    );
    return;
  }
  if (!data?.ok) {
    if (/not configured|TOUR_API/i.test(errMsg)) {
      console.log(`SKIP  LIVE ${label} (${errMsg})`);
      return;
    }
    if (/429|LIMITED_NUMBER_OF_SERVICE_REQUESTS|일일 서비스 요청제한/i.test(errMsg)) {
      const fb = await fetch(
        `${url.replace(/\/$/, '')}/functions/v1/tourapi-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anon}`,
            apikey: anon,
          },
          body: JSON.stringify({
            action: 'areaBasedList',
            areaCode: '31',
            sigunguCode: '1',
            contentTypeId,
            numOfRows: 5,
            pageNo: 1,
            listYN: 'Y',
            arrange: 'A',
          }),
        },
      );
      const fbData = await fb.json().catch(() => null);
      assert(
        fbData?.ok === true && Array.isArray(fbData.items),
        `LIVE areaBasedList ${label} fallback after locationBased 429`,
      );
      console.log(
        `OK    LIVE locationBased 429 → areaBased ${label} fallback count=${fbData.items.length}`,
      );
      return;
    }
    assert(false, `LIVE ${label} locationBasedList (${errMsg || `HTTP ${res.status}`})`);
    return;
  }
  assert(Array.isArray(data.items), `LIVE ${label} items[]`);
  assert(
    data.items.every(
      (it) => !it.contentTypeId || String(it.contentTypeId) === contentTypeId,
    ),
    `LIVE ${label} items are type${contentTypeId} (or unset)`,
  );
  console.log(
    `OK    LIVE nearby ${label} count=${data.items.length} raw=${data.rawCount}`,
  );
}

if (url && anon) {
  await liveCheck('28', 'leports');
  await liveCheck('14', 'culture');
} else {
  console.log('SKIP  LIVE (no supabase secrets)');
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke:korea-nearby-leisure-culture PASS');
