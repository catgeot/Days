import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  festivalRestaurantRowsReadyForMooni,
  waitForFestivalRestaurantNames,
  beginFestivalRestaurantLoad,
  resetFestivalRestaurantLoad,
} from '../../src/pages/Korea/lib/festivalRestaurantLoad.js';
import { polishFestivalModelReply } from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import { buildFestivalAccessAskText } from '../../src/pages/Home/lib/festivalDomesticOrigins.js';
import { KO } from '../../src/i18n/mooniPromptBundleData.js';

test('festival sights, access, and food chip prompts avoid prohibition-style Korean', () => {
  const blob = [
    KO.chips.festival_sights.rules.join('\n'),
    KO.chips.festival_access.rules.join('\n'),
    KO.chips.festival_nearby.rules.join('\n'),
  ].join('\n');
  assert.doesNotMatch(blob, /금지/);
  assert.doesNotMatch(blob, /하지\s*마/);
  assert.match(KO.chips.festival_nearby.rules.join('\n'), /TourAPI/);
});

test('restaurant rows without distance are not mooni-ready', () => {
  assert.equal(festivalRestaurantRowsReadyForMooni([]), false);
  assert.equal(
    festivalRestaurantRowsReadyForMooni([{ name: '만동제과' }, { name: '월화엔' }]),
    false,
  );
  assert.equal(
    festivalRestaurantRowsReadyForMooni([
      { name: '만동제과', distKm: 0.1 },
      { name: '월화엔', distKm: 0.2 },
      { name: '배니닭강정', distKm: 0.5 },
    ]),
    true,
  );
});

test('waitForFestivalRestaurantNames waits when only name stubs exist', async () => {
  resetFestivalRestaurantLoad('999001');
  beginFestivalRestaurantLoad('999001', Promise.resolve({
    spots: [
      { name: '만동제과', distKm: 0.1 },
      { name: '월화엔', distKm: 0.24 },
      { name: '이쉐프의돈까스', distKm: 0.2 },
    ],
  }));
  const waited = await waitForFestivalRestaurantNames('999001', {
    names: [{ name: '만동제과' }, { name: '월화엔' }],
    timeoutMs: 2000,
  });
  assert.equal(waited.length, 3);
  assert.equal(waited[0].name, '만동제과');
  assert.equal(waited[0].distKm, 0.1);
  resetFestivalRestaurantLoad('999001');
});

test('sights chip drops decorative closing lines', () => {
  const raw = [
    '월화거리에서 국수존과 페어링존이 열려요.',
    '장칼국수 체험 부스가 오후까지 이어져요.',
    '현장의 활기를 함께 즐겨보세요.',
  ].join(' ');
  const polished = polishFestivalModelReply(raw, {
    contentId: '2930716',
    chipId: 'festival_sights',
    locale: 'ko',
    userText: '볼거리·분위기 알려 줘',
  });
  assert.match(polished, /국수존/);
  assert.doesNotMatch(polished, /즐겨보세요/);
});

test('food answer strips shop names not in TourAPI nearby list', () => {
  const polished = polishFestivalModelReply(
    '근처에는 만동제과와 해랑초밥, 육회비빔밥집이 있어요.',
    {
      contentId: '2930716',
      chipId: 'festival_nearby',
      locale: 'ko',
      userText: '근처 맛집 추천해 줘',
      nearbyRestaurants: [
        { name: '만동제과', distKm: 0.1, cat3: 'A05020300' },
        { name: '이쉐프의돈까스', distKm: 0.2, cat3: 'A05020400' },
      ],
    },
  );
  assert.match(polished, /만동제과/);
  assert.doesNotMatch(polished, /해랑초밥|육회비빔밥/);
});

test('food answer drops unasked parking tail and keeps shop names', () => {
  const polished = polishFestivalModelReply(
    '근처에서 만동제과와 이쉐프의돈까스를 추천해요. 축제장 앞 공영주차장을 이용하면 편해요.',
    {
      contentId: '2930716',
      locale: 'ko',
      userText: '근처 맛집 추천해 줘',
      nearbyRestaurants: [
        { name: '만동제과', distKm: 0.1, cat3: 'A05020300' },
        { name: '이쉐프의돈까스', distKm: 0.2, cat3: 'A05020400' },
        { name: '100년임당방앗간', distKm: 0.3, cat3: 'A05020500' },
      ],
    },
  );
  assert.match(polished, /만동제과/);
  assert.match(polished, /이쉐프의돈까스/);
  assert.doesNotMatch(polished, /주차|공영주차/);
});

test('access polish dedupes repeated route sentences for every origin', () => {
  const duplicate = '서울역에서 KTX를 타고 강릉역까지 가요.';
  const raw = [
    duplicate,
    duplicate,
    '강릉역에서 월화거리까지는 택시나 버스로 이어가면 돼요.',
  ].join(' ');
  const polished = polishFestivalModelReply(raw, {
    contentId: '2930716',
    chipId: 'festival_access',
    locale: 'ko',
    userText: buildFestivalAccessAskText('seoul', 'ko'),
    departureOriginId: 'seoul',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
  });
  assert.equal((polished.match(/서울역에서 KTX를 타고 강릉역까지 가요/g) || []).length, 1);
  assert.match(polished, /월화거리/);
});
