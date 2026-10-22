import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPlaceChatIntroKeys,
  resolvePlaceChatIntroPersistKey,
  placeChatIntroFallbackOnlyKeys,
  withPlaceChatIntroLocale,
} from '../src/pages/Home/lib/placeChatIntro.js';
import {
  buildPlaceChatIntroBareFallbackKeys,
  isBareIntroNameUnambiguous,
  pickBareFallbackIntroFromRows,
} from '../src/pages/Home/lib/placeChatIntroBareFallback.js';

const ACCEPTED_SUMMARY =
  '완도군 상왕봉은 완도8경 제5경으로 해발 644m의 전망 명소입니다. 상황백운홍춘국원과 어우러진 해안 산세가 특징이며 등산객이 즐겨 찾는 대표 봉우리입니다.';

const PROD_COUNTRY_NAME_CASES = [
  {
    label: '경복궁',
    loc: { name: '경복궁', parentCity: '서울', country: '대한민국' },
    countryKey: '대한민국 경복궁',
    parentKey: '서울 경복궁',
  },
  {
    label: '성산일출봉',
    loc: { name: '성산일출봉', parentCity: '서귀포', country: '대한민국' },
    countryKey: '대한민국 성산일출봉',
    parentKey: '서귀포 성산일출봉',
  },
  {
    label: '도톤보리',
    loc: { name: '도톤보리', parentCity: '오사카', country: '일본' },
    countryKey: '일본 도톤보리',
    parentKey: '오사카 도톤보리',
  },
];

for (const { label, loc, countryKey, parentKey } of PROD_COUNTRY_NAME_CASES) {
  test(`ko: ${label} lookup order parentCity then ${countryKey}`, () => {
    const keys = buildPlaceChatIntroKeys(loc, 'ko');
    assert.equal(keys[0], parentKey);
    assert.equal(keys[1], countryKey);
    assert.ok(keys.indexOf(countryKey) === 1, 'country+name is second (right after parentCity)');
  });
}

test('ko: country-prefixed row is found before bare fallback in key list', () => {
  for (const { loc, countryKey } of PROD_COUNTRY_NAME_CASES) {
    const keys = buildPlaceChatIntroKeys(loc, 'ko');
    const bare = buildPlaceChatIntroBareFallbackKeys(loc, 'ko');
    assert.ok(keys.includes(countryKey));
    assert.ok(!bare.includes(countryKey));
  }
});

for (const { label, loc, countryKey, parentKey } of PROD_COUNTRY_NAME_CASES) {
  test(`en: ${label} same order with @en storage on country key`, () => {
    const enLoc = {
      ...loc,
      name_en:
        label === '경복궁'
          ? 'Gyeongbokgung Palace'
          : label === '성산일출봉'
            ? 'Seongsan Ilchulbong'
            : 'Dotonbori',
      country_en:
        loc.country === '일본' ? 'Japan' : 'South Korea',
    };
    const keys = buildPlaceChatIntroKeys(enLoc, 'en');
    assert.ok(keys[0].includes(parentKey.split(' ')[0]) || keys[0].length > 0);
    const countryIdx = keys.findIndex((k) => k.includes('Japan') || k.includes('South Korea'));
    assert.ok(countryIdx >= 1, `${label} en country+name key present after parent`);
    assert.equal(withPlaceChatIntroLocale(keys[countryIdx], 'en'), `${keys[countryIdx]}@en`);
  });
}

test('bare name matches only when exactly one logical row exists', () => {
  const ambiguous = [
    { destination_key: '완도 상왕봉', summary: ACCEPTED_SUMMARY },
    { destination_key: '가야산 상왕봉', summary: ACCEPTED_SUMMARY },
  ];
  assert.equal(isBareIntroNameUnambiguous(ambiguous, '상왕봉'), false);
  assert.equal(pickBareFallbackIntroFromRows(ambiguous, '상왕봉', 'ko'), null);

  const unique = [{ destination_key: '국화섬', summary: ACCEPTED_SUMMARY }];
  assert.equal(isBareIntroNameUnambiguous(unique, '국화섬'), true);
  assert.equal(pickBareFallbackIntroFromRows(unique, '국화섬', 'ko')?.logicalKey, '국화섬');
});

test('persist/upsert never targets fallback-only keys (parentCity spots)', () => {
  for (const { loc, countryKey } of PROD_COUNTRY_NAME_CASES) {
    const persistKey = resolvePlaceChatIntroPersistKey(loc, 'ko');
    const blocked = placeChatIntroFallbackOnlyKeys(loc, 'ko');
    assert.ok(persistKey);
    assert.ok(!blocked.includes(persistKey));
    assert.ok(blocked.includes(countryKey), 'country+name is lookup-only for persist');
    assert.equal(persistKey, buildPlaceChatIntroKeys(loc, 'ko')[0]);
    assert.notEqual(persistKey, countryKey);
  }
  const wando = { name: '상왕봉', parentCity: '완도', country: '대한민국' };
  const persist = resolvePlaceChatIntroPersistKey(wando, 'ko');
  assert.equal(persist, '완도 상왕봉');
  for (const k of placeChatIntroFallbackOnlyKeys(wando, 'ko')) {
    assert.notEqual(persist, k);
  }
});
