import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { prepareFestivalMooniChatPayload } from '../../src/pages/Home/lib/festivalMooniRequest.js';
import {
  MOONI_KOREA_FESTIVAL_HINT_BUDGET,
  MOONI_KOREA_FESTIVAL_HINT_MAX,
  fitMooniKoreaFestivalHint,
  resolveMooniChatKoreaFestivalHint,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SAVED = JSON.parse(
  readFileSync(join(root, 'scripts/health/fixtures/gemini-proxy-400-gukhyang-food.json'), 'utf8'),
);
const FOOD_ASK = '근처 맛집 추천해 줘';

function row(grade, clock, duration, fare, count) {
  return { grade, clock, duration, fare, count };
}

function gukhyangContext() {
  const trunk = row('KTX', '06:22', '2시간 6분', '42,100원', '1회');
  const lastMile = row('무궁화호', '07:19~22:39', '20분~25분', '2,600~4,800원', '2회');
  const origins = [];
  for (let i = 0; i < 8; i += 1) {
    const segments = [
      { dep: '서울', arr: '광주송정', rows: [trunk] },
      { dep: '광주송정', arr: '함평', rows: [lastMile] },
    ];
    for (let n = 0; n < 12; n += 1) {
      segments.push({
        dep: '용산',
        arr: '광주송정',
        rows: [row(`KTX-${i}-${n}`, '05:08~22:23', '1시간 36분~2시간 54분', '38,600~41,900원', '11회')],
      });
    }
    origins.push({ label: `출발${i}`, segments });
  }
  return {
    contentId: '638576',
    title: '대한민국 국향대전',
    eventStartDate: '20261023',
    eventEndDate: '20261108',
    venue: '함평 엑스포공원 일원',
    address: '전남광주통합특별시 함평군 함평읍 곤재로 27',
    homepage: 'https://www.hpftf.or.kr/',
    tel: '061-320-2247',
    feeText: '현장(개인): 어른 7,000원·청소년·군인 5,000원',
    overview: '‘신화의 국화동산’을 주제로 대형 국화 기획작품과 국화 분재 작품을 전시하는 가을 축제입니다.',
    program: '개장식·개막식·폐막식, 국향 가을음악회, 브라스밴드 거리공연, 국향 마술버블쇼, 지역 문화예술 체험',
    nearbyPlaces: ['돌머리해수욕장', '함평자연생태공원', '용천사', '백제고도', '모악산', '삼호천'],
    nearbyRestaurants: ['장안식당', '키친205', '목포식당', '화랑식당'],
    transport: { origins },
  };
}

test('typed 맛집 question resolves chipId food without a chip click', () => {
  const prepared = prepareFestivalMooniChatPayload({
    festivalContext: true,
    userText: FOOD_ASK,
    chipId: null,
    destinationName: '대한민국 국향대전',
  });
  assert.equal(prepared.chipFacts.chipId, 'food');
});

test('국향대전 typed food question stays within the server hint cap', async () => {
  globalThis.__GATEO_HINT_BUDGET_PROBE__ = [];
  try {
    const { hint } = await resolveMooniChatKoreaFestivalHint({
      userText: FOOD_ASK,
      festivalContext: gukhyangContext(),
      locale: 'ko',
      now: new Date('2026-10-14T03:00:00Z'),
    });
    const probe = globalThis.__GATEO_HINT_BUDGET_PROBE__;
    assert.ok(probe[0].before > MOONI_KOREA_FESTIVAL_HINT_MAX, `before ${probe[0].before}`);
    assert.ok(hint.length <= MOONI_KOREA_FESTIVAL_HINT_BUDGET, `after ${hint.length}`);
    assert.equal(hint.length, probe.at(-1).after);
    assert.match(hint, /\[GATEO 한국 축제 — 이 세션의 확인된 사실\]/);
    assert.match(hint, /서울→광주송정 KTX 06:22/);
    assert.match(hint, /42,100원/);
    assert.match(hint, /2,600~4,800원/);
    assert.match(hint, /7,000원/);
    assert.match(hint, /https:\/\/www\.hpftf\.or\.kr\//);
    assert.match(hint, /\[공식 홈페이지\]\(https:\/\/www\.hpftf\.or\.kr\/\)/);
    assert.match(hint, /이번 질문은 근처 먹을 곳이다/);
    assert.match(hint, /장안식당/);
    assert.equal(fitMooniKoreaFestivalHint(hint), hint);
  } finally {
    delete globalThis.__GATEO_HINT_BUDGET_PROBE__;
  }
});

test('saved 400 body trims under the cap and keeps verified lines', () => {
  const before = SAVED.params.koreaFestivalHint;
  assert.equal(before.length, 8166);
  assert.ok(before.length > MOONI_KOREA_FESTIVAL_HINT_MAX);
  const hint = fitMooniKoreaFestivalHint(before, undefined, {
    chipId: 'food',
    userText: FOOD_ASK,
  });
  assert.ok(hint.length <= MOONI_KOREA_FESTIVAL_HINT_BUDGET, String(hint.length));
  assert.match(hint, /서울→광주송정 KTX 06:22 2시간 6분 42,100원 1회/);
  assert.match(hint, /7,000원/);
  assert.match(hint, /https:\/\/www\.hpftf\.or\.kr\//);
  assert.match(hint, /061-320-2247/);
  assert.match(hint, /이번 질문은 근처 먹을 곳이다/);
  assert.match(hint, /장안식당, 키친205, 목포식당, 화랑식당/);
  assert.equal(hint.split('광주송정→함평 무궁화호 07:19~22:39').length - 1, 1);
  assert.doesNotMatch(hint, /근처\(GATEO\):/);
  assert.doesNotMatch(hint, /^- 프로그램:/m);
  assert.match(hint, /해요체/);
});

test('food ask keeps restaurant names, distance, and links ahead of other nearby places', () => {
  const before = SAVED.params.koreaFestivalHint;
  const scenic = Array.from({ length: 40 }, (_, i) => `풍경${String(i).padStart(3, '0')}`);
  const restaurants = '장안식당(도보 12분), 키친205(도보 8분), [목포식당](https://example.com/mokpo)';
  let hint = [
    '',
    '[GATEO 한국 축제 — 이 세션의 확인된 사실]',
    '- 확인된 열차·버스. 이 시각과 요금만 말한다: 서울→광주송정 KTX 06:22 2시간 6분 42,100원 1회',
    `- 근처(GATEO): ${scenic.join(', ')}, ${restaurants}`,
    '- 프로그램: 개장식, 폐막식',
    '- 주변 맛집(GATEO): 장안식당, 키친205, 목포식당, 화랑식당',
    '- 요금: 어른 7,000원',
    '- 공식 안내 URL: https://www.hpftf.or.kr/',
    '- 이번 질문은 근처 먹을 곳이다. 3~4곳만 유형이나 거리와 함께 말한다: 장안식당, 키친205, 목포식당, 화랑식당.',
    `- 축제 답 규칙: ${'확인된 사실만 말한다. '.repeat(520)}`,
  ].join('\n');
  const pad = '확인된 사실만 말한다. ';
  while (hint.length < MOONI_KOREA_FESTIVAL_HINT_BUDGET + 90) hint += pad;
  assert.ok(hint.length > MOONI_KOREA_FESTIVAL_HINT_BUDGET);
  const fitted = fitMooniKoreaFestivalHint(hint, undefined, {
    chipId: SAVED.params.chipId,
    userText: FOOD_ASK,
  });
  assert.ok(fitted.length <= MOONI_KOREA_FESTIVAL_HINT_BUDGET, String(fitted.length));
  assert.match(fitted, /장안식당\(도보 12분\)/);
  assert.match(fitted, /키친205\(도보 8분\)/);
  assert.match(fitted, /\[목포식당\]\(https:\/\/example\.com\/mokpo\)/);
  assert.match(fitted, /화랑식당/);
  assert.match(fitted, /서울→광주송정 KTX 06:22/);
  assert.match(fitted, /42,100원/);
  assert.match(fitted, /7,000원/);
  assert.match(fitted, /https:\/\/www\.hpftf\.or\.kr\//);
  assert.match(before, /장안식당/);
  assert.match(fitted, /장안식당, 키친205, 목포식당, 화랑식당/);
  assert.doesNotMatch(fitted, /풍경039/);
  assert.match(fitted, /풍경000/);

  const saved = fitMooniKoreaFestivalHint(before, undefined, {
    chipId: 'food',
    userText: FOOD_ASK,
  });
  assert.ok(saved.length <= MOONI_KOREA_FESTIVAL_HINT_BUDGET, String(saved.length));
  for (const name of ['장안식당', '키친205', '목포식당', '화랑식당']) {
    assert.match(saved, new RegExp(name));
  }
  assert.match(saved, /서울→광주송정 KTX 06:22 2시간 6분 42,100원 1회/);
  assert.match(saved, /7,000원/);
  assert.match(saved, /https:\/\/www\.hpftf\.or\.kr\//);
});

test('a long nearby list shrinks before repeated timetable rows collapse', () => {
  const fact = '서울→광주송정 KTX 06:22 2시간 6분 42,100원 1회';
  const places = Array.from({ length: 700 }, (_, i) => `장소${String(i).padStart(3, '0')}`).join(', ');
  const hint = [
    '',
    '[GATEO 한국 축제 — 이 세션의 확인된 사실]',
    `- 축제 답 규칙: ${'확인된 사실만 말한다. '.repeat(280)}`,
    `- 확인된 열차·버스. 이 시각과 요금만 말한다: ${fact} | ${fact}`,
    `- 근처(GATEO): ${places}`,
    '- 요금: 어른 7,000원',
    '- 공식 안내 URL: https://www.hpftf.or.kr/',
    '- 이번 질문은 근처 먹을 곳이다. 장안식당.',
  ].join('\n');
  assert.ok(hint.length > MOONI_KOREA_FESTIVAL_HINT_BUDGET);
  const fitted = fitMooniKoreaFestivalHint(hint);
  assert.ok(fitted.length <= MOONI_KOREA_FESTIVAL_HINT_BUDGET);
  assert.equal(fitted.split(fact).length - 1, 2);
  assert.match(fitted, /7,000원/);
  assert.match(fitted, /https:\/\/www\.hpftf\.or\.kr\//);
  assert.match(fitted, /이번 질문은 근처 먹을 곳이다/);
  assert.match(fitted, /장소/);
});

test('unique timetable rows past the hard cap drop from the end at a row boundary', () => {
  const rows = Array.from({ length: 220 }, (_, i) => (
    `서울→광주송정 등급${String(i).padStart(3, '0')} 06:22 2시간 6분 42,100원 1회`
  ));
  const hint = [
    '',
    '[GATEO 한국 축제 — 이 세션의 확인된 사실]',
    `- 확인된 열차·버스. 이 시각과 요금만 말한다: ${rows.join(' | ')}`,
    '- 요금: 어른 7,000원',
    '- 공식 안내 URL: https://www.hpftf.or.kr/',
  ].join('\n');
  assert.ok(hint.length > MOONI_KOREA_FESTIVAL_HINT_MAX);
  const fitted = fitMooniKoreaFestivalHint(hint);
  assert.ok(fitted.length <= MOONI_KOREA_FESTIVAL_HINT_MAX, String(fitted.length));
  assert.match(fitted, /등급000/);
  assert.match(fitted, /42,100원/);
  assert.match(fitted, /https:\/\/www\.hpftf\.or\.kr\//);
  assert.doesNotMatch(fitted, /등급219/);
  assert.equal(fitted.at(-1) !== ' ', true);
});

test('ChatModal refits after the TAGO append; usePlaceChat uses the shared builder', () => {
  const chatModal = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  const usePlaceChat = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/usePlaceChat.js'),
    'utf8',
  );
  const assist = readFileSync(join(root, 'src/shared/korea/mooniKoreaFestivalReplyPolish.js'), 'utf8');
  assert.match(chatModal, /fitMooniKoreaFestivalHint\(koreaFestivalHint,/);
  assert.match(usePlaceChat, /fitMooniKoreaFestivalHint\(festHint\.hint,/);
  assert.match(assist, /fitMooniKoreaFestivalHint\(hint,/);
  assert.equal(MOONI_KOREA_FESTIVAL_HINT_MAX, 8000);
  assert.equal(MOONI_KOREA_FESTIVAL_HINT_BUDGET, 7900);
});
