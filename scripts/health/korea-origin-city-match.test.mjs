import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKoreaOriginCities } from '../generate-korea-origin-cities.mjs';
import {
  KOREA_ORIGIN_CITIES,
  koreaOriginOptionLabel,
  suggestKoreaOriginCities,
} from '../../src/pages/Home/lib/koreaOriginCityMatch.js';
import {
  FESTIVAL_DOMESTIC_ORIGINS,
  domesticFestivalGroundOrigin,
  domesticGroundModelSuffix,
} from '../../src/pages/Home/lib/festivalDomesticOrigins.js';
import { shouldResendPinnedOrigin, tryOriginKeyboardConfirm } from '../../src/pages/Home/lib/festivalOriginConfirm.js';
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

test('same-name metros and Jeju are not labeled with the name twice', () => {
  const expected = {
    seoul: ['서울 · 특별시', 'Seoul · Special City'],
    busan: ['부산 · 광역시', 'Busan · Metropolitan City'],
    daegu: ['대구 · 광역시', 'Daegu · Metropolitan City'],
    incheon: ['인천 · 광역시', 'Incheon · Metropolitan City'],
    gwangju: ['광주 · 광역시', 'Gwangju · Metropolitan City'],
    daejeon: ['대전 · 광역시', 'Daejeon · Metropolitan City'],
    ulsan: ['울산 · 광역시', 'Ulsan · Metropolitan City'],
    sejong: ['세종 · 특별자치시', 'Sejong · Special Self-Governing City'],
    jeju: ['제주 · 특별자치도', 'Jeju City · Special Self-Governing Province'],
  };
  const sameName = KOREA_ORIGIN_CITIES.filter((city) => city.ko === city.province).map((city) => city.id).sort();
  assert.deepEqual(sameName, Object.keys(expected).sort());
  for (const [id, [ko, en]] of Object.entries(expected)) {
    const city = KOREA_ORIGIN_CITIES.find((row) => row.id === id);
    assert.equal(koreaOriginOptionLabel(city, 'ko'), ko);
    assert.equal(koreaOriginOptionLabel(city, 'en'), en);
    assert.notEqual(ko.split(' · ')[0], ko.split(' · ')[1]);
    assert.notEqual(en.split(' · ')[0], en.split(' · ')[1]);
  }
  const gyeonggi = KOREA_ORIGIN_CITIES.find((city) => city.id === 'gwangju-si');
  assert.equal(koreaOriginOptionLabel(gyeonggi, 'ko'), '광주 · 경기');
  assert.equal(koreaOriginOptionLabel(gyeonggi, 'en'), 'Gwangju · Gyeonggi');
  assert.deepEqual(
    suggestKoreaOriginCities('광주').cities.map((city) => koreaOriginOptionLabel(city, 'ko')),
    ['광주 · 광역시', '광주 · 경기'],
  );
  assert.deepEqual(
    suggestKoreaOriginCities('Gwangju').cities.map((city) => koreaOriginOptionLabel(city, 'en')),
    ['Gwangju · Metropolitan City', 'Gwangju · Gyeonggi'],
  );
  const gangwon = KOREA_ORIGIN_CITIES.find((city) => city.id === 'goseong-gw');
  assert.equal(koreaOriginOptionLabel(gangwon, 'ko'), '고성 · 강원');
  assert.equal(koreaOriginOptionLabel(gangwon, 'en'), 'Goseong · Gangwon');
});

test('ongjin uses the coastal ferry terminal and other island seats stay offshore', () => {
  const byId = Object.fromEntries(KOREA_ORIGIN_CITIES.map((city) => [city.id, city]));
  assert.equal(byId.ongjin.lat, 37.454263);
  assert.equal(byId.ongjin.lng, 126.598981);
  const hubs = JSON.parse(readFileSync(join(root, 'src/pages/Home/data/cityAttractionHubs.json'), 'utf8'));
  const hub = hubs.find((row) => row.hubId === 'ongjin');
  assert.equal(hub.lat, 37.446);
  assert.equal(hub.lng, 126.637);
  assert.ok(Math.abs(byId.ongjin.lat - hub.lat) > 0.005);
  assert.ok(byId.ulleung.lng > 130.8 && byId.ulleung.lng < 131);
  assert.ok(byId.ulleung.lat > 37.45 && byId.ulleung.lat < 37.55);
  assert.ok(byId.ganghwa.lat > 37.7 && byId.ganghwa.lng < 126.55);
  assert.ok(byId.sinan.lng < 126.3 && byId.sinan.lat > 34.7 && byId.sinan.lat < 35);
  assert.ok(byId.wando.lat < 34.4 && byId.wando.lng > 126.6 && byId.wando.lng < 126.9);
  assert.ok(byId.jindo.lat > 34.4 && byId.jindo.lat < 34.55 && byId.jindo.lng < 126.35);
  assert.ok(byId.namhae.lng > 127.8 && byId.namhae.lng < 128 && byId.namhae.lat > 34.75 && byId.namhae.lat < 34.95);
  assert.ok(byId.geoje.lng > 128.5 && byId.geoje.lng < 128.8 && byId.geoje.lat > 34.8 && byId.geoje.lat < 35);
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
  assert.equal(shouldResendPinnedOrigin({
    suggestionsOpen: false,
    pinnedId: 'chuncheon',
    submittedId: '',
  }), true);
  assert.equal(shouldResendPinnedOrigin({
    suggestionsOpen: false,
    pinnedId: 'chuncheon',
    submittedId: 'chuncheon',
  }), false);
  assert.equal(shouldResendPinnedOrigin({
    suggestionsOpen: true,
    pinnedId: 'chuncheon',
    submittedId: '',
  }), false);
  assert.equal(shouldResendPinnedOrigin({
    suggestionsOpen: false,
    pinnedId: '',
    submittedId: '',
  }), false);
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
