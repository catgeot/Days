import assert from 'node:assert/strict';
import { test } from 'node:test';
import { repairGeminiReplacementChars } from '../../supabase/functions/_shared/gemini/answerSanitize.mjs';
import { polishMooniFestivalProxyText, parseFestivalPolishParams } from '../../supabase/functions/_shared/gemini/festivalMooniProxyPolish.mjs';
import {
  polishFestivalModelReply,
  stripTrailingBracketChipHeaders,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';

const SHOPS = [
  { name: '만동제과', distKm: 0.1, cat3: 'A05020300' },
  { name: '이쉐프의돈까스', distKm: 0.2, cat3: 'A05020400' },
];

test('parseFestivalPolishParams accepts nearby restaurant rows', () => {
  const parsed = parseFestivalPolishParams({
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '근처 맛집',
    contentId: '1998564',
    nearbyRestaurants: SHOPS,
    referenceYmd: '20261017',
  });
  assert.equal(parsed?.chipId, 'festival_nearby');
  assert.equal(parsed?.nearbyRestaurants?.length, 2);
});

test('proxy polish drops invented food names from model output', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '근처 맛집 추천해 줘',
    contentId: '1998564',
    nearbyRestaurants: SHOPS,
  });
  const raw = '궁중문화축제 근처에는 체부동잔치집, 토속촌삼계탕, 광화문국밥이 있어요.';
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /체부동|토속촌|광화문국밥/);
  assert.match(out, /만동제과|이쉐프의돈까스/);
});

test('proxy polish strips parking tail on food chip', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '근처 맛집',
    contentId: '2930716',
    nearbyRestaurants: SHOPS,
  });
  const raw = '만동제과가 가까워요. 축제장 운영 시간이나 주차 정보는 [공식 홈페이지](https://example.com)에서 확인해요.';
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /주차|운영\s*시간/);
});

test('stripTrailingBracketChipHeaders removes empty access section labels', () => {
  const raw = '서울역에서 KTX를 타고 강릉역까지 가요.\n\n[교통 · 티켓] [출발 전 준비]';
  const out = stripTrailingBracketChipHeaders(polishFestivalModelReply(raw, {
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '2930716',
  }));
  assert.match(out, /강릉역/);
  assert.doesNotMatch(out, /\[교통|출발\s*전\s*준비/);
});

test('repairGeminiReplacementChars fixes split 라이브 artifact', () => {
  const broken = `부산 불꽃${'\uFFFD\uFFFD\uFFFD'}이브가 열려요`;
  assert.equal(repairGeminiReplacementChars(broken), '부산 불꽃라이브가 열려요');
});

test('access polish does not append booking footer when korail and bus links exist', () => {
  const raw = [
    '서울에서 KTX로 강릉역까지 가요.',
    '[코레일](https://www.letskorail.com/)과 [고속버스](https://www.kobus.co.kr/)에서 시각을 확인할 수 있어요.',
  ].join(' ');
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '2930716',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.doesNotMatch(out, /열차·버스 시각은/);
});

test('access polish does not re-append 행사 기간 when dates already in body', () => {
  const raw = '강릉역까지 가요. 행사는 10/15~18이에요. [축제 페이지](https://www.gateo.kr/korea/?festival=2930716)에서 볼 수 있어요.';
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '2930716',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.equal((out.match(/행사 기간은 10\/15~18/g) || []).length, 0);
});

test('food fallback uses natural 이/가 있어요', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '맛집',
    contentId: '2930716',
    nearbyRestaurants: [
      { name: '강릉 오금집', distKm: 0.3, cat3: 'A05020100' },
      { name: '만동제과', distKm: 0.1, cat3: 'A05020300' },
      { name: '이쉐프의돈까스', distKm: 0.2, cat3: 'A05020400' },
    ],
  });
  const out = polishMooniFestivalProxyText('맛집을 찾아보세요.', polish);
  assert.match(out, /가까운 곳으로는.*만동제과.*[가이] .*있어요/);
  assert.match(out, /돈까스|돈가스/);
  assert.match(out, /도 있어요/);
  assert.doesNotMatch(out, /\]예요/);
  assert.doesNotMatch(out, /있어요,\s*돈가스인/);
});

test('access polish keeps one timetable pointer when body already mentions korail times', () => {
  const raw = [
    '부산에서 KTX로 오면 편해요.',
    '열차 시간과 요금은 [코레일](https://www.letskorail.com/)에서 확인할 수 있어요.',
  ].join(' ');
  const polish = parseFestivalPolishParams({
    chipId: 'festival_access',
    locale: 'ko',
    userText: '가는 법',
    contentId: '2855626',
    eventStartDate: '20261010',
    eventEndDate: '20261019',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText(raw, polish);
  assert.match(out, /열차\s*시간과\s*요금/);
  assert.doesNotMatch(out, /열차·버스\s*시각은/);
});

test('sights polish gives festival subject to leading date sentence', () => {
  const polish = parseFestivalPolishParams({
    chipId: 'festival_sights',
    locale: 'ko',
    userText: '볼거리',
    contentId: '2930716',
    festivalTitle: '강릉 국수 축제',
    nearbyRestaurants: [],
  });
  const out = polishMooniFestivalProxyText('10/15~18이에요. 국수 거리가 펼쳐져요.', polish, {
    chipId: 'festival_sights',
    festivalTitle: '강릉 국수 축제',
  });
  assert.match(out, /^강릉 국수 축제(?:은|는) 10\/15~18이에요/);
});

test('proxy baseline without festivalPolish strips food parking tail', () => {
  const raw = '근처 식당이 있어요. 축제장 운영 시간이나 주차 정보는 [공식 홈페이지](https://example.com)에서 확인해요.';
  const out = polishMooniFestivalProxyText(raw, null, {
    chipId: 'festival_nearby',
    locale: 'ko',
    userText: '맛집',
  });
  assert.doesNotMatch(out, /주차|운영\s*시간/);
});

test('proxy baseline removes 둘러보세요 page closer', () => {
  const raw = '[강릉 국수 축제 페이지](https://www.gateo.kr/korea/?festival=2930716)에서 둘러보세요.';
  const out = polishMooniFestivalProxyText(raw, null, {
    chipId: 'festival_sights',
    locale: 'ko',
    festivalTitle: '강릉 국수 축제',
  });
  assert.doesNotMatch(out, /둘러\s*보세요/);
});
