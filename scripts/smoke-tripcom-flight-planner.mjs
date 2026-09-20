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
assert.match(planner, /PlannerStageNav/, '기존 섹션을 3단계로 나눠 봄');
assert.match(planner, /PLANNER_STAGE\.ESSENTIAL/, '1단계 필수');
assert.match(planner, /PLANNER_STAGE\.TRANSFER/, '2단계 이동');
assert.match(planner, /PLANNER_STAGE\.ENJOY/, '3단계 즐기기');
assert.doesNotMatch(planner, /esimProvider/, '유심 Airalo/Holafly 탭 재도입 금지');
assert.match(planner, /<AiraloBannerWidget /, 'Airalo 배너 유지');
assert.match(planner, /<HolaflyBannerWidget /, 'Holafly 배너 유지');
assert.match(planner, /complexity_score/, '복잡도 점수 표기 유지');
assert.doesNotMatch(planner, /complexityBadge/, '복잡도 뱃지 교체 금지');
assert.ok(
  planner.indexOf('<TripcomFlightBannerWidget') < planner.indexOf('<PlannerStageNav'),
  '항공 배너가 단계 탭보다 위(항상 표시)',
);
assert.ok(
  planner.indexOf('id="planner-rental-pickup"') < planner.indexOf('<PlannerStageNav'),
  '픽업 배너가 단계 탭보다 위(항상 표시)',
);

const toolkit = read(
  'src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx',
);
assert.match(toolkit, /<FlightSearchCta[\s>]/, 'toolkit FlightSearchCta');
assert.match(toolkit, /scrollToSearchForm/, 'toolkit CTA scrolls to search form');
assert.match(toolkit, /scrollPlannerFlightSearchForm/, 'toolkit uses flight-search scroll helper');
assert.doesNotMatch(toolkit, /WhiteLabelWidget/, 'toolkit CTA does not open Trip.com directly');

const preTravel = read(
  'src/components/PlaceCard/tabs/planner/components/PreTravelChecklist.jsx',
);
assert.match(preTravel, /scrollPlannerFlightSearchForm/, 'pre-travel scrolls to search form');
assert.doesNotMatch(
  preTravel,
  /buildTripcomPlannerNavigationUrl/,
  'pre-travel flight CTA does not open Trip.com directly',
);

const focus = read('src/utils/placePlannerFocus.js');
assert.match(focus, /FLIGHT_SEARCH:\s*'planner-flight-search'/, 'flight search form focus id');
assert.match(focus, /export function scrollPlannerFlightSearchForm/, 'scroll helper exported');
assert.match(focus, /export const PLANNER_STAGE/, 'planner stage SSOT');
assert.match(focus, /export function resolvePlannerStageFromFocusId/, 'hash → stage');
assert.match(
  focus,
  /PREP_SAFETY\]: PLANNER_STAGE\.ESSENTIAL/,
  '안전 카드는 필수 단계에 유지',
);

assert.match(widget, /id="planner-flight-search"/, 'banner is the flight search form anchor');

const cta = read(
  'src/components/PlaceCard/tabs/planner/components/FlightSearchCta.jsx',
);
assert.match(cta, /chooseDates/, 'scroll CTA copy key');

assert.match(
  affiliate,
  /buildTripcomFlightTicketsHref/,
  'dated search uses Trip.com results path',
);
assert.match(
  affiliate,
  /resolveTripcomFlightTicketsDates/,
  'missing dates still land on tickets search',
);
assert.doesNotMatch(
  affiliate,
  /searchboxarg/,
  'tickets URL is results, not search-box home',
);

const native = read(
  'src/components/PlaceCard/tabs/planner/components/TripcomFlightNativeSearch.jsx',
);
assert.match(native, /nativeRoundTrip/, 'round-trip control');
assert.match(native, /nativeOneWay/, 'one-way control');
assert.doesNotMatch(native, /adultCount/, 'passenger stepper removed');
assert.doesNotMatch(native, /nativePassengers/, 'passenger label removed');
assert.match(native, /arrivalIata/, 'arrival override passed to Trip.com');
assert.match(native, /AirportSlot/, 'combined origin-destination picker');
assert.match(native, /TripcomFlightDateRangeCalendar/, 'single date-range calendar');
assert.match(native, /hasCompleteFlightDates/, 'search waits for picked dates');
assert.match(native, /data-tripcom-schedule-complete/, 'incomplete schedule marker');
assert.doesNotMatch(native, /addDaysYmd\(todayYmd\(\), 14\)/, 'form does not auto-fill +14');

const calendar = read(
  'src/components/PlaceCard/tabs/planner/components/TripcomFlightDateRangeCalendar.jsx',
);
assert.match(calendar, /data-tripcom-date-range/, 'range calendar marker');
assert.match(calendar, /applyFlightDatePick/, 'shared date-pick helper');
assert.match(calendar, /openSignal/, 'search without dates reopens calendar');
assert.match(calendar, /nativePickDepart/, 'empty dates show pick-depart copy');

const modal = read('src/components/PlaceCard/modals/TripcomFlightSearchModal.jsx');
assert.match(modal, /data-tripcom-flight-modal="native"/, 'native date-form modal');
assert.match(modal, /TripcomFlightNativeSearch/, 'modal reuses planner search form');
assert.match(modal, /calendarInitialOpen/, 'modal calendar opens for date pick');

const context = read(
  'src/components/PlaceCard/tabs/planner/TripcomFlightSearchContext.jsx',
);
assert.match(context, /mode: 'native'/, 'widget-down fallback is native form');
assert.match(context, /tickets 직행 금지/, 'no tickets skip from summary/cinema CTA');

const cinemaBar = read('src/pages/Home/components/FlightCinemaBar.jsx');
assert.match(cinemaBar, /WhiteLabelWidget/, 'summary cinema search uses WhiteLabelWidget');
assert.match(cinemaBar, /searchFlights/, 'summary cinema has 항공권 검색');

assert.match(whiteLabel, /tryOpenFlightSearch/, 'globe CTA tries in-app form first');

const vercel = read('vercel.json');
assert.match(vercel, /\/qa\/flight"/, 'vercel.json /qa/flight');
assert.match(vercel, /\/qa\/tripcom-flight/, 'vercel.json /qa/tripcom-flight alias');
assert.match(vercel, /\/qa\/planner-stages/, 'vercel.json /qa/planner-stages');
assert.match(
  vercel,
  /days-git-cursor-planner-stages-7ee0-catgeots-projects\.vercel\.app\/place\/paris\/planner/,
  'qa/planner-stages git Preview',
);
assert.match(
  vercel,
  /days-git-cursor-tripcom-flight-widget-3ec3-catgeots-projects\.vercel\.app\/place\/paris\/planner/,
  'qa/flight git Preview',
);

const qa = read('src/shared/cloudPreview/cloudQaShareLinks.js');
assert.match(qa, /slug: 'flight'/, 'qa share slug /qa/flight');
assert.match(qa, /slug: 'tripcom-flight'/, 'old slug kept as alias');
assert.match(qa, /slug: 'planner-stages'/, 'qa share slug /qa/planner-stages');
assert.match(qa, /branch:\s*'cursor\/planner-stages-7ee0'/, 'planner-stages qa branch');

assert.match(affiliate, /params\.set\('dcity'/, 'results dcity');
assert.match(affiliate, /params\.set\('acity'/, 'results acity');
assert.match(affiliate, /params\.set\('triptype'/, 'results triptype');
assert.match(affiliate, /params\.set\('quantity'/, 'results quantity');
assert.match(affiliate, /arrivalIata/, 'arrival override option');
assert.match(affiliate, /resolveTripcomFlightTripType/, 'OW/RT resolver');

const {
  buildTripcomFlightTicketsHref,
  resolveTripcomFlightTicketsDates,
} = await import('../src/utils/tripcomFlightResultsUrl.js');
const resultsHref = buildTripcomFlightTicketsHref(
  'https://kr.trip.com',
  'ICN',
  'CDG',
  new URLSearchParams({
    ddate: '2026-10-15',
    rdate: '2026-10-22',
    triptype: 'rt',
    quantity: '2',
    dcity: 'icn',
    acity: 'cdg',
  }),
);
assert.equal(
  resultsHref.startsWith('https://kr.trip.com/flights/icn-to-cdg/tickets-icn-cdg?'),
  true,
  'tickets results path',
);
assert.match(resultsHref, /ddate=2026-10-15/, 'depart date query');
assert.match(resultsHref, /rdate=2026-10-22/, 'return date query');
assert.match(resultsHref, /triptype=rt/, 'round-trip query');
assert.match(resultsHref, /quantity=2/, 'adult quantity query');

const defaultDates = resolveTripcomFlightTicketsDates({ today: '2026-09-19' });
assert.equal(defaultDates.ddate, '2026-10-03', 'no schedule → +14 depart');
assert.equal(defaultDates.rdate, '2026-10-10', 'no schedule → +21 return');
assert.equal(defaultDates.tripType, 'RT', 'no schedule → round trip');

const oneWayDates = resolveTripcomFlightTicketsDates({
  tripType: 'OW',
  departDate: '2026-11-01',
  today: '2026-09-19',
});
assert.equal(oneWayDates.ddate, '2026-11-01', 'one-way keeps depart');
assert.equal(oneWayDates.rdate, '', 'one-way has no return');
assert.equal(oneWayDates.tripType, 'OW', 'one-way type');

const { applyFlightDatePick, hasCompleteFlightDates } = await import('../src/utils/tripcomFlightDateRange.js');
const start = applyFlightDatePick({
  tripType: 'RT',
  ddate: '2026-10-15',
  rdate: '2026-10-22',
  picking: 'start',
  ymd: '2026-11-01',
  today: '2026-09-19',
});
assert.equal(start.ddate, '2026-11-01', 'first tap sets depart');
assert.equal(start.rdate, '', 'first tap clears return');
assert.equal(start.picking, 'end', 'next tap is return');
assert.equal(start.done, false, 'range not complete');

const end = applyFlightDatePick({
  ...start,
  ymd: '2026-11-08',
});
assert.equal(end.rdate, '2026-11-08', 'second tap sets return');
assert.equal(end.done, true, 'range complete');

const oneWay = applyFlightDatePick({
  tripType: 'OW',
  ddate: '2026-10-15',
  rdate: '',
  picking: 'start',
  ymd: '2026-11-03',
  today: '2026-09-19',
});
assert.equal(oneWay.ddate, '2026-11-03', 'one-way sets depart');
assert.equal(oneWay.done, true, 'one-way completes on first tap');

assert.equal(
  hasCompleteFlightDates({ tripType: 'RT', ddate: '', rdate: '' }),
  false,
  'empty range is incomplete',
);
assert.equal(
  hasCompleteFlightDates({ tripType: 'RT', ddate: '2026-11-01', rdate: '' }),
  false,
  'round-trip needs return',
);
assert.equal(
  hasCompleteFlightDates({ tripType: 'RT', ddate: '2026-11-01', rdate: '2026-11-08' }),
  true,
  'round-trip complete',
);
assert.equal(
  hasCompleteFlightDates({ tripType: 'OW', ddate: '2026-11-01', rdate: '' }),
  true,
  'one-way complete with depart only',
);

console.log('OK: tripcom-flight-planner — iframe banner · form scroll CTA · tickets URL');
console.log('SMOKE OK');
