/**
 * 플래너 Trip.com 항공권 검색 — PC iframe · 모바일 네이티브 폼.
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
assert.doesNotMatch(nav, /iframeEmbedUsable/, 'modal not gated off');
const navFn = nav.slice(
  nav.indexOf('export function buildTripcomPlannerNavigationUrl'),
  nav.indexOf('export function getTripcomFlightAdForModal'),
);
assert.doesNotMatch(navFn, /mode:\s*'ad'/, 'mobile nav does not open blank partners/ad page');
assert.match(navFn, /mode:\s*'flights'/, 'nav uses /flights/');
assert.match(nav, /isPlannerMobileViewport/, 'viewport mobile opens in-app search');

const whiteLabel = read('src/components/PlaceCard/common/WhiteLabelWidget.jsx');
assert.match(whiteLabel, /tryOpenFlightSearch/, 'mobile opens in-app modal');
assert.match(whiteLabel, /openTripcomExternalUrl/, 'desktop/external fallback');
assert.match(whiteLabel, /type="button"/, 'default trigger is button');

const widget = read(
  'src/components/PlaceCard/tabs/planner/components/TripcomFlightBannerWidget.jsx',
);
assert.match(widget, /data-tripcom-flight-banner="1"/, 'iframe banner marker');
assert.match(widget, /<iframe/, 'PC partners/ad iframe kept');
assert.match(widget, /TripcomFlightNativeSearch/, 'mobile native search form');
assert.doesNotMatch(widget, /iframeEmbedUsable/, 'no CTA-only iframe kill switch');
assert.match(widget, /shouldUseTripcomFlightSearchModal/, 'fullscreen uses modal');

const native = read(
  'src/components/PlaceCard/tabs/planner/components/TripcomFlightNativeSearch.jsx',
);
assert.match(native, /data-tripcom-native-search="1"/, 'native form marker');
assert.match(native, /mode: 'flights'/, 'native form opens /flights/');
assert.match(native, /openTripcomExternalUrl/, 'native form uses noreferrer nav');

const modal = read('src/components/PlaceCard/modals/TripcomFlightSearchModal.jsx');
assert.match(modal, /useNativeForm/, 'modal native form path');
assert.match(modal, /TripcomFlightNativeSearch/, 'modal renders native form');

const planner = read('src/components/PlaceCard/tabs/PlannerTab.jsx');
assert.doesNotMatch(
  planner,
  /omitFlightSearchCta/,
  '항공권 카드 검색 배너 생략 금지',
);
assert.match(planner, /<TripcomFlightBannerWidget/, '필수 툴킷 항공 검색 유지');
assert.doesNotMatch(planner, /flightBooking=\{/, '항공 위젯을 2열 체크리스트에 넣지 않음');
assert.match(
  planner,
  /id="planner-prep-flight-booking"[\s\S]*<TripcomFlightBannerWidget/,
  '항공 위젯이 필수 단계 전체 폭',
);
assert.match(
  planner,
  /<TravelAgencyDirectory variant="planner" className="mb-5 shrink-0" \/>\s*<PlannerStageNav/,
  '방문 여행사가 단계 네비 위',
);
assert.match(planner, /<AiraloBannerWidget compact/, 'Airalo compact');
assert.match(planner, /<HolaflyBannerWidget compact/, 'Holafly compact');
assert.doesNotMatch(planner, /esimProvider/, '유심 1종 탭 제거');

const toolkit = read(
  'src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx',
);
assert.match(toolkit, /omitFlightSearchCta = false/, 'toolkit CTA default on');
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

console.log('OK: tripcom-flight-planner — PC iframe · mobile native form · toolkit CTA');
console.log('SMOKE OK');
