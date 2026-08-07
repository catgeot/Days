/**
 * MRT 패키지 딥링크·테마 해석 스모크 (목록 API 없음).
 *   node scripts/smoke-mrt-package-links.mjs
 */
import assert from 'node:assert/strict';
import {
  buildMrtPkcHomeUrl,
  buildMrtPkcSearchUrl,
  buildMrtPkcPromotionGroupUrl,
  buildMrtPkcRegionCategoryUrl,
  buildMrtPkcUrlForLocation,
  formatMrtPackageProductCtaLabel,
  resolveMrtPackageThemeHref,
  resolveMrtPackageThemeForLocation,
} from '../src/utils/mrtPackageLinks.js';
import {
  canShowMrtPackageStrip,
  resolveMrtPackageSearchKeyword,
  resolveMrtPackageThemeKey,
} from '../src/utils/mrtPackageQuery.js';
import {
  KOREA_THEME_PACKAGE_KEYS,
  MRT_HOME_MYLINK_ID,
} from '../src/pages/Home/data/mrtPackageThemeLinks.js';
import { listKoreaThemePackageCtas } from '../src/pages/Home/lib/koreaThemePackages.js';

function mustIncludeMylink(url) {
  const u = new URL(url);
  assert.equal(u.searchParams.get('mylink_id'), MRT_HOME_MYLINK_ID);
  assert.equal(u.searchParams.get('utm_source'), 'mktpartner');
}

const home = buildMrtPkcHomeUrl();
assert.match(home, /myrealtrip\.com\/pkc/);
mustIncludeMylink(home);

const search = buildMrtPkcSearchUrl('다낭');
assert.match(search, /pkc\/search\?q=/);
assert.ok(decodeURIComponent(search).includes('다낭'));
mustIncludeMylink(search);

const promo = buildMrtPkcPromotionGroupUrl('5');
assert.match(promo, /promotionGroupId=5/);
mustIncludeMylink(promo);

const japan = resolveMrtPackageThemeHref('japan');
assert.ok(japan);
assert.match(japan.url, /q=%EC%9D%BC%EB%B3%B8|q=일본/);
assert.equal(japan.ctaLabel, '일본 패키지');
mustIncludeMylink(japan.url);

const tokyo = {
  name: '도쿄',
  name_en: 'Tokyo',
  country: '일본',
  country_en: 'Japan',
  slug: 'tokyo',
};
assert.equal(resolveMrtPackageThemeKey(tokyo), 'japan');
assert.equal(resolveMrtPackageSearchKeyword(tokyo), '도쿄');
assert.equal(canShowMrtPackageStrip(tokyo), true);
const theme = resolveMrtPackageThemeForLocation(tokyo);
assert.ok(theme?.url.includes('pkc'));
const placeUrl = buildMrtPkcUrlForLocation(tokyo);
assert.ok(decodeURIComponent(placeUrl).includes('도쿄'));

const seoul = {
  name: '서울',
  country: '한국',
  country_en: 'South Korea',
  slug: 'seoul',
};
assert.equal(canShowMrtPackageStrip(seoul), true);

const unknownDomestic = {
  name: '대화리',
  country: '한국',
  slug: 'daehwari',
};
assert.equal(canShowMrtPackageStrip(unknownDomestic), false);

assert.equal(formatMrtPackageProductCtaLabel('더블린'), '더블린 패키지 상품보기');
assert.equal(formatMrtPackageProductCtaLabel(''), '패키지 상품보기');

const koreaJeju = resolveMrtPackageThemeHref('koreaJeju');
assert.ok(koreaJeju);
assert.match(decodeURIComponent(koreaJeju.url), /q=제주/);
assert.equal(koreaJeju.ctaLabel, '제주 패키지');
mustIncludeMylink(koreaJeju.url);

const koreaHome = resolveMrtPackageThemeHref('koreaHome');
assert.ok(koreaHome);
assert.match(koreaHome.url, /myrealtrip\.com\/pkc/);
assert.ok(!koreaHome.url.includes('/search'));
assert.equal(koreaHome.ctaLabel, 'MRT 패키지 둘러보기');
mustIncludeMylink(koreaHome.url);

assert.equal(resolveMrtPackageThemeHref('koreaGyeongju'), null);
assert.equal(resolveMrtPackageThemeHref('busan'), null);

const expectedSearch = {
  koreaJeju: '제주',
  koreaYeosu: '여수',
  koreaUlleungdo: '울릉도',
  koreaSuncheon: '순천',
  koreaHongdo: '홍도',
  koreaBaengnyeong: '백령도',
};
for (const [key, q] of Object.entries(expectedSearch)) {
  const resolved = resolveMrtPackageThemeHref(key);
  assert.ok(resolved, key);
  assert.match(decodeURIComponent(resolved.url), new RegExp(`q=${q}`));
  mustIncludeMylink(resolved.url);
}

const koreaGangwon = resolveMrtPackageThemeHref('koreaGangwon');
assert.ok(koreaGangwon);
assert.match(koreaGangwon.url, /regionCategoryCode=GANGWONDO/);
assert.equal(koreaGangwon.ctaLabel, '강원 패키지');
mustIncludeMylink(koreaGangwon.url);
assert.match(
  buildMrtPkcRegionCategoryUrl('GANGWONDO'),
  /regionCategoryCode=GANGWONDO/,
);

const koreaCtas = listKoreaThemePackageCtas();
assert.equal(koreaCtas.length, KOREA_THEME_PACKAGE_KEYS.length);
assert.deepEqual(
  koreaCtas.map((c) => c.key),
  [...KOREA_THEME_PACKAGE_KEYS]
);
assert.ok(koreaCtas.every((c) => c.key !== 'koreaGyeongju'));
assert.ok(!koreaCtas.some((c) => /경주|부산/.test(c.ctaLabel)));
for (const cta of koreaCtas) {
  mustIncludeMylink(cta.url);
  assert.ok(cta.ctaLabel);
}

if (process.env.MRT_PACKAGE_LIVE === '1') {
  const API = 'https://api3.myrealtrip.com/pkc/api/v1/products/search';
  const liveCases = [
    ...Object.entries(expectedSearch).map(([key, q]) => ({ key, params: { q } })),
    { key: 'koreaGangwon', params: { regionCategoryCode: 'GANGWONDO' } },
  ];
  for (const { key, params } of liveCases) {
    const url = new URL(API);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set('page', '1');
    url.searchParams.set('per', '5');
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Origin: 'https://www.myrealtrip.com',
        Referer: 'https://www.myrealtrip.com/pkc/search',
      },
    });
    assert.equal(res.ok, true, `LIVE ${key} HTTP`);
    const json = await res.json();
    const total = Number(json?.data?.totalCount || 0);
    assert.ok(total > 0, `LIVE ${key} totalCount>0 (got ${total})`);
  }
  console.log('smoke-mrt-package-links LIVE curated qs: PASS');
}

console.log('smoke-mrt-package-links: PASS');
