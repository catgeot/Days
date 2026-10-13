import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { DESTINATION_ORDER } from '../../supabase/functions/transport-proxy/catalog.mjs';
import {
  FESTIVAL_TRANSPORT_CONTENT_IDS,
  bookingLink,
  buildAccessView,
  composeFestivalAccessReply,
  createMooniSendGate,
  glueAccessUnit,
  planFestivalMooniModelCall,
  departureCoversStation,
  festivalAccessAskFragment,
  preferredOriginId,
  selectAccessCards,
  formatClockRange,
  formatDurationRange,
  formatFareRange,
  formatRunCount,
  optionIsDisplayable,
  resolveFestivalTrainDate,
  shouldQueryFestivalTransport,
} from '../../src/pages/Korea/lib/festivalTransportCard.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function option(overrides = {}) {
  return {
    mode: 'train',
    verified: true,
    grade: 'KTX-이음',
    depStation: '서울역',
    arrStation: '강릉역',
    depStationId: 'NAT010000',
    arrStationId: 'NAT601936',
    firstDeparture: '05:06',
    lastDeparture: '22:14',
    durationMin: 111,
    durationMax: 140,
    fareAdultMin: 27600,
    fareAdultMax: 27600,
    dailyCount: 18,
    truncated: false,
    bookingUrl: 'https://www.letskorail.com/',
    bookingOperator: 'Korail',
    ...overrides,
  };
}

test('festival transport allowlist matches the server catalog order', () => {
  assert.deepEqual(FESTIVAL_TRANSPORT_CONTENT_IDS, DESTINATION_ORDER);
  assert.equal(shouldQueryFestivalTransport('2930716'), true);
  assert.equal(shouldQueryFestivalTransport('999999'), false);
  assert.equal(shouldQueryFestivalTransport(''), false);
});

test('train date stays inside the proxy window', () => {
  const now = new Date('2026-10-13T03:00:00Z');
  assert.equal(resolveFestivalTrainDate('20261016', '20261018', now), '2026-10-16');
  assert.equal(resolveFestivalTrainDate('2026-10-10', '2026-10-20', now), '2026-10-13');
  assert.equal(resolveFestivalTrainDate('2026-12-20', '2026-12-22', now), null);
  assert.equal(resolveFestivalTrainDate('2026-09-01', '2026-09-03', now), '2026-10-13');
});

test('display keeps real train and bus values and drops blanks', () => {
  assert.equal(optionIsDisplayable(option()), true);
  assert.equal(optionIsDisplayable(option({ verified: false })), false);
  assert.equal(optionIsDisplayable(option({ mode: 'arex', firstDeparture: '' })), false);
  assert.equal(optionIsDisplayable(option({ firstDeparture: '23:59', lastDeparture: '23:59' })), true);
  assert.equal(optionIsDisplayable(option({ lastDeparture: '24:00' })), true);
  assert.equal(optionIsDisplayable(option({ fareAdultMin: null })), true);
  assert.equal(formatFareRange(null, null), '');
  assert.equal(formatFareRange(0, 0), '');
  assert.equal(formatFareRange(27600, 27600), '27,600원');
  assert.equal(formatFareRange(24300, 26800), '24,300~26,800원');
  assert.equal(formatFareRange(27600, 27600, 'en'), '₩27,600');
  assert.equal(formatClockRange('05:06', '22:14'), '05:06~22:14');
  assert.equal(formatClockRange('05:06', '22:14', 'en'), '05:06–22:14');
  assert.equal(formatDurationRange(111, 111), '1시간 51분');
  assert.equal(formatDurationRange(111, 140, 'en'), '1 hr 51 min–2 hr 20 min');
  assert.equal(formatRunCount(option(), 'ko'), '18회');
  assert.equal(formatRunCount(option({ truncated: true }), 'en'), '18 confirmed');
  assert.equal(formatRunCount(option({ dailyCount: 0 }), 'ko'), '');
  const korail = bookingLink(option());
  assert.equal(korail.text, 'Korail 예매');
  assert.equal(korail.href, 'https://www.letskorail.com/');
  assert.deepEqual(korail.segment, { dep: '서울역', arr: '강릉역', particle: '을' });
  assert.equal(bookingLink(option({ bookingUrl: 'http://example.com' })), null);
  assert.equal(bookingLink(option({ mode: 'expBus', bookingOperator: null, bookingUrl: 'https://www.kobus.co.kr/' })).text, '고속버스 예매');
  assert.equal(bookingLink(option({ mode: 'suburbsBus', bookingOperator: null, bookingUrl: 'https://txbus.t-money.co.kr/' }), 'en').text, 'Book intercity bus');
  const sr = bookingLink(option({
    bookingOperator: 'SR',
    bookingUrl: 'https://etk.srail.kr/',
    depStation: '수서',
    arrStation: '강릉역',
    serviceDate: '2026-10-16',
  }));
  assert.equal(sr.segment, null);
  assert.match(sr.href, /^https:\/\/etk\.srail\.kr\/hpg\/hra\/01\/selectScheduleList\.do\?/);
  const srUrl = new URL(sr.href);
  assert.equal(srUrl.searchParams.get('dptRsStnCd'), '0551');
  assert.equal(srUrl.searchParams.get('arvRsStnCd'), '0115');
  assert.equal(srUrl.searchParams.get('dptDt'), '20261016');
  assert.equal(srUrl.searchParams.get('dptTm'), '000000');
  const srUnknown = bookingLink(option({
    bookingOperator: 'SR',
    bookingUrl: 'https://etk.srail.kr/',
    depStation: '수서',
    arrStation: '함평역',
    serviceDate: '2026-10-16',
  }));
  assert.equal(srUnknown.href, 'https://etk.srail.kr/');
  assert.equal(srUnknown.segment.arr, '함평역');
  assert.equal(bookingLink(option({ arrStation: '대구' })).segment.particle, '를');
  assert.equal(bookingLink(option({ arrStation: '광주(유·스퀘어)' })).segment.particle, '를');
});

test('access view uses verified rows only', () => {
  const view = buildAccessView({
    ok: true,
    source: '국토교통부 TAGO',
    trainDate: '2026-10-16',
    busDate: '2026-10-13',
    flags: { busSameDayOnly: true },
    origins: [
      {
        originId: 'seoul-station',
        label: '서울역',
        options: [option(), option({ verified: false, grade: '가짜', fareAdultMin: 1 })],
      },
      {
        originId: 'incheon-airport',
        label: '인천공항',
        options: [],
        suggestedTransfer: {
          legs: [
            { mode: 'arex', verified: false, reason: 'no times' },
            {
              mode: 'train',
              verified: true,
              options: [option({ depStation: '청량리', arrStation: '강릉역', grade: 'KTX' })],
            },
          ],
        },
      },
      {
        originId: 'yongsan',
        label: '용산',
        options: [],
        suggestedTransfer: { legs: [{ mode: 'train', verified: false, options: [option()] }] },
      },
    ],
  });
  assert.equal(view.status, 'ready');
  assert.equal(view.origins.length, 2);
  assert.equal(view.origins[0].direct.length, 1);
  assert.equal(view.origins[0].direct[0].fareAdultMin, 27600);
  assert.equal(view.origins[1].arexUnverified, true);
  assert.equal(view.origins[1].hops.length, 1);
  assert.equal(view.origins[1].hops[0].depStation, '청량리');
  assert.equal(view.source.busSameDayOnly, true);
  assert.equal(buildAccessView({ ok: false }).status, 'unavailable');
  assert.equal(buildAccessView({ ok: true, origins: [] }).status, 'empty');
});

test('festival sheet mounts the access card above the bottom rail', () => {
  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  const accessAt = sheet.indexOf('data-festival-section="access"');
  const nearbyAt = sheet.indexOf('data-festival-section="nearAttractions"');
  assert.ok(sheet.includes('FestivalAccessCard'));
  assert.ok(accessAt > 0 || sheet.includes('<FestivalAccessCard'));
  assert.ok(nearbyAt > sheet.indexOf('<FestivalAccessCard'));
  const ko = readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8');
  const en = readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8');
  assert.match(ko, /"accessTitle": "가는 법"/);
  assert.match(en, /"accessTitle": "How to get there"/);
  assert.match(ko, /"accessUnavailable": "지금은 열차·버스 시각을 불러오지 못했어요."/);
  assert.match(ko, /"accessPickSegment": "\{\{dep\}\}→\{\{arr\}\}\{\{particle\}\} 고르세요"/);
});

test('one card per segment, at most three, and MOONi repeats those fares', () => {
  const hampyeong = option({
    depStation: '용산', arrStation: '함평', depStationId: 'yongsan', arrStationId: 'hampyeong',
    grade: 'ITX-새마을', role: 'venue', venue: true,
  });
  const cards = selectAccessCards({
    direct: [
      hampyeong,
      option({
        depStation: '용산', arrStation: '함평', depStationId: 'yongsan', arrStationId: 'hampyeong',
        grade: 'ITX-마음', firstDeparture: '09:47', role: 'venue', venue: true,
      }),
      option({
        depStation: '용산', arrStation: '함평', depStationId: 'yongsan', arrStationId: 'hampyeong',
        grade: '무궁화호', firstDeparture: '18:10', role: 'venue', venue: true,
      }),
      option({
        depStation: '용산', arrStation: '광주송정', depStationId: 'yongsan', arrStationId: 'songjeong',
        grade: 'KTX', role: 'hub', fareAdultMin: 41000, fareAdultMax: 41900,
      }),
    ],
    hops: [
      option({
        depStation: '광주송정', arrStation: '함평', depStationId: 'songjeong', arrStationId: 'hampyeong',
        grade: '무궁화호', role: 'transfer', fareAdultMin: 2600, fareAdultMax: 4800,
      }),
      option({
        depStation: '다른곳', arrStation: '함평', depStationId: 'other', arrStationId: 'hampyeong',
        grade: '무궁화호', role: 'transfer', fareAdultMin: 1000, fareAdultMax: 1000,
      }),
    ],
  });
  assert.equal(cards.length, 3);
  assert.equal(cards[0].depStation, '용산');
  assert.equal(cards[0].arrStation, '함평');
  assert.equal(cards[0].rows.length, 3);
  assert.equal(cards.filter((card) => card.depStation === '다른곳').length, 0);
  const facts = {
    selected: {
      label: '용산',
      segments: [{
        dep: '용산',
        arr: '함평',
        rows: [{ grade: 'ITX-새마을', clock: '08:44~19:11', duration: '4시간 23분', fare: '36,300원', count: '3회' }],
      }],
    },
    origins: [],
  };
  const reply = composeFestivalAccessReply(facts, { useSelected: true });
  assert.match(reply, /08:44\u2060~\u206019:11/);
  assert.match(reply, /용산→함평/);
  assert.match(reply, /36,\u2060300원/);
  assert.match(reply, /가는 법 카드/);
  assert.doesNotMatch(reply, /ITX-마음/);
  assert.equal(festivalAccessAskFragment('용산역에서 어떻게 가요? 시각과 요금도 알려줘'), '용산역');
  assert.equal(departureCoversStation('용산역', '용산'), true);
  const yongsanReply = composeFestivalAccessReply({
    selected: { label: '서울역', segments: [] },
    origins: [
      {
        label: '용산',
        segments: [
          {
            dep: '용산',
            arr: '함평',
            rows: [{ grade: 'ITX-새마을', clock: '08:44~19:11', duration: '4시간 23분', fare: '36,300원', count: '3회' }],
          },
          {
            dep: '용산',
            arr: '광주송정',
            rows: [{ grade: 'KTX', clock: '06:29~21:18', duration: '1시간 36분~2시간 54분', fare: '38,600~41,900원', count: '11회' }],
          },
        ],
      },
      {
        label: '서울역',
        segments: [{
          dep: '서울',
          arr: '함평',
          rows: [{ grade: '무궁화호', clock: '07:00', fare: '1,000원', count: '1회' }],
        }],
      },
    ],
  }, { stations: '용산역' });
  assert.match(yongsanReply, /용산→함평/);
  assert.match(yongsanReply, /08:44\u2060~\u206019:11/);
  assert.match(yongsanReply, /36,\u2060300원/);
  assert.match(yongsanReply, /광주송정까지 가서 갈아타는/);
  assert.equal((yongsanReply.match(/바로 갈 수 있어요/g) || []).length, 1);
  assert.doesNotMatch(yongsanReply, /1,[\u2060]?000원/);
  assert.match(reply, /가는 법 카드/);
});

test('fare, clock, and duration stay one unbreakable unit', () => {
  assert.equal(glueAccessUnit('38,600~41,900원'), '38,\u2060600\u2060~\u206041,\u2060900원');
  assert.equal(glueAccessUnit('33,100원'), '33,\u2060100원');
  assert.equal(glueAccessUnit('48,100원'), '48,\u2060100원');
  assert.equal(glueAccessUnit('05:03~20:38'), '05:03\u2060~\u206020:38');
  assert.equal(
    glueAccessUnit('3시간 4분~3시간 12분'),
    '3시간\u00A04분\u2060~\u20603시간\u00A012분',
  );
  assert.equal(glueAccessUnit('3시간 4분~3시간 12분').includes(' '), false);
  const card = readFileSync(join(root, 'src/pages/Korea/FestivalAccessCard.jsx'), 'utf8');
  assert.match(card, /function Nowrap[\s\S]*whitespace-nowrap/);
  assert.match(card, /<Nowrap>\{clock\}<\/Nowrap>/);
  assert.match(card, /<Nowrap>\{duration\}<\/Nowrap>/);
  assert.match(card, /<Nowrap>\{fare\}<\/Nowrap>/);
});

test('a typed station ask renders each grade once, then a normal question calls the model', () => {
  const grades = [
    { grade: 'KTX-산천', clock: '05:03~20:38', duration: '3시간 4분~3시간 12분', fare: '48,100원', count: '6회' },
    { grade: 'ITX-새마을', clock: '07:15~19:40', duration: '4시간', fare: '27,600원', count: '4회' },
  ];
  const segment = { dep: '서울', arr: '마산', mode: 'train', rows: grades };
  const transport = {
    selected: { segments: [segment] },
    origins: [
      { label: '서울역', segments: [segment] },
      { label: '인천공항', segments: [segment] },
    ],
  };
  const gate = createMooniSendGate();
  assert.equal(gate.tryBegin(), true);
  const access = planFestivalMooniModelCall({
    userText: '서울역에서 어떻게 가요? 시각과 요금도 알려줘',
    transport,
  });
  assert.equal(access.callModel, true);
  assert.equal(access.reply, '');
  assert.equal(access.tagoLead.split('KTX-산천').length - 1, 1);
  assert.doesNotMatch(access.tagoLead, /ITX-새마을/);
  assert.match(access.tagoLead, /^서울→마산/);
  assert.match(access.tagoLead, /05:03\u2060~\u206020:38/);
  assert.match(access.tagoLead, /48,\u2060100원/);
  assert.match(access.tagoLead, /가는 법 카드/);
  assert.match(access.tagoLead, /48,\u2060100원이에요/);
  assert.doesNotMatch(access.tagoLead, /(?<!이)예요/);
  gate.end();
  assert.equal(gate.busy, false);
  assert.equal(gate.tryBegin(), true);
  const food = planFestivalMooniModelCall({
    userText: '근처 맛집 추천해줘',
    transport,
  });
  assert.equal(food.callModel, true);
  assert.equal(food.reply, '');
  gate.end();
  assert.equal(gate.tryBegin(), true);
  gate.end();
});

test('a direct ride and a transfer summary, not one line per class', () => {
  const reply = composeFestivalAccessReply({
    selected: {
      segments: [
        {
          dep: '용산',
          arr: '함평',
          rows: [
            { grade: 'ITX-새마을', clock: '08:44~19:11', duration: '4시간 23분', fare: '36,300원', count: '3회' },
            { grade: 'ITX-마음', clock: '09:47', duration: '4시간 5분', fare: '36,300원', count: '1회' },
            { grade: '무궁화호', clock: '18:10', duration: '4시간 49분', fare: '36,300원', count: '1회' },
          ],
        },
        {
          dep: '용산',
          arr: '광주송정',
          rows: [
            { grade: 'KTX', clock: '06:29~21:18', duration: '1시간 36분~2시간 54분', fare: '38,600~41,900원', count: '11회' },
            { grade: 'KTX-산천', clock: '07:13~22:23', duration: '1시간 52분~2시간 47분', fare: '37,800~41,900원', count: '8회' },
          ],
        },
        {
          dep: '광주송정',
          arr: '함평',
          transfer: true,
          rows: [
            { grade: '무궁화호', clock: '07:19~22:39', duration: '20분~25분', fare: '2,600~4,800원', count: '2회' },
          ],
        },
      ],
    },
  }, { useSelected: true });
  assert.match(reply, /용산→함평은 ITX-새마을로/);
  assert.match(reply, /08:44\u2060~\u206019:11/);
  assert.match(reply, /36,\u2060300원/);
  assert.doesNotMatch(reply, /ITX-마음/);
  assert.doesNotMatch(reply, /무궁화호/);
  assert.match(reply, /KTX로 광주송정까지 가서 갈아타는 방법도 있어요/);
  assert.match(reply, /1시간\u00A036분\u2060~\u20602시간\u00A054분/);
  assert.match(reply, /38,\u2060600\u2060~\u206041,\u2060900원/);
  assert.doesNotMatch(reply, /KTX-산천/);
  assert.match(reply, /36,\u2060300원이에요/);
  assert.match(reply, /가는 법 카드/);
  assert.doesNotMatch(reply, /(?<!이)예요/);
});

test('missing TAGO rows call the model instead of a lone no-times line', () => {
  const empty = composeFestivalAccessReply(
    { origins: [{ label: '대구', segments: [] }] },
    { stations: '동대구역·대구역', locale: 'ko' },
  );
  assert.equal(empty, '');
  const planned = planFestivalMooniModelCall({
    chipId: 'festival_access',
    userText: '대구(동대구역·대구역)에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘',
    transport: {
      origins: [{ label: '대구', segments: [] }],
      selected: { segments: [] },
    },
    stations: '동대구역·대구역',
    locale: 'ko',
  });
  assert.equal(planned.callModel, true);
  assert.equal(planned.reply, '');
});

test('국향대전 defaults to 용산 when that origin is present', () => {
  const origins = [
    { originId: 'seoul-station', label: '서울역' },
    { originId: 'yongsan', label: '용산' },
  ];
  assert.equal(preferredOriginId(origins, '638576'), 'yongsan');
  assert.equal(preferredOriginId(origins, '2930716'), 'seoul-station');
  assert.equal(preferredOriginId([{ originId: 'seoul-station' }], '638576'), 'seoul-station');
});
