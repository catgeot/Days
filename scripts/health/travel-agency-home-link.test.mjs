import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

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

// window를 먼저 올리면 supabase realtime이 붙어 테스트 프로세스가 안 끝난다.
const { TRAVEL_AGENCIES } = await import('../../src/data/travelAgencies.js');
const { MRT_PACKAGE_SHORT_URLS } = await import('../../src/pages/Home/data/mrtPackageThemeLinks.js');
const { GYG_PARTNER_ID } = await import('../../src/utils/gygAffiliateLinks.js');
const {
  KLOOK_AID,
  KLOOK_DEFAULT_AD_ID,
  TRIPCOM_KR_PARTNER,
} = await import('../../src/utils/affiliate.js');
const { getTravelAgencyHomeUrl } = await import('../../src/utils/travelAgencyHome.js');
const { i18n } = await import('../../src/i18n/config.js');
const {
  TRAVEL_AGENCY_HOME_LINK_ATTR,
  TRAVEL_AGENCY_VISITS_KEY,
  applyTravelAgencyAnchorClick,
  clearTravelAgencyVisits,
  loadTravelAgencyVisits,
  recordTravelAgencyVisit,
} = await import('../../src/utils/travelAgencyVisits.js');
const { default: TravelAgencyDirectory } = await import(
  '../../src/components/travelAgencies/TravelAgencyDirectory.jsx'
);
const { default: TravelAgencyVisitCapture } = await import(
  '../../src/components/travelAgencies/TravelAgencyVisitCapture.jsx'
);

setGlobal('window', window);
setGlobal('document', window.document);
setGlobal('navigator', window.navigator);
setGlobal('localStorage', window.localStorage);
setGlobal('HTMLElement', window.HTMLElement);
setGlobal('Element', window.Element);
setGlobal('Node', window.Node);
setGlobal('HTMLIFrameElement', window.HTMLIFrameElement);
setGlobal('MouseEvent', window.MouseEvent);
setGlobal('CustomEvent', window.CustomEvent);
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);
setGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
setGlobal('cancelAnimationFrame', (id) => clearTimeout(id));
window.localStorage.setItem('gateo.locale', 'ko');
await i18n.changeLanguage('ko');

const STAY_HREF =
  'https://www.myrealtrip.com/accommodations?q=%EC%B9%B4%EC%98%A4%EB%9D%BD&mylink_id=2640202&utm_source=mktpartner';

function fakeAnchor(attrs) {
  return {
    href: attrs.href || '',
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
  };
}

let root;
let container;

afterEach(async () => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
  container?.remove();
  container = null;
  clearTravelAgencyVisits();
  await i18n.changeLanguage('ko');
});

function mount(variant) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  return act(async () => {
    root.render(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(TravelAgencyVisitCapture),
        React.createElement(TravelAgencyDirectory, { variant }),
      ),
    );
  });
}

function catalogRoot(variant) {
  if (variant === 'planner') return document.getElementById('planner-connected-agencies');
  return [...document.querySelectorAll('p')].find((node) => node.textContent === '연결된 여행사')
    ?.nextElementSibling;
}

test('home URLs keep affiliate params for mrt, klook, trip.com, and getyourguide', () => {
  assert.equal(getTravelAgencyHomeUrl('mrt'), MRT_PACKAGE_SHORT_URLS.home);
  assert.match(getTravelAgencyHomeUrl('mrt'), /^https:\/\/myrealt\.rip\/fOey96$/);

  const klook = new URL(getTravelAgencyHomeUrl('klook'));
  assert.equal(klook.hostname, 'www.klook.com');
  assert.equal(klook.searchParams.get('aid'), KLOOK_AID);
  assert.equal(klook.searchParams.get('aff_adid'), KLOOK_DEFAULT_AD_ID);
  assert.equal(klook.searchParams.get('utm_medium'), 'affiliate-alwayson');
  assert.equal(klook.searchParams.get('utm_source'), 'non-network');
  assert.equal(klook.searchParams.get('utm_campaign'), KLOOK_AID);

  const trip = new URL(getTravelAgencyHomeUrl('tripcom'));
  assert.equal(trip.searchParams.get('Allianceid'), TRIPCOM_KR_PARTNER.allianceId);
  assert.equal(trip.searchParams.get('SID'), TRIPCOM_KR_PARTNER.sid);
  assert.equal(trip.searchParams.get('trip_sub1'), 'gateo-agency-directory');

  const gyg = new URL(getTravelAgencyHomeUrl('getyourguide'));
  assert.equal(gyg.searchParams.get('partner_id'), GYG_PARTNER_ID);
  assert.equal(gyg.searchParams.get('utm_medium'), 'online_publisher');
  assert.ok(gyg.searchParams.get('cmp'));

  assert.equal(getTravelAgencyHomeUrl('missing-agency'), '');
});

test('home click keeps the stored last URL and a plain home URL click does not', () => {
  recordTravelAgencyVisit({
    href: 'https://www.klook.com/ko/search/result/?query=phuket',
    placeLabel: '푸켓',
    kind: 'tour',
  });
  recordTravelAgencyVisit({
    href: STAY_HREF,
    placeLabel: '카오락',
    kind: 'stay',
  });
  const before = loadTravelAgencyVisits().find((item) => item.agencyId === 'mrt');
  assert.equal(before.href, STAY_HREF);
  assert.equal(before.placeLabel, '카오락');
  assert.equal(before.kind, 'stay');

  const homeHref = getTravelAgencyHomeUrl('mrt');
  const touched = applyTravelAgencyAnchorClick(
    fakeAnchor({
      href: homeHref,
      [TRAVEL_AGENCY_HOME_LINK_ATTR]: 'mrt',
    }),
  );
  const afterHome = touched.find((item) => item.agencyId === 'mrt');
  assert.equal(afterHome.href, STAY_HREF);
  assert.equal(afterHome.placeLabel, '카오락');
  assert.equal(afterHome.kind, 'stay');
  assert.ok(afterHome.visitedAt >= before.visitedAt);
  assert.notEqual(afterHome.href, homeHref);

  const replaced = applyTravelAgencyAnchorClick(fakeAnchor({ href: homeHref }));
  assert.equal(replaced.find((item) => item.agencyId === 'mrt').href, homeHref);
});

test('visited agencies stay in the catalog and the home control does not rewrite href', async () => {
  recordTravelAgencyVisit({
    href: STAY_HREF,
    placeLabel: '카오락',
    kind: 'stay',
  });

  for (const variant of ['panel', 'explore', 'planner']) {
    await mount(variant);
    const catalog = catalogRoot(variant);
    assert.ok(catalog, `${variant} catalog`);
    const catalogLinks = [...catalog.querySelectorAll('a[href]')];
    const catalogIds = new Set(
      catalogLinks.map((anchor) => anchor.textContent || ''),
    );
    for (const agency of TRAVEL_AGENCIES) {
      const home = getTravelAgencyHomeUrl(agency.id);
      if (!home) continue;
      assert.ok(
        [...catalogIds].some((text) => text.includes(agency.nameKo)),
        `${variant} catalog includes visited-or-not ${agency.id}`,
      );
    }
    assert.ok(
      catalogLinks.some((anchor) => (anchor.textContent || '').includes('마이리얼트립')),
      `${variant} catalog still lists visited MyRealTrip`,
    );
    assert.equal(
      catalog.querySelector(`[${TRAVEL_AGENCY_HOME_LINK_ATTR}]`),
      null,
      `${variant} catalog rows are the home URL themselves`,
    );

    const homeLink = document.querySelector(`[${TRAVEL_AGENCY_HOME_LINK_ATTR}="mrt"]`);
    assert.ok(homeLink, `${variant} visited row home link`);
    assert.equal(homeLink.getAttribute('href'), getTravelAgencyHomeUrl('mrt'));
    assert.equal(homeLink.textContent.trim(), '홈');
    assert.equal(homeLink.getAttribute('aria-label'), '마이리얼트립 홈 열기');
    assert.match(homeLink.className, /min-h-\[44px\]/);
    assert.match(homeLink.className, /min-w-\[44px\]/);
    assert.equal(homeLink.getAttribute('target'), '_blank');
    assert.equal(homeLink.getAttribute('rel'), 'noopener');

    const row = homeLink.parentElement;
    const body = row.querySelector('a[href]');
    assert.equal(body.getAttribute('href'), STAY_HREF);
    const name = row.querySelector('span');
    assert.ok(name?.textContent?.includes('마이리얼트립'));

    await act(async () => {
      root.unmount();
    });
    root = null;
    container.remove();
    container = null;
  }

  await mount('planner');
  const homeLink = document.querySelector(`[${TRAVEL_AGENCY_HOME_LINK_ATTR}="mrt"]`);
  const before = loadTravelAgencyVisits().find((item) => item.agencyId === 'mrt');
  await act(async () => {
    homeLink.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  const after = loadTravelAgencyVisits().find((item) => item.agencyId === 'mrt');
  assert.equal(after.href, STAY_HREF);
  assert.equal(after.placeLabel, before.placeLabel);
  assert.equal(after.kind, before.kind);
  assert.equal(
    document.querySelector(`[${TRAVEL_AGENCY_HOME_LINK_ATTR}="mrt"]`).parentElement.querySelector('a[href]').getAttribute('href'),
    STAY_HREF,
  );
  const stored = JSON.parse(localStorage.getItem(TRAVEL_AGENCY_VISITS_KEY));
  assert.equal(stored.find((item) => item.agencyId === 'mrt').href, STAY_HREF);

  await act(async () => {
    await i18n.changeLanguage('en');
  });
  const enHome = document.querySelector(`[${TRAVEL_AGENCY_HOME_LINK_ATTR}="mrt"]`);
  assert.equal(enHome.textContent.trim(), 'Home');
  assert.equal(enHome.getAttribute('aria-label'), 'Open MyRealTrip home');
});
