import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import React, { act, useState } from 'react';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://www.gateo.kr/',
});
const { window } = dom;

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

const {
  buildServiceModalRegionResetEvent,
  buildServiceModalSearchEvent,
  buildServiceModalSearchOpenEvent,
  collectRecentServiceRegions,
  buildTourActivitiesWidgetQuery,
  confirmTourRegion,
  confirmTourSearch,
  createTourRegionState,
  filterServiceRegions,
  isTourRegionChanged,
  isTourRegionSupported,
  listKnownServiceRegions,
  listRecommendedServiceRegions,
  loadRecentServiceRegions,
  parseTourServiceSearchInput,
  resetKnownServiceRegionCacheForTests,
  resetTourRegion,
  listTourSearchRegionHits,
  isTourRegionSearchDraftTooShort,
  resolveTourActivitySearchCommitMeta,
  resolveTourSearchCommit,
  resolveTourWidgetTarget,
  tourRegionLocation,
} = await import('../../src/shared/serviceRegion/serviceRegionSearchModel.js');
const {
  filterTourServiceRegions,
  resolveTourActivityListing,
  tourActivityKeywordLikelyMatches,
} = await import('../../src/shared/serviceRegion/tourActivityListing.js');
const { resolveVisibleTourPackageMoreLink } = await import('../../src/utils/mrtPackageLinks.js');
const { RECENT_SEARCH_KEY, RECENT_VISITED_KEY } = await import(
  '../../src/pages/Home/lib/exploreRecentHistory.js'
);
const { TRAVEL_AGENCY_VISITS_KEY, loadTravelAgencyVisits } = await import(
  '../../src/utils/travelAgencyVisits.js'
);
const { i18n } = await import('../../src/i18n/config.js');
const { default: ServiceRegionSearch } = await import(
  '../../src/shared/serviceRegion/ServiceRegionSearch.jsx'
);
const { default: GetYourGuideActivitiesWidget } = await import(
  '../../src/components/PlaceCard/tabs/planner/components/GetYourGuideActivitiesWidget.jsx'
);

setGlobal('window', window);
setGlobal('document', window.document);
setGlobal('navigator', window.navigator);
setGlobal('localStorage', window.localStorage);
setGlobal('HTMLElement', window.HTMLElement);
setGlobal('Element', window.Element);
setGlobal('Node', window.Node);
setGlobal('HTMLInputElement', window.HTMLInputElement);
setGlobal('HTMLIFrameElement', window.HTMLIFrameElement);
setGlobal('MouseEvent', window.MouseEvent);
setGlobal('KeyboardEvent', window.KeyboardEvent);
setGlobal('FocusEvent', window.FocusEvent);
setGlobal('Event', window.Event);
setGlobal('CustomEvent', window.CustomEvent);
setGlobal('MutationObserver', window.MutationObserver);
setGlobal('getComputedStyle', window.getComputedStyle);
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);
const { createRoot } = await import('react-dom/client');
setGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
setGlobal('cancelAnimationFrame', (id) => clearTimeout(id));
window.localStorage.setItem('gateo.locale', 'ko');
await i18n.changeLanguage('ko');

const events = [];
window.gtag = (type, name, params) => {
  if (type === 'event') events.push({ name, params: { ...params } });
};

function regionBySlug(slug) {
  const found = listKnownServiceRegions().find((region) => region.slug === slug);
  assert.ok(found, slug);
  return found;
}

const khaoLak = regionBySlug('khao-lak');
const KHAO_LAK_GYG_Q = 'Khao Lak Phang Nga';
const phuket = regionBySlug('phuket');
const jeju = regionBySlug('jeju');
const kyoto = regionBySlug('kyoto');
const unsupported = {
  slug: 'atlantis-test',
  name: '아틀란티스',
  name_en: '',
  country: '아틀란티스',
  country_en: '',
};

function searchRegions(query) {
  const text = String(query || '').trim();
  if (text === '푸켓' || text === 'ㅍㅋ') return [phuket];
  if (text === '제주') return [jeju];
  if (text === '없음') return [unsupported];
  if (text === '태국') return [phuket, kyoto];
  return [];
}

function TourHarness() {
  const [state, setState] = useState(() => createTourRegionState(khaoLak));
  const active = tourRegionLocation(state);
  const target = buildTourActivitiesWidgetQuery(active, state.activityKeyword);
  const search = React.createElement(ServiceRegionSearch, {
    service: 'tour',
    originalLocation: state.original,
    activeLocation: active,
    changed: isTourRegionChanged(state),
    notice: state.notice,
    appliedSearchText: state.committedSearchText,
    onSearchClear: () =>
      setState((prev) =>
        confirmTourSearch(prev, {
          activityKeyword: '',
          searchText: '',
          keywordSearchFallback: false,
        }),
      ),
    onCommit: (region, meta) =>
      setState((prev) =>
        confirmTourSearch(prev, {
          region,
          activityKeyword: meta?.activityKeyword,
          searchText: meta?.searchText,
          keywordSearchFallback: meta?.keywordSearchFallback,
        }),
      ),
    onReset: () => setState((prev) => resetTourRegion(prev)),
    loadRecent: () => [phuket],
    loadRecommended: () => [kyoto],
    searchRegions,
    now: () => new Date('2026-11-17T04:00:00Z'),
  });
  if (target.kind === 'mrt') {
    return React.createElement(
      'div',
      null,
      search,
      React.createElement('div', {
        'data-tour-widget': 'mrt',
        'data-mrt-keyword': target.query,
      }),
    );
  }
  return React.createElement(GetYourGuideActivitiesWidget, {
    location: active,
    query: target.query,
    variant: 'open',
    linkSponsoredLabel: true,
    regionSearch: search,
  });
}

let root;
let container;

function widgetQuery() {
  return container.querySelector('[data-gyg-q]')?.getAttribute('data-gyg-q') || '';
}

function inputEl() {
  const input = container.querySelector('[data-service-region-search="tour"]');
  assert.ok(input);
  return input;
}

async function typeQuery(value) {
  const input = inputEl();
  await act(async () => {
    const previous = input.value;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    const tracker = input._valueTracker;
    if (tracker) tracker.setValue(previous);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

async function pressEnter() {
  const input = inputEl();
  await act(async () => {
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
}

afterEach(async () => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
  container = null;
  events.length = 0;
});

test('choseong adapter matches 푸켓 and does not use the retired search engine', () => {
  const files = [
    'src/shared/serviceRegion/serviceRegionSearchModel.js',
    'src/shared/serviceRegion/ServiceRegionSearch.jsx',
    'src/pages/Home/components/GlobeTourStrip.jsx',
  ];
  for (const file of files) {
    const source = readFileSync(join(rootDir, file), 'utf8');
    assert.doesNotMatch(source, /useSearchEngine\.js/);
    assert.doesNotMatch(source, /from\s+['"][^'"]*useSearchEngine['"]/);
  }
  const model = readFileSync(join(rootDir, files[0]), 'utf8');
  assert.match(model, /hangulSearch/);
  assert.match(model, /exploreChoseongMatch/);
  assert.match(model, /normalizeSearchSuggestions/);
  const stay = readFileSync(join(rootDir, 'src/pages/Home/components/GlobeStayStrip.jsx'), 'utf8');
  assert.doesNotMatch(stay, /ServiceRegionSearch/);

  const hits = filterServiceRegions('ㅍㅋ');
  assert.ok(hits.some((region) => region.slug === 'phuket'));
  assert.equal(filterServiceRegions('').length, 0);
  assert.equal(isTourRegionSupported(unsupported), false);
  assert.equal(isTourRegionSupported(phuket), true);
  assert.equal(resolveTourWidgetTarget(jeju).kind, 'mrt');
});

test('recent regions stay read-only and this month recommends two or three', () => {
  const november = new Date('2026-11-17T04:00:00Z');
  const recommended = listRecommendedServiceRegions({ now: november, limit: 3 });
  assert.ok(recommended.length >= 2 && recommended.length <= 3);
  assert.deepEqual(
    recommended.map((region) => region.slug),
    ['kyoto', 'chiang-mai', 'phu-quoc'],
  );

  window.localStorage.setItem(
    RECENT_VISITED_KEY,
    JSON.stringify([{ name: '교토', slug: 'kyoto', name_en: 'Kyoto' }]),
  );
  window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(['푸켓', '카오락']));
  window.localStorage.setItem(TRAVEL_AGENCY_VISITS_KEY, JSON.stringify([]));
  const before = {
    visited: window.localStorage.getItem(RECENT_VISITED_KEY),
    searches: window.localStorage.getItem(RECENT_SEARCH_KEY),
    visits: window.localStorage.getItem(TRAVEL_AGENCY_VISITS_KEY),
  };
  const loaded = loadRecentServiceRegions(3);
  assert.deepEqual(
    loaded.map((region) => region.slug),
    ['kyoto', 'phuket', 'khao-lak'],
  );
  assert.deepEqual(
    {
      visited: window.localStorage.getItem(RECENT_VISITED_KEY),
      searches: window.localStorage.getItem(RECENT_SEARCH_KEY),
      visits: window.localStorage.getItem(TRAVEL_AGENCY_VISITS_KEY),
    },
    before,
  );

  const merged = collectRecentServiceRegions({
    visited: [{ slug: 'kyoto', name: '교토' }],
    agencyVisits: [{ placeLabel: 'Phuket' }],
    searches: ['카오락', '교토'],
  });
  assert.deepEqual(
    merged.map((region) => region.slug),
    ['kyoto', 'phuket', 'khao-lak'],
  );
});

test('widget query waits for confirm, reset restores, and affiliate fields follow the new region', async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(TourHarness));
  });

  assert.equal(widgetQuery(), KHAO_LAK_GYG_Q);
  assert.equal(container.querySelector('[data-gyg-partner-id]')?.getAttribute('data-gyg-partner-id'), 'LRKVVU4');
  assert.equal(container.querySelector('[data-gyg-cmp]')?.getAttribute('data-gyg-cmp'), 'gateo_planer_khao-lak');
  assert.equal(container.querySelector('[data-service-region-reset]'), null);
  assert.equal(container.textContent.includes('검색어 ·'), false);

  const input = inputEl();
  await act(async () => {
    input.focus();
    input.dispatchEvent(new window.FocusEvent('focus', { bubbles: false }));
    input.dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
  });
  assert.equal(events.filter((event) => event.name === 'service_modal_search_open').length, 1);
  assert.deepEqual(events[0], {
    name: 'service_modal_search_open',
    params: { service: 'tour', has_recent: 1 },
  });

  await typeQuery('푸');
  assert.equal(widgetQuery(), KHAO_LAK_GYG_Q);
  await pressEnter();
  assert.equal(widgetQuery(), KHAO_LAK_GYG_Q);
  assert.equal(events.some((event) => event.name === 'service_modal_search'), false);

  await typeQuery('태국');
  await pressEnter();
  assert.equal(widgetQuery(), KHAO_LAK_GYG_Q);

  await typeQuery('푸켓');
  assert.equal(widgetQuery(), KHAO_LAK_GYG_Q);
  await pressEnter();
  assert.equal(widgetQuery(), 'Phuket');
  assert.equal(container.querySelector('[data-gyg-cmp]')?.getAttribute('data-gyg-cmp'), 'gateo_planer_phuket');
  assert.equal(container.querySelector('[data-gyg-partner-id]')?.getAttribute('data-gyg-partner-id'), 'LRKVVU4');
  const sponsored = container.querySelector('a[rel]');
  assert.ok(sponsored);
  assert.match(sponsored.getAttribute('rel'), /noopener/);
  assert.match(sponsored.getAttribute('rel'), /noreferrer/);
  assert.match(sponsored.getAttribute('rel'), /sponsored/);
  assert.equal(sponsored.getAttribute('data-gateo-place'), 'Phuket');

  await act(async () => {
    sponsored.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
  const visits = loadTravelAgencyVisits();
  assert.equal(visits[0]?.placeLabel, 'Phuket');
  assert.equal(visits[0]?.kind, 'tour');

  const searchEvent = events.find((event) => event.name === 'service_modal_search');
  assert.deepEqual(searchEvent, {
    name: 'service_modal_search',
    params: {
      service: 'tour',
      from: 'khao-lak',
      to: 'phuket',
      method: 'typed',
      result: 'ok',
      chars: 2,
    },
  });
  assert.equal(JSON.stringify(searchEvent).includes('푸켓'), false);

  const reset = container.querySelector('[data-service-region-reset]');
  assert.ok(reset);
  assert.match(reset.textContent, /카오락 투어로 돌아가기/);
  await act(async () => {
    reset.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
  assert.equal(widgetQuery(), KHAO_LAK_GYG_Q);
  assert.equal(container.querySelector('[data-gyg-cmp]')?.getAttribute('data-gyg-cmp'), 'gateo_planer_khao-lak');
  const resetEvent = events.find((event) => event.name === 'service_modal_region_reset');
  assert.deepEqual(resetEvent, {
    name: 'service_modal_region_reset',
    params: { service: 'tour', to: 'khao-lak' },
  });

  await typeQuery('없음');
  await pressEnter();
  assert.equal(widgetQuery(), KHAO_LAK_GYG_Q);
  assert.match(container.querySelector('[data-service-region-notice]')?.textContent || '', /투어 제휴 목록이 아직 없어요/);
  const rejected = events.filter((event) => event.name === 'service_modal_search').at(-1);
  assert.equal(rejected.params.result, 'no_partner');
  assert.equal(rejected.params.to, 'atlantis-test');
  assert.equal(rejected.params.chars, 2);

  await act(async () => {
    inputEl().blur();
  });
  await act(async () => {
    inputEl().focus();
    inputEl().dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
  });
  assert.equal(events.filter((event) => event.name === 'service_modal_search_open').length, 1);

  const option = container.querySelector('[data-region-slug="kyoto"]');
  assert.ok(option);
  await act(async () => {
    option.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
  assert.equal(widgetQuery(), 'Kyoto');
  const recommendedEvent = events.filter((event) => event.name === 'service_modal_search').at(-1);
  assert.equal(recommendedEvent.params.method, 'recommended');
  assert.equal(recommendedEvent.params.chars, 0);

  await typeQuery('제주');
  await pressEnter();
  assert.equal(container.querySelector('[data-tour-widget="mrt"]')?.getAttribute('data-mrt-keyword'), '제주');
  assert.equal(container.querySelector('[data-gyg-q]'), null);

  let restored = confirmTourRegion(createTourRegionState(khaoLak), phuket);
  assert.equal(isTourRegionChanged(restored), true);
  restored = resetTourRegion(restored);
  assert.equal(tourRegionLocation(restored).slug, 'khao-lak');
  restored = createTourRegionState(jeju);
  assert.equal(tourRegionLocation(restored).slug, 'jeju');
  assert.equal(isTourRegionChanged(restored), false);
});

test('event payloads carry length and slugs only', () => {
  assert.deepEqual(
    buildServiceModalSearchEvent({
      service: 'tour',
      from: 'khao-lak',
      to: 'phuket',
      method: 'recent',
      result: 'ok',
      chars: 4,
    }),
    {
      name: 'service_modal_search',
      params: {
        service: 'tour',
        from: 'khao-lak',
        to: 'phuket',
        method: 'recent',
        result: 'ok',
        chars: 4,
      },
    },
  );
  assert.deepEqual(buildServiceModalSearchOpenEvent({ service: 'tour', hasRecent: false }), {
    name: 'service_modal_search_open',
    params: { service: 'tour', has_recent: 0 },
  });
  assert.deepEqual(buildServiceModalRegionResetEvent({ service: 'tour', to: 'khao-lak' }), {
    name: 'service_modal_region_reset',
    params: { service: 'tour', to: 'khao-lak' },
  });
});

test('package link follows the confirmed region and hides when that region cannot build one', () => {
  const khao = resolveVisibleTourPackageMoreLink({
    original: khaoLak,
    active: khaoLak,
    changed: false,
    locale: 'ko',
  });
  const switched = resolveVisibleTourPackageMoreLink({
    original: khaoLak,
    active: phuket,
    changed: true,
    locale: 'ko',
  });
  assert.ok(khao?.href);
  assert.match(khao.label, /카오락 패키지 상품보기/);
  assert.match(decodeURIComponent(khao.href), /카오락/);
  assert.ok(switched?.href);
  assert.match(switched.label, /푸켓 패키지 상품보기/);
  assert.match(decodeURIComponent(switched.href), /푸켓/);
  assert.equal(decodeURIComponent(switched.href).includes('카오락'), false);
  assert.notEqual(switched.href, khao.href);

  const unbuildable = {
    slug: 'sokcho-test',
    name: '속초',
    name_ko: '속초',
    country: '한국',
    country_en: 'South Korea',
  };
  assert.equal(
    resolveVisibleTourPackageMoreLink({
      original: khaoLak,
      active: unbuildable,
      changed: true,
      locale: 'ko',
    }),
    null,
  );
  const restored = resolveVisibleTourPackageMoreLink({
    original: khaoLak,
    active: null,
    changed: false,
    locale: 'ko',
  });
  assert.match(restored.label, /카오락 패키지 상품보기/);
  assert.equal(restored.href, khao.href);
});

test('confirmed region is recorded on confirm and the next open reports has_recent', async () => {
  window.localStorage.removeItem(RECENT_VISITED_KEY);
  window.localStorage.removeItem(RECENT_SEARCH_KEY);
  window.localStorage.removeItem(TRAVEL_AGENCY_VISITS_KEY);
  const keysBefore = new Set(Object.keys(window.localStorage));
  events.length = 0;

  function Harness() {
    const [state, setState] = useState(() => createTourRegionState(khaoLak));
    const active = tourRegionLocation(state);
    return React.createElement(ServiceRegionSearch, {
      service: 'tour',
      originalLocation: state.original,
      activeLocation: active,
      changed: isTourRegionChanged(state),
      notice: state.notice,
      onCommit: (region, meta) =>
        setState((prev) =>
          confirmTourSearch(prev, { region, activityKeyword: meta?.activityKeyword }),
        ),
      onReset: () => setState((prev) => resetTourRegion(prev)),
    });
  }

  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(Harness));
  });

  await act(async () => {
    inputEl().focus();
    inputEl().dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
  });
  assert.equal(
    events.find((event) => event.name === 'service_modal_search_open')?.params.has_recent,
    0,
  );
  assert.equal(container.querySelector('[data-region-slug="phuket"]'), null);

  await typeQuery('푸켓');
  const option = container.querySelector('[data-region-method="typed"][data-region-slug="phuket"]');
  assert.ok(option);
  await act(async () => {
    option.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });

  const visits = loadTravelAgencyVisits();
  assert.equal(visits[0]?.placeLabel, 'Phuket');
  assert.equal(visits[0]?.kind, 'tour');
  assert.match(visits[0]?.href || '', /getyourguide\.com/);
  assert.ok(loadRecentServiceRegions(3).some((region) => region.slug === 'phuket'));
  const added = Object.keys(window.localStorage).filter((key) => !keysBefore.has(key));
  assert.deepEqual(added, [TRAVEL_AGENCY_VISITS_KEY]);
  assert.equal(window.localStorage.getItem(RECENT_VISITED_KEY), null);
  assert.equal(window.localStorage.getItem(RECENT_SEARCH_KEY), null);

  await act(async () => {
    inputEl().dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
  assert.ok(container.querySelector('[data-region-method="recent"][data-region-slug="phuket"]'));

  await act(async () => {
    root.unmount();
  });
  root = null;
  events.length = 0;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(Harness));
  });
  await act(async () => {
    inputEl().focus();
    inputEl().dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
  });
  assert.equal(
    events.find((event) => event.name === 'service_modal_search_open')?.params.has_recent,
    1,
  );
  assert.ok(container.querySelector('[data-region-method="recent"][data-region-slug="phuket"]'));
});

test('tour parse — region+keyword, activity-only, no match', () => {
  resetKnownServiceRegionCacheForTests();
  assert.equal(parseTourServiceSearchInput('카오락 시미란', khaoLak).kind, 'region_activity');
  assert.equal(
    parseTourServiceSearchInput('카오락 시미란', khaoLak).activityKeyword,
    '시미란',
  );
  assert.equal(parseTourServiceSearchInput('El Nido island hopping', khaoLak).kind, 'region_activity');
  assert.match(buildTourActivitiesWidgetQuery(khaoLak, '스노클링').query || '', /스노클링/);
  assert.equal(parseTourServiceSearchInput('스노클링', khaoLak).kind, 'activity_only');
  assert.equal(parseTourServiceSearchInput('없는말', khaoLak).kind, 'no_match');
  assert.equal(parseTourServiceSearchInput('카오락', khaoLak).kind, 'region_only');
});

test('widget query updates on region+keyword commit and Enter', async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(TourHarness));
  });

  assert.equal(widgetQuery(), KHAO_LAK_GYG_Q);
  await typeQuery('카오락 시미란');
  await pressEnter();
  assert.match(widgetQuery(), /Khao Lak/);
  assert.match(widgetQuery(), /시미란/);

  await typeQuery('island hopping');
  await pressEnter();
  assert.match(widgetQuery(), /island hopping/i);

  await typeQuery('없는말');
  const input = inputEl();
  await act(async () => {
    input.dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
  });
  assert.ok(container.querySelector('[data-tour-search-no-results]'));
  await pressEnter();
  assert.equal(widgetQuery(), `${KHAO_LAK_GYG_Q} island hopping`);

  const resolved = resolveTourSearchCommit('방콕 수상시장', [], khaoLak);
  assert.equal(resolved?.region?.slug, 'bangkok');
  assert.equal(resolved?.activityKeyword, '수상시장');

  await typeQuery('island hopping');
  await pressEnter();
  assert.equal(inputEl().value, 'island hopping');
  assert.equal(widgetQuery().toLowerCase().includes('island hopping'), true);

  const clear = container.querySelector('[data-service-region-clear]');
  assert.ok(clear);
  await act(async () => {
    clear.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
  assert.equal(inputEl().value, '');
  assert.equal(widgetQuery(), KHAO_LAK_GYG_Q);
});

test('region suggestions — El Nido phrase without substring cities', () => {
  resetKnownServiceRegionCacheForTests();
  const hits = listTourSearchRegionHits('El Nido island hopping', listKnownServiceRegions());
  assert.ok(hits.some((region) => region.slug === 'el-nido'));
  assert.equal(
    hits.some((region) => ['dublin', 'delhi', 'el-calafate'].includes(region.slug)),
    false,
  );
  assert.equal(filterTourServiceRegions('El', listKnownServiceRegions()).length, 0);
  assert.ok(filterTourServiceRegions('카오락', listKnownServiceRegions()).some((r) => r.slug === 'khao-lak'));
  assert.ok(filterTourServiceRegions('Khao Lak', listKnownServiceRegions()).some((r) => r.slug === 'khao-lak'));
  assert.ok(filterTourServiceRegions('푸켓', listKnownServiceRegions()).some((r) => r.slug === 'phuket'));
});

test('tour search draft — single hangul char is too short for no-results', () => {
  assert.equal(isTourRegionSearchDraftTooShort('방'), true);
  assert.equal(isTourRegionSearchDraftTooShort('방콕'), false);
  assert.equal(isTourRegionSearchDraftTooShort('Ph'), true);
  assert.equal(isTourRegionSearchDraftTooShort('Phu'), false);
});

test('activity keyword listing — fallback vs match flags', () => {
  assert.equal(tourActivityKeywordLikelyMatches(khaoLak, 'zzqx'), false);
  assert.equal(tourActivityKeywordLikelyMatches(khaoLak, 'zzqx 투어'), false);
  assert.equal(tourActivityKeywordLikelyMatches(khaoLak, '시미란'), true);
  assert.equal(tourActivityKeywordLikelyMatches(khaoLak, 'Similan'), true);
  assert.equal(resolveTourActivitySearchCommitMeta('zzqx', khaoLak).keywordSearchFallback, true);
  assert.equal(
    resolveTourActivitySearchCommitMeta('zzqx 투어', khaoLak, null, 'zzqx 투어').keywordSearchFallback,
    true,
  );
  assert.equal(
    resolveTourActivitySearchCommitMeta('zzqx snorkeling', khaoLak, null, 'zzqx snorkeling')
      .keywordSearchFallback,
    false,
  );
  assert.equal(resolveTourActivitySearchCommitMeta('투어', khaoLak, null, '투어').keywordSearchFallback, false);
  assert.equal(resolveTourActivitySearchCommitMeta('시미란', khaoLak).keywordSearchFallback, false);
  assert.equal(resolveTourActivitySearchCommitMeta('코끼리', khaoLak).keywordSearchFallback, false);
  assert.equal(resolveTourActivitySearchCommitMeta('snorkeling', khaoLak).keywordSearchFallback, false);
  assert.equal(
    resolveTourActivitySearchCommitMeta('시미란 스노클링', khaoLak, null, '시미란 스노클링')
      .keywordSearchFallback,
    false,
  );
  assert.equal(resolveTourActivitySearchCommitMeta('수상시장', regionBySlug('bangkok')).keywordSearchFallback, false);
  const paris = regionBySlug('paris');
  assert.equal(resolveTourActivitySearchCommitMeta('루브르', paris).keywordSearchFallback, false);
  assert.equal(resolveTourActivitySearchCommitMeta('louvre', paris).keywordSearchFallback, false);
  assert.equal(resolveTourActivitySearchCommitMeta('zzqx', paris).keywordSearchFallback, true);
  assert.equal(resolveTourActivitySearchCommitMeta('asdf', khaoLak).keywordSearchFallback, true);
  assert.equal(resolveTourActivitySearchCommitMeta('qwer', khaoLak).keywordSearchFallback, true);
  assert.equal(resolveTourActivitySearchCommitMeta('aaaa', khaoLak).keywordSearchFallback, true);
  assert.equal(resolveTourActivitySearchCommitMeta('spa', khaoLak).keywordSearchFallback, false);
  assert.equal(resolveTourActivitySearchCommitMeta('tour', khaoLak).keywordSearchFallback, false);
  assert.equal(resolveTourActivitySearchCommitMeta('kayak', khaoLak).keywordSearchFallback, false);
  const bangkok = regionBySlug('bangkok');
  const floatingMarketItems = [
    { itemName: 'Bangkok Damnoen Saduak Floating Market Tour' },
    { itemName: 'Amphawa evening floating market half-day' },
  ];
  assert.equal(
    resolveTourActivitySearchCommitMeta('수상시장', bangkok, floatingMarketItems).keywordSearchFallback,
    false,
  );
  assert.equal(
    resolveTourActivitySearchCommitMeta('방콕 수상시장', bangkok, floatingMarketItems).keywordSearchFallback,
    false,
  );
  const similanSnorkelItems = [
    { itemName: 'Khao Lak: Similan Islands Snorkeling Day Trip' },
    { itemName: 'Premium Similan liveaboard snorkeling' },
  ];
  assert.equal(
    resolveTourActivitySearchCommitMeta('시미란 스노클링', khaoLak, similanSnorkelItems).keywordSearchFallback,
    false,
  );
  assert.equal(
    resolveTourActivitySearchCommitMeta(
      'zzqx',
      khaoLak,
      [{ itemName: '부산 시티투어' }, { itemName: '제주 렌트카' }],
    ).keywordSearchFallback,
    true,
  );
  const relevant = resolveTourActivityListing(
    'zzqx',
    khaoLak,
    [{ itemName: '부산 시티투어' }, { itemName: '제주 렌트카' }],
  );
  assert.equal(relevant.keywordMatched, false);
  assert.equal(relevant.usedFallbackListing, true);
  const matched = resolveTourActivityListing('시미란', khaoLak, [
    { itemName: '카오락 출발 시미란 국립공원 스노클링' },
  ]);
  assert.equal(matched.keywordMatched, true);
  assert.equal(matched.items.length, 1);
  const matchedEnglish = resolveTourActivityListing('수상시장', bangkok, floatingMarketItems);
  assert.equal(matchedEnglish.keywordMatched, true);
  assert.equal(matchedEnglish.usedFallbackListing, false);
  const elNido = regionBySlug('el-nido');
  const elNidoFallback = resolveTourActivityListing('zzqx투어', elNido, [
    { itemName: 'El Nido Island Hopping Tour A' },
    { itemName: 'Palawan kayak experience' },
  ]);
  assert.equal(elNidoFallback.keywordMatched, false);
  assert.equal(elNidoFallback.usedFallbackListing, true);
});
