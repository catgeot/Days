import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  DETAIL_INTRO_DAILY_CAP,
  HOMEPAGE_OVERRIDES,
  addDaysYmd,
  applyHomepagePolicyToItem,
  festivalItemWithinIntroWindow,
  isGoKrPortalFrontPage,
  isIntroHomepageEnabled,
  kstYmd,
  mergeIntroSnippetOntoItem,
  parseHomepageUrl,
  resolvePublicHomepage,
  canMakeDetailIntroCall,
  FESTIVAL_WINDOW_INTRO_PER_REQUEST,
  extractHomepageHrefCandidates,
} from '../../supabase/functions/tourapi-proxy/intro_homepage.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('flag defaults OFF', () => {
  assert.equal(isIntroHomepageEnabled(''), false);
  assert.equal(isIntroHomepageEnabled(undefined), false);
  assert.equal(isIntroHomepageEnabled('off'), false);
  assert.equal(isIntroHomepageEnabled('on'), true);
});

test('homepage filter — bare host and portal paths on go.kr', () => {
  assert.equal(isGoKrPortalFrontPage(parseHomepageUrl('www.changwon.go.kr')), true);
  assert.equal(isGoKrPortalFrontPage(parseHomepageUrl('https://www.seoul.go.kr/')), true);
  assert.equal(isGoKrPortalFrontPage(parseHomepageUrl('https://www.seoul.go.kr/index.do')), true);
  assert.equal(isGoKrPortalFrontPage(parseHomepageUrl('https://www.seoul.go.kr/main.do')), true);
  assert.equal(isGoKrPortalFrontPage(parseHomepageUrl('https://www.seoul.go.kr/main')), true);
  assert.equal(
    isGoKrPortalFrontPage(parseHomepageUrl('https://www.seoul.go.kr/?foo=1')),
    false,
  );
  assert.equal(
    isGoKrPortalFrontPage(parseHomepageUrl('https://www.example.com/index.do')),
    false,
  );
  assert.equal(
    isGoKrPortalFrontPage(
      parseHomepageUrl('https://www.changwon.go.kr/cwportal/depart/11063/14383/14384.web'),
    ),
    false,
  );
});

test('homepage HTML — extract hrefs and pick first valid non-portal URL', () => {
  const single =
    '<a href="https://festival.example.com/info">공식홈페이지</a>';
  assert.equal(
    resolvePublicHomepage('1', single),
    'https://festival.example.com/info',
  );

  const multi =
    '<a href="https://www.seoul.go.kr/">시청</a><br><a href="https://festival.example.com/ticket">티켓</a>';
  assert.equal(
    resolvePublicHomepage('1', multi),
    'https://festival.example.com/ticket',
  );

  assert.equal(
    resolvePublicHomepage('1', 'https://festival.example.com/event'),
    'https://festival.example.com/event',
  );

  assert.equal(
    resolvePublicHomepage('1', '<a href="https://www.busan.go.kr/">부산</a>'),
    null,
  );

  assert.equal(resolvePublicHomepage('1', 'not a url at all <<<'), null);
  assert.deepEqual(
    extractHomepageHrefCandidates(
      '<a href="https://a.example/one">1</a> <a href="https://b.example/two">2</a>',
    ),
    ['https://a.example/one', 'https://b.example/two'],
  );
});

test('homepage resolution — override precedence and hide portal', () => {
  const overrideUrl = HOMEPAGE_OVERRIDES['637693'].url;
  assert.equal(
    resolvePublicHomepage('637693', 'https://www.changwon.go.kr/'),
    overrideUrl,
  );
  assert.equal(resolvePublicHomepage('999999', 'https://www.seoul.go.kr/'), null);
  assert.equal(
    resolvePublicHomepage('999999', 'https://festival.example.com/'),
    'https://festival.example.com/',
  );
  assert.equal(resolvePublicHomepage('999999', 'www.busan.go.kr'), null);
});

test('applyHomepagePolicyToItem strips hidden portal homepage', () => {
  const item = { contentId: '1', homepage: 'https://www.seoul.go.kr/' };
  applyHomepagePolicyToItem(item, '1');
  assert.equal(item.homepage, undefined);
});

test('7-day window selection (KST)', () => {
  const today = kstYmd(new Date('2026-10-19T03:00:00Z'));
  assert.equal(today, '20261019');
  const inFive = addDaysYmd(today, 5);
  const inEight = addDaysYmd(today, 8);
  assert.equal(
    festivalItemWithinIntroWindow(
      { eventStartDate: inFive, eventEndDate: inFive },
      new Date('2026-10-19T03:00:00Z'),
    ),
    true,
  );
  assert.equal(
    festivalItemWithinIntroWindow(
      { eventStartDate: inEight, eventEndDate: inEight },
      new Date('2026-10-19T03:00:00Z'),
    ),
    false,
  );
  assert.equal(
    festivalItemWithinIntroWindow(
      { eventStartDate: '20261001', eventEndDate: '20261025' },
      new Date('2026-10-19T03:00:00Z'),
    ),
    true,
  );
  assert.equal(
    festivalItemWithinIntroWindow(
      { eventStartDate: '20260901', eventEndDate: '20261010' },
      new Date('2026-10-19T03:00:00Z'),
    ),
    false,
  );
});

test('mergeIntroSnippetOntoItem only fills missing fields', () => {
  const item = { contentId: '1', playtime: '09:00' };
  mergeIntroSnippetOntoItem(item, {
    playtime: '10:00',
    usetimefestival: '무료',
  });
  assert.equal(item.playtime, '09:00');
  assert.equal(item.usetimefestival, '무료');
});

test('daily cap constant', () => {
  assert.equal(DETAIL_INTRO_DAILY_CAP, 250);
  assert.equal(FESTIVAL_WINDOW_INTRO_PER_REQUEST, 10);
});

test('cap behaviour — at cap, no more detailIntro calls', () => {
  assert.equal(canMakeDetailIntroCall(249), true);
  assert.equal(canMakeDetailIntroCall(250), false);
  assert.equal(canMakeDetailIntroCall(999), false);
});

test('flag OFF — index gates intro/homepage helpers', () => {
  const indexSrc = readFileSync(
    join(root, 'supabase/functions/tourapi-proxy/index.ts'),
    'utf8',
  );
  assert.match(indexSrc, /function introHomepageFlagOn\(\)/);
  assert.match(indexSrc, /if \(!introHomepageFlagOn\(\)\) return;/);
  assert.match(indexSrc, /introHomepageFlagOn\(\) && typedAction === "detailCommon"/);
  assert.match(indexSrc, /callsThisResponse >= FESTIVAL_WINDOW_INTRO_PER_REQUEST/);
});
