import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKoreaOriginCities } from '../generate-korea-origin-cities.mjs';
import {
  KOREA_ORIGIN_CITIES,
  suggestKoreaOriginCities,
} from '../../src/pages/Home/lib/koreaOriginCityMatch.js';
import {
  FESTIVAL_DOMESTIC_ORIGINS,
  domesticFestivalGroundOrigin,
  domesticGroundModelSuffix,
} from '../../src/pages/Home/lib/festivalDomesticOrigins.js';
import { tryOriginKeyboardConfirm } from '../../src/pages/Home/lib/festivalOriginConfirm.js';
import { createMooniSendGate } from '../../src/pages/Korea/lib/festivalTransportCardCore.js';
import {
  GeminiProxyError,
  classifyGeminiProxyFailure,
  mooniConversationErrorMessage,
} from '../../src/pages/Home/lib/geminiProxyError.js';
import { isGateoMooniOriginInputEnabled } from '../../src/shared/gateoFeatureFlags.js';
import { resolveMooniChatKoreaFestivalHint } from '../../src/shared/korea/mooniKoreaFestivalReplyPolish.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function ids(query) {
  return suggestKoreaOriginCities(query).cities.map((city) => city.id);
}

test('origin dictionary is the committed 167 si and gun list', () => {
  const generator = readFileSync(join(root, 'scripts/generate-korea-origin-cities.mjs'), 'utf8');
  assert.doesNotMatch(generator, /\bfetch\s*\(/);
  const hubs = JSON.parse(readFileSync(join(root, 'src/pages/Home/data/cityAttractionHubs.json'), 'utf8'));
  assert.deepEqual(buildKoreaOriginCities(hubs), KOREA_ORIGIN_CITIES);
  assert.equal(KOREA_ORIGIN_CITIES.length, 167);
  assert.equal(new Set(KOREA_ORIGIN_CITIES.map((city) => city.id)).size, 167);
  assert.equal(KOREA_ORIGIN_CITIES.find((city) => city.id === 'gunwi')?.province, '대구');
  assert.equal(KOREA_ORIGIN_CITIES.some((city) => /독도/.test(city.ko)), false);
  assert.equal(FESTIVAL_DOMESTIC_ORIGINS.length, 17);
});

test('chuncheon matches admin name, english, choseong, and a one-jamo typo', () => {
  for (const query of ['춘천시', 'Chuncheon', 'chuncheon']) {
    const hit = suggestKoreaOriginCities(query);
    assert.deepEqual(ids(query), ['chuncheon']);
    assert.equal(hit.confirmOnEnter, true);
  }
  const choseong = suggestKoreaOriginCities('ㅊㅊ');
  assert.deepEqual(ids('ㅊㅊ'), ['chuncheon']);
  assert.equal(choseong.kind, 'choseong');
  assert.equal(choseong.confirmOnEnter, false);
  const typo = suggestKoreaOriginCities('춘전');
  assert.deepEqual(ids('춘전'), ['chuncheon']);
  assert.equal(typo.kind, 'typo');
  assert.equal(typo.confirmOnEnter, false);
  const miss = suggestKoreaOriginCities('ㅊㅁ');
  assert.equal(miss.kind, 'choseong');
  assert.deepEqual(miss.cities, []);
  assert.equal(miss.confirmOnEnter, false);
  assert.equal(miss.askRaw, '');
});

test('homonyms stay two rows and a gu name is not a city', () => {
  assert.deepEqual(ids('광주').sort(), ['gwangju', 'gwangju-si']);
  assert.equal(suggestKoreaOriginCities('광주').confirmOnEnter, false);
  assert.deepEqual(ids('광주광역시'), ['gwangju']);
  assert.deepEqual(ids('광주시'), ['gwangju-si']);
  assert.deepEqual(ids('경기 광주'), ['gwangju-si']);
  assert.deepEqual(ids('고성').sort(), ['goseong-gn', 'goseong-gw']);
  assert.deepEqual(ids('경남 고성'), ['goseong-gn']);
  assert.deepEqual(ids('Gwangju, Gyeonggi'), ['gwangju-si']);
  assert.deepEqual(ids('Goseong, Gangwon'), ['goseong-gw']);
  assert.deepEqual(ids('Goseong, Gyeongnam'), ['goseong-gn']);
  assert.equal(suggestKoreaOriginCities('중구').kind, 'gu');
  assert.deepEqual(ids('양구'), ['yanggu']);
  const outside = suggestKoreaOriginCities('파리');
  assert.equal(outside.kind, 'missing');
  assert.equal(outside.askRaw, '파리');
  assert.equal(outside.confirmOnEnter, false);
  assert.equal(suggestKoreaOriginCities('ㄱ').kind, 'choseong');
  assert.equal(suggestKoreaOriginCities('ㄱ').askRaw, '');
});

test('dictionary cities do not borrow a chip station sentence', () => {
  const chuncheon = domesticFestivalGroundOrigin('춘천에서 이 축제장까지', '춘천');
  assert.equal(chuncheon?.dictionaryOnly, true);
  assert.equal(chuncheon?.ko, '춘천');
  assert.equal(domesticGroundModelSuffix(chuncheon, 'ko'), '출발 지역은 춘천(강원).');
  assert.doesNotMatch(domesticGroundModelSuffix(chuncheon, 'ko'), /KTX|터미널|역에서/);
  const gyeonggiGwangju = domesticFestivalGroundOrigin('', '경기 광주');
  assert.equal(gyeonggiGwangju?.id, 'gwangju-si');
  assert.equal(gyeonggiGwangju?.dictionaryOnly, true);
  const metro = domesticFestivalGroundOrigin('광주에서 이 축제장까지', '광주');
  assert.equal(metro?.id, 'gwangju');
  assert.equal(metro?.dictionaryOnly, undefined);
  assert.equal(domesticFestivalGroundOrigin('서울에서 비행기로', '서울'), null);
});

test('choseong and composition cannot confirm, and a second tap is dropped', () => {
  const city = KOREA_ORIGIN_CITIES.find((row) => row.id === 'chuncheon');
  let sends = 0;
  const choseong = suggestKoreaOriginCities('ㅊㅊ');
  assert.equal(tryOriginKeyboardConfirm({
    composing: false,
    key: 'Enter',
    suggestion: choseong,
    send: () => {
      sends += 1;
    },
  }), false);
  assert.equal(sends, 0);
  assert.equal(tryOriginKeyboardConfirm({
    composing: true,
    key: 'Enter',
    suggestion: { confirmOnEnter: true, cities: [city] },
    send: () => {
      sends += 1;
    },
  }), false);
  assert.equal(sends, 0);
  assert.equal(tryOriginKeyboardConfirm({
    composing: false,
    key: 'Enter',
    suggestion: { confirmOnEnter: true, cities: [city] },
    send: () => {
      sends += 1;
    },
  }), true);
  assert.equal(sends, 1);
  const gate = createMooniSendGate();
  assert.equal(gate.tryBegin(), true);
  assert.equal(gate.tryBegin(), false);
  gate.end();
  assert.equal(gate.tryBegin(), true);
});

test('a code-less 429 stays quota in classify and reads as 질문이 잠시 몰렸어요 in Mooni', () => {
  const classified = classifyGeminiProxyFailure({ httpStatus: 429, data: {} });
  assert.equal(classified.kind, 'quota');
  assert.equal(classified.errorCode, undefined);
  const err = new GeminiProxyError(classified);
  assert.match(mooniConversationErrorMessage(err, 'ko'), /질문이 잠시 몰렸어요/);
  globalThis.__VITE_ENV__ = { VITE_GATEO_MOONI_ORIGIN_INPUT: '0' };
  assert.equal(isGateoMooniOriginInputEnabled(), false);
  globalThis.__VITE_ENV__ = { VITE_GATEO_MOONI_ORIGIN_INPUT: 'false' };
  assert.equal(isGateoMooniOriginInputEnabled(), true);
  delete globalThis.__VITE_ENV__;
  assert.equal(isGateoMooniOriginInputEnabled(), true);
});

test('chuncheon hint names the area and the timetable links, not a borrowed station', async () => {
  const { hint } = await resolveMooniChatKoreaFestivalHint({
    chipId: 'festival_access',
    userText: '춘천에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘',
    departureLabel: '춘천',
    locale: 'ko',
    festivalContext: {
      contentId: '2989642',
      title: '테스트 축제',
      venue: '축제장',
      address: '강원특별자치도 춘천시',
      eventStartDate: '20261101',
      eventEndDate: '20261103',
      transport: { origins: [], selected: { segments: [] } },
    },
  });
  assert.match(hint, /출발 지역은 춘천\(강원\)/);
  assert.match(hint, /letskorail\.com/);
  assert.match(hint, /bustago\.or\.kr/);
  assert.doesNotMatch(hint, /위 출발 역·터미널/);
  assert.doesNotMatch(hint, /강릉역에서 출발/);
});
