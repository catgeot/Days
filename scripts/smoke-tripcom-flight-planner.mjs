/**
 * 플래너 Trip.com 항공권 검색 — 기존 iframe·모바일 모달 복구.
 *   npm run smoke:tripcom-flight-planner
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const affiliate = read('src/utils/affiliate.js');
assert.doesNotMatch(affiliate, /iframeEmbedUsable/, 'iframe flag not used');
assert.match(affiliate, /adId:\s*'S17104971'/, 'desktop ad id kept');
assert.match(affiliate, /mobileAdId:\s*'S17158794'/, 'mobile ad id kept');
assert.match(
  affiliate,
  /export function buildTripcomPlannerFlightUrl/,
  'flight URL builder',
);

const nav = read('src/components/PlaceCard/common/partnerNavigation.js');
assert.match(
  nav,
  /export function shouldUseTripcomFlightSearchModal/,
  'mobile search modal helper',
);

const whiteLabel = read('src/components/PlaceCard/common/WhiteLabelWidget.jsx');
assert.match(whiteLabel, /openTripcomExternalUrl/, 'external fallback');
assert.match(whiteLabel, /type="button"/, 'default trigger is button');

const widget = read(
  'src/components/PlaceCard/tabs/planner/components/TripcomFlightBannerWidget.jsx',
);
assert.match(widget, /data-tripcom-flight-banner="1"/, 'iframe banner marker');
assert.match(widget, /<iframe/, 'partners/ad iframe for desktop');
assert.match(widget, /TripcomFlightNativeSearch/, 'mobile uses TripcomFlightNativeSearch');

const planner = read('src/components/PlaceCard/tabs/PlannerTab.jsx');
assert.doesNotMatch(
  planner,
  /omitFlightSearchCta/,
  '항공권 카드 검색 배너 생략 금지',
);
assert.match(planner, /<TripcomFlightBannerWidget/, '플래너 상단 항공 검색 위젯 유지');
assert.doesNotMatch(planner, /flightBooking=\{/, '항공 위젯을 2열 체크리스트에 넣지 않음');
assert.doesNotMatch(planner, /PlannerStageNav/, '3단계 탭 분리 이전 단일 스크롤');

const toolkit = read(
  'src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx',
);
assert.match(toolkit, /<FlightSearchCta /, 'toolkit FlightSearchCta');

const vercel = read('vercel.json');
assert.match(vercel, /\/qa\/flight"/, 'vercel.json /qa/flight');
assert.match(vercel, /\/qa\/tripcom-flight/, 'vercel.json /qa/tripcom-flight alias');
assert.match(
  vercel,
  /days-git-cursor-tripcom-flight-widget-3ec3-catgeots-projects\.vercel\.app\/place\/paris\/planner/,
  'qa/flight git Preview',
);

const qa = read('src/shared/cloudPreview/cloudQaShareLinks.js');
assert.match(qa, /slug: 'flight'/, 'qa share slug /qa/flight');
assert.match(qa, /slug: 'tripcom-flight'/, 'old slug kept as alias');
assert.match(qa, /branch:\s*'cursor\/tripcom-flight-widget-3ec3'/, 'qa share branch');

console.log('OK: tripcom-flight-planner — iframe banner · mobile modal · toolkit CTA');
console.log('SMOKE OK');
