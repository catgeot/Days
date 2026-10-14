import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { splitCardAccessNumberTokens } from '../../src/components/chat/mooniAccessNumberToken.js';
import { DESTINATION_ORDER } from '../../supabase/functions/transport-proxy/catalog.mjs';
import {
  FESTIVAL_TRANSPORT_CONTENT_IDS,
  bookingLink,
  buildAccessView,
  buildTrainGradeDetail,
  buildTrainGradeSummary,
  displayTrainGrade,
  listCheapestTrainGrades,
  pickCheapestTrainGrade,
  pickFastestTrainGrade,
  trainSummaryText,
  tripComLink,
  TRIP_COM_KORAIL_HREF,
  composeFestivalAccessReply,
  createMooniSendGate,
  glueAccessUnit,
  glueAccessNumbersInProse,
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
  assert.equal(korail.text, '코레일에서 예매하기 ↗');
  assert.equal(korail.href, 'https://www.letskorail.com/');
  assert.equal(bookingLink(option(), 'en').text, 'Book on Korail ↗');
  const trip = tripComLink(option());
  assert.equal(trip.href, TRIP_COM_KORAIL_HREF);
  assert.equal(trip.text, '외국어 예매 (Trip.com) ↗');
  assert.equal(tripComLink(option({ bookingOperator: 'SR' })), null);
  assert.equal(tripComLink(option({ mode: 'expBus', bookingOperator: null })), null);
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
  assert.equal(sr.text, 'SR에서 예매하기 ↗');
  assert.deepEqual(sr.segment, { dep: '수서', arr: '강릉역', particle: '을' });
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
  assert.match(ko, /출발역 '\{\{dep\}\}', 도착역 '\{\{arr\}\}'\{\{particle\}\} 고르세요/);
  assert.match(ko, /Trip\.com은 판매 대행사라 수수료·요금이 다를 수 있어요/);
  assert.match(en, /Trip\.com is a reseller/);
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
  assert.match(reply, /조회한 시간대\(08:44\u2060~\u206019:11\)에 운행하는 출발편 예시로 바로 갈 수 있어요/);
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
  assert.match(yongsanReply, /조회한 시간대\(08:44\u2060~\u206019:11\)에 운행하는 출발편 예시로 바로 갈 수 있어요/);
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
  assert.equal(glueAccessNumbersInProse('2,600원에서 4,800원'), '2,\u2060600원에서 4,\u2060800원');
  assert.equal(
    glueAccessNumbersInProse('16:29~19:29 사이'),
    '16:\u206029\u2060~\u206019:\u206029 사이',
  );
  assert.equal(glueAccessNumbersInProse('07:19 출발'), '07:\u206019 출발');
  assert.doesNotMatch(glueAccessNumbersInProse('4,800원'), /4,\n/);
  const card = readFileSync(join(root, 'src/pages/Korea/FestivalAccessCard.jsx'), 'utf8');
  assert.match(card, /function Nowrap[\s\S]*whitespace-nowrap/);
  assert.match(card, /<Nowrap>\{clock\}<\/Nowrap>/);
  assert.match(card, /<Nowrap>\{duration\}<\/Nowrap>/);
  assert.match(card, /<Nowrap>\{fare\}<\/Nowrap>/);
  assert.match(card, /data-mooni-access-number="true"/);
  assert.match(card, /whiteSpace:\s*'nowrap'/);
  assert.match(card, /wordBreak:\s*'normal'/);
  assert.match(card, /function SummaryLine[\s\S]*<AccessNumberText text=\{part\.text\} \/>/);
  assert.match(card, /function TrainGradeDetails[\s\S]*<AccessNumberText text=\{detail\.clock\} \/>/);
  assert.match(card, /<AccessNumberText text=\{detail\.durationText\} \/>/);
  assert.match(card, /<AccessNumberText text=\{detail\.aside\} \/>/);
  const summary = '가장 빠르고 싼 열차는 SRT, 약 2시간 53분 · 46,600원이에요.';
  assert.deepEqual(
    splitCardAccessNumberTokens(summary).filter((part) => part.accessNumber).map((part) => part.text),
    ['2시간 53분', '46,600원'],
  );
  assert.deepEqual(
    splitCardAccessNumberTokens('첫차 05:06 · 막차 22:34').filter((part) => part.accessNumber).map((part) => part.text),
    ['05:06', '22:34'],
  );
  assert.deepEqual(
    splitCardAccessNumberTokens('2시간 53분부터').filter((part) => part.accessNumber).map((part) => part.text),
    ['2시간 53분'],
  );
  assert.deepEqual(
    splitCardAccessNumberTokens('46,600원부터 · 하루 10회').filter((part) => part.accessNumber).map((part) => part.text),
    ['46,600원', '10회'],
  );
  assert.equal(
    splitCardAccessNumberTokens('46,600원').some((part) => part.text === '46,' || part.text === '600원'),
    false,
  );
  assert.deepEqual(
    splitCardAccessNumberTokens('(10월 23일 기준)').filter((part) => part.accessNumber),
    [],
  );
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

function grade(overrides) {
  return option({
    depStation: '용산',
    arrStation: '광주송정',
    ...overrides,
  });
}

test('train summary names every grade tied at the cheapest 용산→광주송정 fare', () => {
  const rows = [
    grade({ grade: 'KTX-산천(A-type)', firstDeparture: '05:08', lastDeparture: '20:09', durationMin: 115, durationMax: 159, fareAdultMin: 41000, fareAdultMax: 41900, dailyCount: 4 }),
    grade({ grade: 'KTX-산천(B-type)', firstDeparture: '05:48', lastDeparture: '21:09', durationMin: 109, durationMax: 155, fareAdultMin: 41000, fareAdultMax: 41900, dailyCount: 6 }),
    grade({ grade: 'KTX', firstDeparture: '06:29', lastDeparture: '21:18', durationMin: 96, durationMax: 174, fareAdultMin: 38600, fareAdultMax: 41900, dailyCount: 11 }),
    grade({ grade: 'KTX-산천', firstDeparture: '07:13', lastDeparture: '22:23', durationMin: 112, durationMax: 167, fareAdultMin: 37800, fareAdultMax: 41900, dailyCount: 8 }),
    grade({ grade: 'ITX-새마을', firstDeparture: '08:44', lastDeparture: '19:11', durationMin: 237, durationMax: 241, fareAdultMin: 33100, fareAdultMax: 33100, dailyCount: 3 }),
    grade({ grade: 'ITX-마음', firstDeparture: '09:47', lastDeparture: '17:18', durationMin: 221, durationMax: 224, fareAdultMin: 33100, fareAdultMax: 33100, dailyCount: 2 }),
    grade({ grade: '무궁화호', firstDeparture: '18:10', lastDeparture: '18:10', durationMin: 266, durationMax: 266, fareAdultMin: 33100, fareAdultMax: 33100, dailyCount: 1 }),
  ];
  assert.equal(pickFastestTrainGrade(rows).grade, 'KTX');
  assert.equal(pickCheapestTrainGrade(rows).grade, 'ITX-마음');
  assert.deepEqual(
    listCheapestTrainGrades(rows).map((row) => row.grade),
    ['ITX-마음', 'ITX-새마을', '무궁화호'],
  );
  const summary = buildTrainGradeSummary(rows, { locale: 'ko', trainDate: '2026-10-23' });
  assert.equal(summary.expandable, true);
  assert.equal(summary.gradeCount, 7);
  assert.equal(
    trainSummaryText(summary),
    [
      '가장 빠른 열차는 KTX, 약 1시간 36분이에요.',
      '가장 싼 요금은 33,100원(ITX-마음·ITX-새마을·무궁화호)예요.',
      '하루 35회 다녀요. (10월 23일 기준)',
    ].join('\n'),
  );
  assert.doesNotMatch(trainSummaryText(summary), /가장 싼 열차는/);
  const en = buildTrainGradeSummary(rows, { locale: 'en', trainDate: '2026-10-23' });
  assert.match(trainSummaryText(en), /The cheapest fare is ₩33,100 \(ITX-마음·ITX-새마을·무궁화호\)\./);
  const detail = buildTrainGradeDetail(rows[0], 'ko');
  assert.equal(detail.clock, '첫차 05:08 · 막차 20:09');
  assert.equal(detail.durationText, '1시간 55분부터');
  assert.equal(detail.aside, '41,000원부터 · 하루 4회');
  const once = buildTrainGradeDetail(rows[6], 'ko');
  assert.equal(once.clock, '18:10 출발');
  const partial = buildTrainGradeSummary(
    [grade({ truncated: true, dailyCount: 4 }), grade({ grade: '무궁화호', durationMin: 200, fareAdultMin: 20000, dailyCount: 1 })],
    { locale: 'ko', trainDate: '2026-10-23' },
  );
  assert.match(trainSummaryText(partial), /하루 5회 이상 다녀요/);
  assert.doesNotMatch(trainSummaryText(partial), /10월 23일/);
});

test('Suseo departures say SRT and never pair a KTX grade with SR booking', () => {
  const row = option({
    grade: 'KTX-산천',
    depStation: '수서',
    arrStation: '마산역',
    depStationId: 'NATH30000',
    bookingOperator: 'SR',
    bookingUrl: 'https://etk.srail.kr/',
    serviceDate: '2026-10-16',
    fareAdultMin: 48100,
    fareAdultMax: 48100,
    durationMin: 184,
    durationMax: 192,
    dailyCount: 6,
    firstDeparture: '05:03',
    lastDeparture: '20:38',
  });
  assert.equal(displayTrainGrade(row), 'SRT');
  assert.equal(displayTrainGrade(option({ grade: 'KTX-산천' })), 'KTX-산천');
  const summary = buildTrainGradeSummary([row], { locale: 'ko', trainDate: '2026-10-16' });
  const text = trainSummaryText(summary);
  assert.match(text, /가장 빠르고 싼 열차는 SRT/);
  assert.doesNotMatch(text, /KTX/);
  const book = bookingLink(row);
  assert.equal(book.text, 'SR에서 예매하기 ↗');
  assert.match(book.href, /etk\.srail\.kr/);
  assert.equal(buildTrainGradeDetail(row, 'ko').grade, 'SRT');
  const named = option({
    grade: 'KTX-산천',
    depStation: '수서역',
    arrStation: '마산역',
    bookingOperator: null,
    bookingUrl: 'https://etk.srail.kr/',
  });
  assert.equal(displayTrainGrade(named), 'SRT');
  assert.doesNotMatch(trainSummaryText(buildTrainGradeSummary([named], { locale: 'ko' })), /KTX/);
});

test('one train grade collapses to a single sentence and hides more', () => {
  const summary = buildTrainGradeSummary([
    option({ fareAdultMin: null, fareAdultMax: null }),
  ], { locale: 'ko', trainDate: '2026-10-16' });
  assert.equal(summary.expandable, false);
  assert.match(trainSummaryText(summary), /가장 빠른 열차는 KTX-이음/);
  assert.match(trainSummaryText(summary), /가장 싼 열차: 확인 안 됨/);
  const priced = buildTrainGradeSummary([option()], { locale: 'en', trainDate: '2026-10-16' });
  assert.equal(priced.expandable, false);
  assert.match(trainSummaryText(priced), /The fastest and cheapest train is KTX-이음, about 1 hr 51 min · ₩27,600\./);
  assert.match(trainSummaryText(priced), /18 departures a day\. \(as of 10\/16\)/);
});
