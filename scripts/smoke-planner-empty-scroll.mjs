/**
 * 플래너 실행 전 빈 페이지 하단 여유·연결된 여행사 펼침 스크롤.
 *   npm run smoke:planner-empty-scroll
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const planner = read('src/components/PlaceCard/tabs/PlannerTab.jsx');
assert.match(
  planner,
  /const plannerBodyScrollClass = `flex-1 min-h-0 w-full flex flex-col overflow-y-auto/,
  '플래너 본문 세로 스크롤 클래스',
);
assert.match(planner, /mobilePlaceFooterScrollPadding/, '플래너 하단 여유');
const emptyIdx = planner.indexOf('if (!guideData && !isLoading)');
assert.ok(emptyIdx >= 0, '실행 전 빈 플래너 분기');
const emptySlice = planner.slice(emptyIdx, planner.indexOf('TripcomFlightSearchProvider', emptyIdx));
assert.match(emptySlice, /className=\{plannerBodyScrollClass\}/, '빈 플래너가 본문 스크롤 클래스 사용');
assert.match(emptySlice, /mobilePlaceHeaderSpacerClass/, '빈 플래너 헤더 spacer');
assert.match(emptySlice, /data-planner-scroll-root/, '빈 플래너 스크롤 루트');
assert.doesNotMatch(
  emptySlice,
  /flex-col items-center justify-center/,
  '빈 플래너 세로 중앙 고정 금지',
);
assert.match(emptySlice, /TravelAgencyDirectory variant="planner"/, '빈 플래너 여행사 목록');

assert.match(planner, /plannerBodyScrollClass/, '실행 전·후 스크롤 클래스 공유');
assert.match(
  planner,
  /data-planner-scroll-root=""/,
  '툴킷 있는 플래너에도 스크롤 루트',
);

const directory = read('src/components/travelAgencies/TravelAgencyDirectory.jsx');
assert.match(directory, /PLANNER_FOCUS_ID\.CONNECTED_AGENCIES/, '연결된 여행사 id');
assert.match(directory, /onToggle=\{handlePlannerConnectedAgenciesToggle\}/, '펼침 시 상단 스크롤');
assert.doesNotMatch(directory, /<details[^>]*\bopen\b/, '연결된 여행사 기본 접힘');

const focus = read('src/utils/placePlannerFocus.js');
assert.match(focus, /CONNECTED_AGENCIES:\s*'planner-connected-agencies'/, 'focus id SSOT');
assert.match(focus, /handlePlannerConnectedAgenciesToggle/, '펼침 핸들러');
assert.match(focus, /headerOffset:\s*16/, '펼침 스크롤 오프셋');

const vercel = read('vercel.json');
assert.match(vercel, /\/qa\/planner-empty/, 'vercel.json /qa/planner-empty');
assert.match(
  vercel,
  /days-git-cursor-planner-empty-pad-6089-catgeots-projects\.vercel\.app\/place\/yanggu-arboretum\/planner/,
  'qa/planner-empty git Preview',
);

const qa = read('src/shared/cloudPreview/cloudQaShareLinks.js');
assert.match(qa, /slug: 'planner-empty'/, 'qa share slug');
assert.match(qa, /branch:\s*'cursor\/planner-empty-pad-6089'/, 'qa share branch');

console.log('smoke:planner-empty-scroll PASS');
