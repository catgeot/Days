/**
 * 테마여행 여행코스 모듈 스모크 — 라우트 SSOT + (옵션) TourAPI LIVE.
 *
 *   npm run smoke:korea-theme-courses
 *   TOURAPI_SMOKE_LIVE=1 npm run smoke:korea-theme-courses
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  buildCourseAreaChips,
  COURSE_CHIP_STANDALONE_MIN,
  COURSE_OTHER_CHIP_ID,
} from '../src/pages/Home/lib/koreaThemeCourseChips.js';

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

function mainOffline() {
  const chips = buildCourseAreaChips([
    { areaCode: '1', name: '서울', count: 0 },
    { areaCode: '31', name: '경기', count: 12 },
    { areaCode: '32', name: '강원', count: 10 },
    { areaCode: '33', name: '충북', count: 2 },
    { areaCode: '4', name: '대구', count: 1 },
    { areaCode: '39', name: '제주', count: 0 },
  ]);
  assert(COURSE_CHIP_STANDALONE_MIN === 3, 'standalone min is 3');
  assert(
    chips.every((c) => c.id !== '1' && c.id !== '39'),
    'zero-count areas omitted from chips',
  );
  assert(
    chips.some((c) => c.id === '31') && chips.some((c) => c.id === '32'),
    'standalone areas keep own chips',
  );
  const other = chips.find((c) => c.id === COURSE_OTHER_CHIP_ID);
  assert(Boolean(other), 'sparse areas merge into 기타 chip');
  assert(
    other?.count === 3 &&
      other.areaCodes.includes('33') &&
      other.areaCodes.includes('4'),
    '기타 chip aggregates sparse counts',
  );
  assert(other?.label === '기타', '기타 chip label');

  const modules = JSON.parse(
    readFileSync(join(root, 'src/pages/Home/data/koreaThemeModules.json'), 'utf8'),
  );
  const courses = (modules.modules || []).find((m) => m.id === 'courses');
  assert(Boolean(courses), 'modules include courses');
  assert(courses?.path === '/korea/theme/courses', 'courses path');
  assert(courses?.enabled === true, 'courses enabled');
  assert(courses?.icon === 'route', 'courses icon route');

  const appSrc = readFileSync(join(root, 'src/App.jsx'), 'utf8');
  assert(appSrc.includes('/korea/theme/courses'), 'App route courses');
  assert(appSrc.includes('KoreaThemeCoursesPage'), 'App imports CoursesPage');

  const returnTo = readFileSync(
    join(root, 'src/pages/Home/lib/placeReturnTo.js'),
    'utf8',
  );
  assert(returnTo.includes("'/korea/theme/courses'"), 'placeReturnTo allows courses');

  const fetchSrc = readFileSync(join(root, 'src/utils/fetchTourApiCourses.js'), 'utf8');
  assert(fetchSrc.includes("contentTypeId: COURSE_CONTENT_TYPE_ID"), 'fetch uses type 25');
  assert(fetchSrc.includes("'25'"), 'COURSE_CONTENT_TYPE_ID 25');
  assert(fetchSrc.includes("detailImage"), 'course detail fetches detailImage');
  assert(fetchSrc.includes('subdetailimg'), 'course detail keeps segment images');
  assert(fetchSrc.includes('galleryUrls'), 'course detail exposes galleryUrls');

  const pageSrc = readFileSync(join(root, 'src/pages/KoreaTheme/CoursesPage.jsx'), 'utf8');
  assert(pageSrc.includes('galleryUrls'), 'CoursesPage renders gallery');
  assert(pageSrc.includes('subdetailimg'), 'CoursesPage renders segment photos');
  assert(pageSrc.includes('aspect-[16/9]'), 'CoursesPage magazine full-width photo');
  assert(!pageSrc.includes('h-[4.5rem] w-[6.5rem]'), 'CoursesPage no side thumbnail');
  assert(pageSrc.includes('role="dialog"'), 'CoursesPage detail modal dialog');
  assert(pageSrc.includes('CourseDetailModal'), 'CoursesPage CourseDetailModal');
  assert(!pageSrc.includes('ChevronDown'), 'CoursesPage no accordion chevron');
  assert(pageSrc.includes('scrollToTop'), 'CoursesPage modal scroll-to-top');
  assert(pageSrc.includes('위로'), 'CoursesPage modal top button label');
  assert(pageSrc.includes('닫기'), 'CoursesPage modal close label');
  assert(pageSrc.includes('safe-area-inset'), 'CoursesPage modal edge padding');
  assert(pageSrc.includes('buildCourseAreaChips'), 'CoursesPage builds chips from counts');
  assert(pageSrc.includes('COURSE_OTHER_CHIP_ID'), 'CoursesPage uses 기타 chip id');
  assert(
    fetchSrc.includes('fetchTourApiTravelCourseAreaCounts'),
    'fetch exposes area count probe',
  );
}

async function mainLive() {
  const url = (process.env.VITE_SUPABASE_URL || '').trim();
  const anon = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) {
    assert(false, 'LIVE needs VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
    return;
  }
  const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'areaBasedList',
      areaCode: '32',
      contentTypeId: '25',
      numOfRows: 5,
      pageNo: 1,
    }),
  });
  assert(res.status === 200, `LIVE HTTP ${res.status}`);
  const data = await res.json();
  assert(data?.ok === true, `LIVE ok (${data?.message || data?.error || '-'})`);
  assert((data?.items?.length || 0) >= 1, `LIVE gangwon courses ≥1 (raw=${data?.rawCount})`);
  const hit = data.items[0];
  assert(Boolean(hit?.contentId), `LIVE contentId (${hit?.title || '-'})`);
  assert(String(hit?.contentTypeId) === '25', 'LIVE contentTypeId 25');
  assert(
    Boolean(hit?.imageUrl || hit?.firstimage),
    `LIVE list image (${hit?.title || '-'})`,
  );

  const infoRes = await fetch(`${url.replace(/\/$/, '')}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'detailInfo',
      contentId: hit.contentId,
      contentTypeId: '25',
      numOfRows: 30,
      pageNo: 1,
    }),
  });
  assert(infoRes.status === 200, `LIVE detailInfo HTTP ${infoRes.status}`);
  const info = await infoRes.json();
  assert(info?.ok === true, 'LIVE detailInfo ok');
  const withImg = (info?.items || []).filter((it) => it?.subdetailimg);
  assert(withImg.length >= 1, `LIVE segment photos ≥1 (got ${withImg.length})`);
}

mainOffline();
if (process.env.TOURAPI_SMOKE_LIVE === '1') {
  await mainLive();
} else {
  console.log('(LIVE skipped — set TOURAPI_SMOKE_LIVE=1)');
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-theme-courses SMOKE OK');
