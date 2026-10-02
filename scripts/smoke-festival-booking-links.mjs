import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { trackEvent } from '../src/shared/analytics/trackEvent.js';
import {
  bookingClickParams,
  bookingUrlKey,
  filterVisibleBookingLinks,
  getVisibleBookingLinks,
  isAllowedBookingUrl,
  shouldHideOfficialHomepage,
} from '../src/pages/Korea/lib/festivalBookingLinks.js';

const ACHIM_URL = 'https://www.ticketlink.co.kr/product/65330';
const VISIBLE_NOW = '2026-10-10T23:59:58+09:00';
const HIDDEN_NOW = '2026-10-11T00:00:00+09:00';

function ids(rows) {
  return rows.map((row) => row.id);
}

const achimVisible = getVisibleBookingLinks('1998564', {
  now: VISIBLE_NOW,
  uiLang: 'ko',
});
assert.deepEqual(ids(achimVisible), ['achim']);
assert.equal(achimVisible[0].url, ACHIM_URL);
assert.equal(new URL(achimVisible[0].url).search, '');
assert.equal(isAllowedBookingUrl(ACHIM_URL), true);

const achimHidden = getVisibleBookingLinks(1998564, {
  now: HIDDEN_NOW,
  uiLang: 'ko',
});
assert.deepEqual(achimHidden, []);

assert.deepEqual(
  getVisibleBookingLinks('not-a-festival', { now: VISIBLE_NOW, uiLang: 'ko' }),
  [],
);

assert.deepEqual(
  getVisibleBookingLinks('1998564', { now: VISIBLE_NOW, uiLang: 'en' }),
  [],
  'domestic ticketlink stays hidden on en',
);

const noSaleEnd = {
  id: 'hanbok-yeonhyang',
  url: 'https://www.ticketlink.co.kr/product/65318',
  provider: 'ticketlink',
  audience: 'domestic',
  eventStart: '2026-10-09',
  eventEnd: '2026-10-10',
  sourceUrl: 'https://www.kh.or.kr/program/view/menu/527?viewType=date&idx=819',
  verifiedAt: '2026-10-02T11:00:00+09:00',
  featured: false,
};
assert.deepEqual(
  ids(filterVisibleBookingLinks([noSaleEnd], { now: '2026-10-10T23:59:59+09:00', uiLang: 'ko' })),
  ['hanbok-yeonhyang'],
);
assert.deepEqual(
  filterVisibleBookingLinks([noSaleEnd], { now: '2026-10-11T00:00:00+09:00', uiLang: 'ko' }),
  [],
);

assert.deepEqual(
  filterVisibleBookingLinks(
    [{ ...noSaleEnd, url: 'http://www.ticketlink.co.kr/product/1' }],
    { now: VISIBLE_NOW, uiLang: 'ko' },
  ),
  [],
);
assert.deepEqual(
  filterVisibleBookingLinks(
    [{ ...noSaleEnd, url: 'https://evil.example/product/1' }],
    { now: VISIBLE_NOW, uiLang: 'ko' },
  ),
  [],
);
assert.deepEqual(
  filterVisibleBookingLinks(
    [{ ...noSaleEnd, sourceUrl: '' }],
    { now: VISIBLE_NOW, uiLang: 'ko' },
  ),
  [],
);

const foreignOnly = { ...noSaleEnd, id: 'foreign', audience: 'foreign', featured: false };
const allAud = {
  ...noSaleEnd,
  id: 'all',
  audience: 'all',
  featured: false,
  eventStart: '2026-10-08',
  url: 'https://www.ticketlink.co.kr/product/1',
};
const featured = {
  ...noSaleEnd,
  id: 'feat',
  audience: 'all',
  featured: true,
  eventStart: '2026-10-11',
  url: 'https://www.ticketlink.co.kr/product/2',
};
assert.deepEqual(
  ids(
    filterVisibleBookingLinks([foreignOnly, allAud, featured], {
      now: '2026-10-08T12:00:00+09:00',
      uiLang: 'en',
    }),
  ),
  ['feat', 'all', 'foreign'],
);
assert.deepEqual(
  ids(
    filterVisibleBookingLinks([foreignOnly, allAud], {
      now: '2026-10-08T12:00:00+09:00',
      uiLang: 'ko',
    }),
  ),
  ['all'],
);

assert.equal(
  shouldHideOfficialHomepage(ACHIM_URL, [{ url: `${ACHIM_URL}/` }]),
  true,
);
assert.equal(
  shouldHideOfficialHomepage('https://www.kh.or.kr/fest', [{ url: ACHIM_URL }]),
  false,
);
assert.equal(bookingUrlKey('https://WWW.ticketlink.co.kr/product/65330/'), bookingUrlKey(ACHIM_URL));

const params = bookingClickParams('1998564', achimVisible[0], {
  placement: 'festival_detail_top',
  uiLang: 'ko',
});
assert.equal(params.festival_id, '1998564');
assert.equal(params.program_key, 'achim');
assert.equal(params.provider, 'ticketlink');
assert.equal(params.link_url, ACHIM_URL);
assert.equal(params.link_url.includes('utm_'), false);

const calls = [];
globalThis.window = {
  gtag: (...args) => {
    calls.push(args);
  },
};
trackEvent('booking_click', params);
assert.equal(calls.length, 1);
assert.deepEqual(calls[0][0], 'event');
assert.equal(calls[0][1], 'booking_click');
assert.equal(calls[0][2].festival_id, '1998564');
assert.equal(calls[0][2].program_key, 'achim');
assert.equal(calls[0][2].provider, 'ticketlink');

globalThis.window = {
  gtag: () => {
    throw new Error('gtag failed');
  },
};
assert.doesNotThrow(() => trackEvent('booking_click', params));
delete globalThis.window;
assert.doesNotThrow(() => trackEvent('booking_click', params));

if (process.env.BOOKING_TZ_CHILD !== '1') {
  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
    env: {
      ...process.env,
      TZ: 'America/Los_Angeles',
      BOOKING_TZ_CHILD: '1',
    },
    encoding: 'utf8',
  });
  if (child.status !== 0) {
    console.error(child.stdout);
    console.error(child.stderr);
  }
  assert.equal(child.status, 0, 'KST cutoff must not depend on process TZ');
}

console.log('smoke-festival-booking-links: OK');
