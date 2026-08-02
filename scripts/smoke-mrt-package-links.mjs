/**
 * MRT 패키지 딥링크·테마 해석 스모크 (목록 API 없음).
 *   node scripts/smoke-mrt-package-links.mjs
 */
import assert from 'node:assert/strict';
import {
  buildMrtPkcHomeUrl,
  buildMrtPkcSearchUrl,
  buildMrtPkcPromotionGroupUrl,
  buildMrtPkcUrlForLocation,
  resolveMrtPackageThemeHref,
  resolveMrtPackageThemeForLocation,
} from '../src/utils/mrtPackageLinks.js';
import {
  canShowMrtPackageStrip,
  resolveMrtPackageSearchKeyword,
  resolveMrtPackageThemeKey,
} from '../src/utils/mrtPackageQuery.js';
import { MRT_HOME_MYLINK_ID } from '../src/pages/Home/data/mrtPackageThemeLinks.js';

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

console.log('smoke-mrt-package-links: PASS');
