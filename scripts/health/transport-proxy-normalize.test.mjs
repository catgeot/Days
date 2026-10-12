import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  AREX_STATION_IDS,
  DESTINATION_ORDER,
  DESTINATIONS,
  SUSEO_STATION_ID,
  UNQUERIED_TERMINALS,
} from '../../supabase/functions/transport-proxy/catalog.mjs';
import {
  assertCatalogQueryable,
  buildFestivalTransportCard,
  cacheFresh,
  cardCacheFresh,
  cardCacheKey,
  itemsFromTagoBody,
  kstYmd,
  parsePlanTime,
  planQueries,
  redactSecrets,
  routeKey,
  serverTimingHeader,
  summarizeRoute,
} from '../../supabase/functions/transport-proxy/normalize.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fx = join(root, 'supabase/functions/transport-proxy/fixtures');
const transferRaw = JSON.parse(readFileSync(join(fx, 'gwangju-songjeong-hampyeong.json'), 'utf8'));
const samples = JSON.parse(readFileSync(join(fx, 'sentinel-and-fare.json'), 'utf8'));

const TRAIN = '2026-10-24';
const BUS = '2026-10-11';

function okResult(json) {
  const parsed = itemsFromTagoBody(json);
  return {
    queried: true,
    ok: true,
    items: parsed.items,
    totalCount: parsed.totalCount,
    rawCount: parsed.items.length,
  };
}

function emptyResult() {
  return okResult(samples.empty);
}

test('promo festivals are keyed by contentId, Gangneung third', () => {
  assert.deepEqual(DESTINATION_ORDER, ['638576', '637693', '2930716']);
  assert.deepEqual(DESTINATION_ORDER.map((id) => DESTINATIONS[id].contentId), DESTINATION_ORDER);
  assert.equal(DESTINATIONS['638576'].name, '대한민국 국향대전');
  assert.equal(DESTINATIONS['637693'].name, '마산가고파국화축제');
  assert.equal(DESTINATIONS['2930716'].cityLabel, '강릉');
  assert.equal(assertCatalogQueryable().length, 0);
});

test('live queries use probed IDs and skip dead terminals and AREX', () => {
  const keys = [];
  for (const destination of Object.values(DESTINATIONS)) {
    for (const query of planQueries(destination, { trainDate: TRAIN, busDate: BUS }).queries) {
      keys.push(query.key);
    }
  }
  const joined = keys.join('\n');
  assert.match(joined, /NAEK032/);
  assert.match(joined, /NAEK021/);
  assert.match(joined, /NAI6193701/);
  assert.match(joined, /NAT010032/);
  assert.match(joined, /NATH30000/);
  assert.match(joined, /NAT031857:NAT032212/);
  assert.match(joined, /NAT880345/);
  assert.match(joined, /NAI2238202/);
  for (const row of UNQUERIED_TERMINALS) {
    assert.equal(joined.includes(row.id), false, row.id);
  }
  for (const id of AREX_STATION_IDS) {
    assert.equal(joined.includes(id), false, id);
  }
  assert.equal(SUSEO_STATION_ID, 'NATH30000');
});

test('buses stay on the KST service day even when the train date is later', () => {
  const plan = planQueries(DESTINATIONS['638576'], { trainDate: TRAIN, busDate: BUS });
  const buses = plan.queries.filter((query) => query.mode !== 'train');
  const trains = plan.queries.filter((query) => query.mode === 'train');
  assert.ok(buses.length > 0);
  assert.ok(trains.every((query) => query.date === TRAIN));
  assert.ok(buses.every((query) => query.date === BUS));
  assert.equal(buses.some((query) => query.key.endsWith('20261024')), false);
});

test('광주송정→함평역 fixture matches the promo transfer range', () => {
  const parsed = itemsFromTagoBody(transferRaw);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.items.length, 8);
  const summary = summarizeRoute(
    { mode: 'train', depId: 'NAT031857', arrId: 'NAT032212', role: 'transfer' },
    parsed.items,
    { serviceDate: TRAIN, totalCount: parsed.totalCount, pageItemCount: parsed.items.length },
  );
  assert.equal(summary.options.length, 1);
  const option = summary.options[0];
  assert.equal(option.durationMin, 20);
  assert.equal(option.durationMax, 25);
  assert.equal(option.dailyCount, 8);
  assert.equal(option.fareAdultMin, 2600);
  assert.equal(option.fareAdultMax, 4800);
  assert.equal(option.firstDeparture, '07:19');
  assert.equal(option.lastDeparture, '23:13');
  assert.equal(option.grade, '무궁화');
  assert.equal(option.source, '국토교통부 TAGO');
  assert.equal(option.verified, true);
});

function oneRow(item) {
  return {
    queried: true,
    ok: true,
    items: [item],
    totalCount: 1,
    rawCount: 1,
  };
}

test('option checkedAt is the query date and serviceDate is the timetable date', () => {
  const summary = summarizeRoute(
    { mode: 'train', depId: 'NAT031857', arrId: 'NAT032212', role: 'transfer' },
    itemsFromTagoBody(transferRaw).items,
    { serviceDate: TRAIN, checkedAt: BUS, totalCount: 8, pageItemCount: 8 },
  );
  assert.equal(summary.options[0].checkedAt, BUS);
  assert.equal(summary.options[0].serviceDate, TRAIN);
  assert.equal(summary.options[0].checkedAt === summary.options[0].serviceDate, false);
});

test('함평 card uses that transfer when Seoul has no direct train', () => {
  const transfer = okResult(transferRaw);
  const results = {
    [routeKey('train', 'NAT010000', 'NAT032212', TRAIN)]: emptyResult(),
    [routeKey('train', 'NAT010000', 'NAT031857', TRAIN)]: oneRow({
      trainno: '401',
      traingradename: 'KTX',
      depplacename: '서울',
      arrplacename: '광주송정',
      depplandtime: '20261024062200',
      arrplandtime: '20261024082500',
      adultcharge: '41200',
    }),
    [routeKey('train', 'NAT031857', 'NAT032212', TRAIN)]: transfer,
    [routeKey('train', 'NAT883012', 'NAT032212', TRAIN)]: emptyResult(),
    [routeKey('expBus', 'NAEK500', 'NAEK581', BUS)]: emptyResult(),
    [routeKey('suburbsBus', 'NAI6193701', 'NAI5715301', BUS)]: emptyResult(),
    [routeKey('expBus', 'NAEK010', 'NAEK581', BUS)]: emptyResult(),
    [routeKey('expBus', 'NAEK010', 'NAEK500', BUS)]: emptyResult(),
  };
  const card = buildFestivalTransportCard({
    destination: DESTINATIONS['638576'],
    trainDate: TRAIN,
    busDate: BUS,
    checkedAt: BUS,
    results,
  });
  assert.equal(card.checkedAt, BUS);
  assert.equal(card.flags.busSameDayOnly, true);
  assert.equal(card.flags.fareScope, 'adult only');
  const seoul = card.origins.find((origin) => origin.originId === 'seoul-station');
  assert.equal(seoul.direct, false);
  assert.equal(seoul.options[0].checkedAt, BUS);
  assert.equal(seoul.options[0].serviceDate, TRAIN);
  const hop = seoul.suggestedTransfer.legs.find((leg) => leg.depStationId === 'NAT031857');
  assert.equal(hop.verified, true);
  assert.equal(hop.dailyCount, 8);
  assert.equal(hop.options[0].durationMin, 20);
  assert.equal(hop.options[0].durationMax, 25);
  assert.equal(hop.options[0].checkedAt, BUS);
  assert.equal(hop.options[0].serviceDate, TRAIN);
  assert.equal(seoul.suggestedTransfer.legs.some((leg) => leg.dailyCount === 0), false);
  assert.equal(seoul.suggestedTransfer.legs.some((leg) => leg.mode === 'expBus'), false);
  assert.equal(card.origins.some((origin) => origin.originId === 'seoul-gyeongbu'), false);
});

test('23:59 sentinel rows are dropped and 24:00 last buses stay', () => {
  const mixed = itemsFromTagoBody(samples.sentinelMix);
  const summary = summarizeRoute(
    { mode: 'suburbsBus', depId: 'NAI6193701', arrId: 'NAI5715301', role: 'transfer' },
    mixed.items,
    { serviceDate: BUS, totalCount: 3, pageItemCount: 3 },
  );
  assert.equal(summary.droppedSentinel, 2);
  assert.equal(summary.options.length, 1);
  assert.equal(summary.options[0].dailyCount, 1);
  assert.equal(summary.options[0].firstDeparture, '08:00');
  assert.equal(summary.options[0].fareAdultMin, 4300);

  const last = itemsFromTagoBody(samples.lastBus2400);
  const kept = summarizeRoute(
    { mode: 'expBus', depId: 'NAEK021', arrId: 'NAEK500', role: 'hub' },
    last.items,
    { serviceDate: BUS, totalCount: 1, pageItemCount: 1 },
  );
  assert.equal(kept.droppedSentinel, 0);
  assert.equal(kept.options[0].firstDeparture, '24:00');
  assert.equal(kept.options[0].lastDeparture, '24:00');
  assert.equal(kept.options[0].durationMin, 200);
  assert.equal(parsePlanTime('20261011235900').sentinel, true);
  assert.equal(parsePlanTime('20261011240000').sentinel, false);
});

test('adultcharge 0 is missing, not a free fare', () => {
  const zero = itemsFromTagoBody(samples.fareZero);
  assert.equal(zero.items.length, 1);
  const summary = summarizeRoute(
    { mode: 'train', depId: 'NAT014445', arrId: 'NAT880345', role: 'venue' },
    zero.items,
    { serviceDate: TRAIN, totalCount: 1, pageItemCount: 1 },
  );
  assert.equal(summary.options[0].dailyCount, 1);
  assert.equal(summary.options[0].fareAdultMin, null);
  assert.equal(summary.options[0].fareAdultMax, null);
  assert.equal(summary.options[0].trainNo, '1081');
  assert.equal(summary.options[0].depStation, '부산');
  assert.equal(JSON.stringify(summary).includes('"fareAdultMin":0'), false);

  const mixed = summarizeRoute(
    { mode: 'suburbsBus', depId: 'NAI4620401', arrId: 'NAI5135601', role: 'venue' },
    itemsFromTagoBody(samples.fareZeroMixed).items,
    { serviceDate: BUS, totalCount: 2, pageItemCount: 2 },
  );
  assert.equal(mixed.options[0].fareAdultMin, 6600);
  assert.equal(mixed.options[0].fareAdultMax, 6600);
});

test('수서 departures book SR without relabeling the TAGO grade', () => {
  const summary = summarizeRoute(
    { mode: 'train', depId: 'NATH30000', arrId: 'NAT031857', role: 'hub' },
    itemsFromTagoBody(samples.suseo).items,
    { serviceDate: TRAIN, totalCount: 2, pageItemCount: 2 },
  );
  const option = summary.options[0];
  assert.equal(option.grade, 'KTX-산천');
  assert.equal(option.operator, null);
  assert.deepEqual(option.trainNos, ['601', '618']);
  assert.equal(option.depStation, '수서');
  assert.equal(option.depStationId, 'NATH30000');
  assert.equal(option.bookingOperator, 'SR');
  assert.equal(option.bookingUrl, 'https://etk.srail.kr/');
  assert.equal(option.bookingUnconfirmed, true);
  assert.equal(option.bookingRule, 'suseo-departure');

  const seoul = summarizeRoute(
    { mode: 'train', depId: 'NAT010000', arrId: 'NAT031857', role: 'hub' },
    [{
      trainno: '601',
      traingradename: 'KTX',
      depplacename: '서울',
      arrplacename: '광주송정',
      depplandtime: '20261024062200',
      arrplandtime: '20261024082500',
      adultcharge: '41200',
    }],
    { serviceDate: TRAIN, totalCount: 1, pageItemCount: 1 },
  );
  assert.equal(seoul.options[0].trainNo, '601');
  assert.equal(seoul.options[0].bookingOperator, 'Korail');
  assert.equal(seoul.options[0].bookingUrl, 'https://www.letskorail.com/');
});

test('여수 transfer keeps a positive first hop and drops 0-count legs', () => {
  const card = buildFestivalTransportCard({
    destination: DESTINATIONS['2930716'],
    trainDate: '2026-10-16',
    busDate: BUS,
    checkedAt: BUS,
    results: {
      [routeKey('train', 'NAT041993', 'NAT601936', '2026-10-16')]: emptyResult(),
      [routeKey('expBus', 'NAEK510', 'NAEK200', BUS)]: emptyResult(),
      [routeKey('suburbsBus', 'NAI5971501', 'NAI2551901', BUS)]: emptyResult(),
      [routeKey('train', 'NAT041993', 'NAT010000', '2026-10-16')]: oneRow({
        trainno: '111',
        traingradename: 'KTX',
        depplacename: '여수EXPO',
        arrplacename: '서울',
        depplandtime: '20261016070000',
        arrplandtime: '20261016103000',
        adultcharge: '30000',
      }),
      [routeKey('train', 'NAT010000', 'NAT601936', '2026-10-16')]: okResult(transferRaw),
      [routeKey('train', 'NAT130126', 'NAT601936', '2026-10-16')]: emptyResult(),
      [routeKey('train', 'NAT010032', 'NAT601936', '2026-10-16')]: emptyResult(),
      [routeKey('train', 'NATH30000', 'NAT601936', '2026-10-16')]: emptyResult(),
      [routeKey('expBus', 'NAEK021', 'NAEK200', BUS)]: emptyResult(),
      [routeKey('expBus', 'NAEK117', 'NAEK200', BUS)]: emptyResult(),
      [routeKey('suburbsBus', 'NAI2238202', 'NAI2551901', BUS)]: emptyResult(),
    },
  });
  const yeosu = card.origins.find((origin) => origin.originId === 'yeosu');
  assert.equal(yeosu.direct, false);
  assert.match(yeosu.suggestedTransfer.summary, /여수EXPO/);
  const seoulLeg = yeosu.suggestedTransfer.legs.find((leg) => leg.depStationId === 'NAT010000' && leg.arrStationId === 'NAT601936');
  assert.equal(seoulLeg.verified, true);
  assert.ok(seoulLeg.dailyCount > 0);
  const yeosuLeg = yeosu.suggestedTransfer.legs.find((leg) => leg.depStationId === 'NAT041993');
  assert.equal(yeosuLeg.verified, true);
  assert.equal(yeosuLeg.dailyCount, 1);
  assert.equal(yeosuLeg.options[0].checkedAt, BUS);
  assert.equal(yeosuLeg.options[0].serviceDate, '2026-10-16');
  assert.equal(yeosu.suggestedTransfer.legs.some((leg) => leg.depStationId === 'NAT010032'), false);
  assert.equal(yeosu.suggestedTransfer.legs.some((leg) => leg.dailyCount === 0), false);
  for (const id of ['yongsan', 'suseo', 'central-city']) {
    assert.equal(card.origins.some((origin) => origin.originId === id), false, id);
  }

  const airport = card.origins.find((origin) => origin.originId === 'incheon-airport');
  assert.equal(airport.direct, false);
  assert.equal(airport.suggestedTransfer.legs[0].mode, 'arex');
  assert.equal(airport.suggestedTransfer.legs[0].verified, false);
  const body = JSON.stringify(airport);
  assert.equal(body.includes('13000'), false);
  assert.equal(body.includes('43분'), false);
});

test('a direct airport bus does not add an AREX fallback', () => {
  const card = buildFestivalTransportCard({
    destination: DESTINATIONS['2930716'],
    trainDate: '2026-10-16',
    busDate: BUS,
    checkedAt: BUS,
    results: {
      [routeKey('expBus', 'NAEK117', 'NAEK200', BUS)]: emptyResult(),
      [routeKey('suburbsBus', 'NAI2238202', 'NAI2551901', BUS)]: oneRow({
        depPlandTime: '20261011090000',
        arrPlandTime: '20261011140000',
        charge: '41000',
        gradeNm: '우등',
      }),
    },
  });
  const airport = card.origins.find((origin) => origin.originId === 'incheon-airport');
  assert.equal(airport.direct, true);
  assert.equal(airport.suggestedTransfer, null);
  assert.equal(airport.options[0].dailyCount, 1);
  assert.equal(airport.options[0].checkedAt, BUS);
  assert.equal(airport.options[0].serviceDate, BUS);
  assert.equal(JSON.stringify(card).includes('"mode":"arex"'), false);
});

test('single-object TAGO item, empty items, and secret redaction', () => {
  const one = itemsFromTagoBody(samples.fareZero);
  assert.equal(one.items.length, 1);
  const none = itemsFromTagoBody(samples.empty);
  assert.deepEqual(none.items, []);
  assert.equal(none.ok, true);
  const secret = 'super-secret-key';
  assert.equal(redactSecrets(`key=${secret}&x=${encodeURIComponent(secret)}`, secret).includes(secret), false);
  const src = readFileSync(join(root, 'supabase/functions/transport-proxy/index.ts'), 'utf8');
  assert.equal(/console\.(log|error|warn)\([^;\n]*\burl\b/.test(src), false);
  assert.equal(/console\.(log|error|warn)\([^;\n]*serviceKey/.test(src), false);
  assert.match(src, /Promise\.all\(gates\.map/);
  assert.match(src, /tago_card_cache/);
  assert.match(src, /Server-Timing/);
});

test('train cache lasts about a day and bus cache dies after that KST date', () => {
  const now = new Date('2026-10-11T03:00:00.000Z');
  assert.equal(kstYmd(now), '2026-10-11');
  const fresh = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const old = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
  assert.equal(cacheFresh('train', fresh, '2026-10-16', now), true);
  assert.equal(cacheFresh('train', old, '2026-10-16', now), false);
  assert.equal(cacheFresh('expBus', fresh, '2026-10-11', now), true);
  assert.equal(cacheFresh('expBus', fresh, '2026-10-16', now), false);
  assert.equal(cacheFresh('suburbsBus', old, '2026-10-11', now), false);
});

test('assembled card cache key includes the bus day and train date, and dies at KST midnight', () => {
  assert.equal(cardCacheKey('638576', '2026-10-11', '2026-10-24'), 'card:638576:20261011:20261024');
  assert.notEqual(
    cardCacheKey('638576', '2026-10-11', '2026-10-24'),
    cardCacheKey('638576', '2026-10-12', '2026-10-24'),
  );
  assert.notEqual(
    cardCacheKey('638576', '2026-10-11', '2026-10-24'),
    cardCacheKey('2930716', '2026-10-11', '2026-10-16'),
  );
  const beforeMidnight = new Date('2026-10-11T14:59:00.000Z');
  const midnight = new Date('2026-10-11T15:00:00.000Z');
  assert.equal(kstYmd(beforeMidnight), '2026-10-11');
  assert.equal(kstYmd(midnight), '2026-10-12');
  const fetched = '2026-10-11T03:00:00.000Z';
  assert.equal(cardCacheFresh(fetched, '2026-10-11', beforeMidnight), true);
  assert.equal(cardCacheFresh(fetched, '2026-10-11', midnight), false);
  assert.equal(cardCacheFresh(fetched, '2026-10-10', beforeMidnight), false);
  assert.equal(cardCacheFresh('2026-10-11T16:00:00.000Z', '2026-10-11', beforeMidnight), false);
});

test('Server-Timing lists rl, cache, upstream, and build', () => {
  assert.equal(
    serverTimingHeader({ rl: 12.34, cache: 5, upstream: 0, build: 1.2 }, { cacheDesc: 'card' }),
    'rl;dur=12.3, cache;dur=5.0;desc="card", upstream;dur=0.0, build;dur=1.2',
  );
  assert.equal(
    serverTimingHeader({}),
    'rl;dur=0.0, cache;dur=0.0, upstream;dur=0.0, build;dur=0.0',
  );
});
