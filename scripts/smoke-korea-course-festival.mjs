#!/usr/bin/env node
/**
 * 테마여행 #31 — 코스↔축제 양방향 연결 스모크.
 *
 *   npm run smoke:korea-course-festival
 *
 * 정적 검사 + (Secrets 있을 때) areaBasedList type25 LIVE · festival pick 단위.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { pickNearbyFestivals } from '../src/pages/Home/lib/nearbyFestivalsPick.js';

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

const nearbyCoursesSrc = readFileSync(
  join(root, 'src/utils/fetchNearbyTourCourses.js'),
  'utf8',
);
assert(
  nearbyCoursesSrc.includes("COURSE_CONTENT_TYPE_ID = '25'"),
  'COURSE_CONTENT_TYPE_ID is 25',
);
assert(
  nearbyCoursesSrc.includes('fetchTourApiTravelCourses'),
  'nearby courses uses areaBasedList helper',
);
assert(
  !nearbyCoursesSrc.includes("action: 'locationBasedList'"),
  'nearby courses does not rely on locationBasedList (type25 sparse)',
);
assert(
  !nearbyCoursesSrc.includes("from('tourapi_"),
  'courses are not loaded from Supabase tables',
);

const nearbyFestSrc = readFileSync(
  join(root, 'src/utils/fetchNearbyFestivals.js'),
  'utf8',
);
assert(
  nearbyFestSrc.includes('fetchKoreaFestivalsRolling12'),
  'nearby festivals reuses festival window cache',
);
assert(
  nearbyFestSrc.includes('pickNearbyFestivals'),
  'nearby festivals uses pickNearbyFestivals',
);
assert(
  readFileSync(join(root, 'src/pages/Home/lib/nearbyFestivalsPick.js'), 'utf8').includes(
    'export function pickNearbyFestivals',
  ),
  'nearbyFestivalsPick exports pickNearbyFestivals',
);

const sheetSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
assert(
  sheetSrc.includes('fetchNearbyTourCourses'),
  'FestivalDetailSheet fetches nearby courses',
);
assert(sheetSrc.includes('인근 여행코스'), 'FestivalDetailSheet shows 인근 여행코스');
assert(
  sheetSrc.includes('CourseDetailModal'),
  'FestivalDetailSheet opens CourseDetailModal',
);
assert(
  sheetSrc.includes('여행코스 더보기'),
  'FestivalDetailSheet links to courses page',
);
assert(
  !sheetSrc.includes('KoreaFestivalMap'),
  'FestivalDetailSheet does not touch map component',
);

const modalSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/CourseDetailModal.jsx'),
  'utf8',
);
assert(modalSrc.includes('인근 축제'), 'CourseDetailModal shows 인근 축제');
assert(
  modalSrc.includes("params.set('festival'"),
  'CourseDetailModal deep-links festival id',
);
assert(
  modalSrc.includes('이 지역 축제 더보기'),
  'CourseDetailModal links to /korea area',
);

const koreaSrc = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
assert(
  koreaSrc.includes("searchParams.get('festival')") ||
    koreaSrc.includes('festivalFromQuery'),
  'Korea hub accepts festival deep-link',
);
assert(
  koreaSrc.includes('festivalQueryAppliedRef'),
  'Korea hub applies festival query once',
);

const picked = pickNearbyFestivals(
  [
    {
      contentId: '100',
      title: '영월단종문화제',
      mapx: 128.4617,
      mapy: 37.1836,
      areaCode: '32',
      addr1: '강원특별자치도 영월군',
      eventStartDate: '20260801',
      eventEndDate: '20260803',
    },
    {
      contentId: '200',
      title: '제주불꽃축제',
      mapx: 126.53,
      mapy: 33.5,
      areaCode: '39',
      addr1: '제주특별자치도',
      eventStartDate: '20260901',
      eventEndDate: '20260901',
    },
    {
      contentId: '300',
      title: '강릉커피축제',
      mapx: 128.876,
      mapy: 37.751,
      areaCode: '32',
      addr1: '강원특별자치도 강릉시',
      eventStartDate: '20261001',
      eventEndDate: '20261005',
    },
  ],
  { lat: 37.1836, lng: 128.4617, areaCode: '32', radiusKm: 50, limit: 6 },
);
assert(picked.length === 2, `pickNearbyFestivals same-area count=2 (got ${picked.length})`);
assert(
  picked.every((f) => f.areaCode === '32'),
  'pickNearbyFestivals filters other sido',
);
assert(
  picked[0].contentId === '100',
  'pickNearbyFestivals sorts nearest first',
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
      action: 'areaBasedList',
      areaCode: '32',
      contentTypeId: '25',
      numOfRows: 10,
      pageNo: 1,
    }),
  });
  const data = await res.json().catch(() => null);
  const errMsg = String(data?.error || data?.message || '');
  if (!data?.ok) {
    if (/not configured|TOUR_API/i.test(errMsg)) {
      console.log(`SKIP  LIVE (${errMsg})`);
    } else {
      assert(false, `LIVE areaBasedList type25 (${errMsg || `HTTP ${res.status}`})`);
    }
  } else {
    assert(Array.isArray(data.items), 'LIVE areaBasedList items[]');
    assert((data.items?.length || 0) >= 1, 'LIVE gangwon courses ≥1');
    assert(
      data.items.every(
        (it) => !it.contentTypeId || String(it.contentTypeId) === '25',
      ),
      'LIVE items are type25 (or unset)',
    );
    console.log(
      `OK    LIVE gangwon courses count=${data.items.length} raw=${data.rawCount}`,
    );
  }
} else {
  console.log('SKIP  LIVE (no supabase secrets)');
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke:korea-course-festival PASS');
