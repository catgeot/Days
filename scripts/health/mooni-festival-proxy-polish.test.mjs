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
