import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPlaceChatIntroKeys,
  withPlaceChatIntroLocale,
} from '../src/pages/Home/lib/placeChatIntro.js';

test('완도 상왕봉 is looked up before the bare 상왕봉 key that also matches 가야산', () => {
  const wando = buildPlaceChatIntroKeys(
    { name: '상왕봉', parentCity: '완도', country: '대한민국' },
    'ko',
  );
  const gayasan = buildPlaceChatIntroKeys(
    { name: '상왕봉', parentCity: '가야산', country: '대한민국' },
    'ko',
  );

  assert.deepEqual(wando, ['완도 상왕봉', '대한민국 상왕봉']);
  assert.deepEqual(gayasan, ['가야산 상왕봉', '대한민국 상왕봉']);
  assert.equal(wando.includes('상왕봉'), false);
  assert.equal(gayasan.includes('상왕봉'), false);
  assert.equal(wando[0], '완도 상왕봉');
  assert.equal(wando[1], '대한민국 상왕봉');
  assert.equal(wando.includes('가야산 상왕봉'), false);
  assert.equal(gayasan.includes('완도 상왕봉'), false);
});

test('places without parentCity keep the country-then-name key order', () => {
  const keys = buildPlaceChatIntroKeys({ name: '상왕봉', country: '대한민국' }, 'ko');
  assert.deepEqual(keys, ['대한민국 상왕봉', '상왕봉']);
});

test('parentCity then country-prefixed name reuses PROD rows (e.g. 경복궁)', () => {
  const keys = buildPlaceChatIntroKeys(
    { name: '경복궁', parentCity: '서울', country: '대한민국' },
    'ko',
  );
  assert.deepEqual(keys, ['서울 경복궁', '대한민국 경복궁']);
  assert.equal(withPlaceChatIntroLocale(keys[1], 'ko'), '대한민국 경복궁');
});

test('en locale uses @en storage for country-prefixed key (Gyeongbokgung)', () => {
  const keys = buildPlaceChatIntroKeys(
    {
      name: '경복궁',
      name_en: 'Gyeongbokgung Palace',
      parentCity: '서울',
      country: '대한민국',
      country_en: 'South Korea',
    },
    'en',
  );
  assert.deepEqual(keys, ['서울 Gyeongbokgung Palace', 'South Korea Gyeongbokgung Palace']);
  assert.equal(
    withPlaceChatIntroLocale(keys[1], 'en'),
    'South Korea Gyeongbokgung Palace@en',
  );
});

test('mapbox settlement 강릉 교동: lookup key is only 강릉 교동 (ops destination_key)', () => {
  const gangneungGyodong = {
    id: 'settlement-gangneung-gyo-dong',
    hubId: 'gangneung',
    name: '교동',
    parentCity: '강릉',
    country: '대한민국',
  };
  assert.deepEqual(buildPlaceChatIntroKeys(gangneungGyodong, 'ko'), ['강릉 교동']);
});

test('강화 교동 (non-settlement): country-prefixed 대한민국 교동 still in key list', () => {
  const ganghwaGyodong = { name: '교동', parentCity: '강화', country: '대한민국' };
  const keys = buildPlaceChatIntroKeys(ganghwaGyodong, 'ko');
  assert.equal(keys[0], '강화 교동');
  assert.equal(keys[1], '대한민국 교동');
});
