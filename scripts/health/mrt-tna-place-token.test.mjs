import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterRelevantMrtTnas,
  scoreMrtTnaItemRelevance,
  scoreMrtTnaRelevance,
} from '../../src/utils/mrtTnaRelevance.js';

const KOREA = { country: '대한민국', country_en: 'South Korea', name: '마포' };

test('마포 does not match 마포우리카', () => {
  assert.equal(scoreMrtTnaRelevance('마포우리카 (Lake Mapourika)', '마포'), 0);
  assert.equal(
    scoreMrtTnaItemRelevance(
      { itemName: '마포우리카 (Lake Mapourika) 프란츠 요제프' },
      '마포',
      KOREA,
    ),
    0,
  );
});

test('마포 matches a bounded Mapo place and a bracket tag', () => {
  assert.ok(scoreMrtTnaRelevance('마포구 망원 한강 야경', '마포') > 0);
  assert.ok(scoreMrtTnaRelevance('[마포] 한강 러닝', '마포') > 0);
  assert.ok(scoreMrtTnaRelevance('제주도 해녀 체험', '제주') > 0);
});

test('short names do not match a longer different place', () => {
  assert.equal(scoreMrtTnaRelevance('서귀포 올레길', '서귀'), 0);
  assert.equal(scoreMrtTnaRelevance('인어공주 체험', '공주'), 0);
  assert.equal(scoreMrtTnaRelevance('남원우리 마을', '남원'), 0);
  assert.ok(scoreMrtTnaRelevance('남원시 광한루', '남원') > 0);
});

test('a Korea festival drops an explicit overseas country product', () => {
  const items = filterRelevantMrtTnas(
    [
      { itemName: '뉴질랜드 마포 한인 투어', itemDesc: 'New Zealand' },
      { itemName: '[마포] 한강 야경 러닝' },
    ],
    '마포',
    KOREA,
  );
  assert.deepEqual(
    items.map((item) => item.itemName),
    ['[마포] 한강 야경 러닝'],
  );
});

test('glued county tags still match', () => {
  assert.ok(scoreMrtTnaRelevance('[경북영양] 음식디미방', '영양') > 0);
  assert.ok(scoreMrtTnaRelevance('[경북/영양] 벌건공방', '영양') > 0);
  assert.equal(scoreMrtTnaRelevance('연기체험 공연 티켓', '연기'), 0);
});
