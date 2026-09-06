/**
 * 제휴 여행사 목록·방문 기록 SSOT 스모크.
 *   npm run smoke:travel-agencies
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** @type {Map<string, string>} */
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
};

const { TRAVEL_AGENCIES, getTravelAgencyById } = await import('../src/data/travelAgencies.js');
const {
  TRAVEL_AGENCY_VISITS_KEY,
  MAX_TRAVEL_AGENCY_VISITS,
  matchTravelAgencyFromUrl,
  inferTravelAgencyKind,
  inferPlaceLabelFromHref,
  loadTravelAgencyVisits,
  recordTravelAgencyVisit,
  recordTravelAgencyEmbedVisit,
  describeTravelAgencyEmbed,
  isTravelAgencyWidgetHref,
  removeTravelAgencyVisit,
  clearTravelAgencyVisits,
  sanitizeTravelAgencyHref,
} = await import('../src/utils/travelAgencyVisits.js');

assert.equal(TRAVEL_AGENCY_VISITS_KEY, 'gateo:travel-agencies:v1:visits');
assert.ok(MAX_TRAVEL_AGENCY_VISITS >= 8);
assert.ok(TRAVEL_AGENCIES.length >= 8);
assert.ok(getTravelAgencyById('mrt'));
assert.ok(getTravelAgencyById('klook'));
assert.ok(getTravelAgencyById('tripcom'));

assert.equal(matchTravelAgencyFromUrl('https://www.myrealtrip.com/accommodations?q=파리')?.id, 'mrt');
assert.equal(matchTravelAgencyFromUrl('https://experiences.myrealtrip.com/products/1')?.id, 'mrt');
assert.equal(matchTravelAgencyFromUrl('https://affiliate.klook.com/redirect?aid=1')?.id, 'klook');
assert.equal(matchTravelAgencyFromUrl('https://www.klook.com/ko/car-rentals/')?.id, 'klook');
assert.equal(matchTravelAgencyFromUrl('https://kr.trip.com/flights/')?.id, 'tripcom');
assert.equal(matchTravelAgencyFromUrl('https://www.getyourguide.com/')?.id, 'getyourguide');
assert.equal(matchTravelAgencyFromUrl('https://www.getyourguide.com/ko-kr/?partner_id=LRKVVU4')?.id, 'getyourguide');
assert.equal(matchTravelAgencyFromUrl('https://www.getyourguide.com/s/?q=Paris')?.id, 'getyourguide');
assert.equal(matchTravelAgencyFromUrl('https://widget.getyourguide.com/default/activities.frame')?.id, 'getyourguide');
assert.equal(matchTravelAgencyFromUrl('https://www.gateo.kr/') , null);
assert.equal(matchTravelAgencyFromUrl('javascript:alert(1)'), null);

assert.equal(inferTravelAgencyKind('https://www.myrealtrip.com/accommodations?q=파리'), 'stay');
assert.equal(inferTravelAgencyKind('https://www.myrealtrip.com/pkc'), 'package');
assert.equal(inferTravelAgencyKind('https://kr.trip.com/flights/'), 'flight');
assert.equal(inferTravelAgencyKind('https://www.getyourguide.com/ko-kr/'), 'tour');
assert.equal(inferTravelAgencyKind('https://widget.getyourguide.com/default/activities.frame'), 'tour');
assert.equal(inferPlaceLabelFromHref('https://www.myrealtrip.com/search?q=%ED%8C%8C%EB%A6%AC%20%EC%88%99%EC%86%8C'), '파리 숙소');

assert.deepEqual(loadTravelAgencyVisits(), []);

let list = recordTravelAgencyVisit({
  href: 'https://www.myrealtrip.com/accommodations?q=%ED%8C%8C%EB%A6%AC',
});
assert.equal(list.length, 1);
assert.equal(list[0].agencyId, 'mrt');
assert.equal(list[0].kind, 'stay');
assert.equal(list[0].placeLabel, '파리');

list = recordTravelAgencyVisit({
  href: 'https://www.klook.com/ko/',
});
assert.equal(list[0].agencyId, 'klook');
assert.equal(list[1].agencyId, 'mrt');

list = recordTravelAgencyVisit({
  href: 'https://www.myrealtrip.com/pkc',
});
assert.equal(list[0].agencyId, 'mrt');
assert.equal(list[0].kind, 'package');
assert.equal(list.filter((item) => item.agencyId === 'mrt').length, 1, '같은 여행사는 한 줄');

assert.equal(
  sanitizeTravelAgencyHref('https://evil.example/phish', 'mrt'),
  '',
);
assert.ok(sanitizeTravelAgencyHref(list[0].href, 'mrt').includes('myrealtrip.com'));

list = removeTravelAgencyVisit('klook');
assert.ok(!list.some((item) => item.agencyId === 'klook'));
assert.deepEqual(clearTravelAgencyVisits(), []);

const ignored = recordTravelAgencyVisit({ href: 'https://www.google.com/search?q=mrt' });
assert.equal(ignored.length, 0, '비제휴 도메인은 기록하지 않음');

assert.equal(
  isTravelAgencyWidgetHref('https://widget.getyourguide.com/default/activities.frame'),
  true,
);
assert.equal(isTravelAgencyWidgetHref('https://www.getyourguide.com/ko-kr/'), false);

const embed = describeTravelAgencyEmbed({
  src: 'about:blank',
  embedHref: 'https://widget.getyourguide.com/default/activities.frame',
  query: 'Paris',
});
assert.equal(embed?.agency.id, 'getyourguide');
assert.equal(embed?.isWidget, true);
assert.equal(embed?.query, 'Paris');

list = recordTravelAgencyEmbedVisit({
  src: 'https://widget.getyourguide.com/default/activities.frame',
  embedHref: 'https://widget.getyourguide.com/default/activities.frame',
  query: 'Paris',
});
assert.equal(list[0].agencyId, 'getyourguide');
assert.equal(list[0].kind, 'tour');
assert.equal(list[0].placeLabel, 'Paris');
assert.match(list[0].href, /getyourguide\.com\/s\//);
assert.doesNotMatch(list[0].href, /widget\.getyourguide/, '위젯 frame URL을 재방문 주소로 저장하지 않음');

list = recordTravelAgencyEmbedVisit({
  src: '',
  embedHref: 'https://widget.getyourguide.com/default/city.frame',
});
assert.equal(list[0].agencyId, 'getyourguide');
assert.match(list[0].href, /getyourguide\.com/);
assert.doesNotMatch(list[0].href, /widget\.getyourguide/);

const capture = readFileSync(join(root, 'src/components/travelAgencies/TravelAgencyVisitCapture.jsx'), 'utf8');
assert.match(capture, /recordTravelAgencyEmbedVisit/, 'iframe 위젯 방문 기록');
assert.match(capture, /HTMLIFrameElement/, 'iframe 포커스 포착');

const gygWidget = readFileSync(
  join(root, 'src/components/PlaceCard/tabs/planner/components/GetYourGuideActivitiesWidget.jsx'),
  'utf8',
);
assert.match(gygWidget, /recordTravelAgencyVisit/, 'GYG 더보기·라벨 클릭 기록');

const panel = readFileSync(join(root, 'src/pages/Home/components/LogoPanel.jsx'), 'utf8');
assert.match(panel, /TravelAgencyDirectory/, '로고패널에 여행사 목록');
assert.match(panel, /variant="panel"/, '로고패널 panel variant');

const directory = readFileSync(join(root, 'src/components/travelAgencies/TravelAgencyDirectory.jsx'), 'utf8');
assert.match(directory, /variant === 'panel'/, '로고패널 접힘 variant');
assert.match(
  directory,
  /<details className="rounded-xl border border-white\/10/,
  '로고패널 방문한 여행사 details',
);
assert.doesNotMatch(
  directory,
  /<details[^>]*\bopen\b/,
  '여행사 목록 기본 펼침 금지',
);

const explore = readFileSync(join(root, 'src/pages/Home/components/SearchDiscoveryModal.jsx'), 'utf8');
assert.match(explore, /activeQuickSection === 'agencies'/, '탐색 여행사 칩');
assert.match(explore, /TravelAgencyDirectory variant="explore"/, '탐색 popover 목록');
assert.match(explore, /home\.agencies\.title/, '탐색 칩 명칭 home.agencies.title');

const planner = readFileSync(join(root, 'src/components/PlaceCard/tabs/PlannerTab.jsx'), 'utf8');
assert.match(planner, /TravelAgencyDirectory variant="planner"/, '플래너 목록');

const nav = readFileSync(join(root, 'src/components/PlaceCard/common/partnerNavigation.js'), 'utf8');
assert.match(nav, /recordTravelAgencyVisit/, '제휴 새창 열기 시 방문 기록');

const app = readFileSync(join(root, 'src/App.jsx'), 'utf8');
assert.match(app, /TravelAgencyVisitCapture/, 'a\\[href\\] 캡처 마운트');

const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercel, /\/qa\/agencies/, 'vercel.json /qa/agencies');
assert.match(
  vercel,
  /days-git-cursor-agencies-85ab-catgeots-projects\.vercel\.app/,
  'qa/agencies git Preview',
);

const qa = readFileSync(join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'), 'utf8');
assert.match(qa, /slug: 'agencies'/, 'qa share slug');
assert.match(qa, /branch:\s*'cursor\/agencies-85ab'/, 'qa share branch');

const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));
for (const key of ['title', 'visitedTitle', 'catalogTitle', 'hint', 'clearVisits']) {
  assert.equal(typeof ko.home.agencies[key], 'string', `ko home.agencies.${key}`);
  assert.equal(typeof en.home.agencies[key], 'string', `en home.agencies.${key}`);
  assert.ok(ko.home.agencies[key].length > 0);
  assert.ok(en.home.agencies[key].length > 0);
}
assert.equal(typeof ko.home.explore.agenciesVisitedCount, 'string');
assert.equal(typeof en.home.explore.agenciesVisitedCount, 'string');
assert.equal(ko.home.agencies.title, '방문한 여행사');
assert.equal(en.home.agencies.title, 'Visited agencies');
assert.match(ko.home.explore.agenciesVisitedCount, /방문한 여행사/);
assert.ok(ko.home.agencies.kind.stay);
assert.ok(en.home.agencies.kind.stay);

console.log('smoke:travel-agencies PASS');
