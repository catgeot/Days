import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  buildFestivalAccessAskText,
  FESTIVAL_DOMESTIC_ORIGINS,
} from '../../src/pages/Home/lib/festivalDomesticOrigins.js';
import {
  isMooniChipInstructionTurn,
  isMooniInstructionFragment,
  mooniFestivalChipSendTexts,
  mooniPlaceChipSendTexts,
  replySentenceLeaksChipInstruction,
} from '../../src/pages/Home/lib/mooniChipInstruction.js';
import { resolveDestinationFromChat } from '../../src/utils/resolveDestinationFromChat.js';
import {
  extractMooniFestivalLocationQueryText,
  shouldMooniScopedFestivalReplaceEmptyCandidates,
} from '../../src/pages/Home/lib/mooniKoreaFestivalTurn.js';
import {
  buildMooniKoreaFestivalSystemHint,
  buildMooniKoreaFestivalZeroCandidateUserReply,
  mergeMooniKoreaFestivalReply,
  polishFestivalModelReply,
  repairFestivalChipInstructionLeak,
  resolveMooniChatKoreaFestivalHint,
} from '../../src/shared/korea/mooniKoreaFestivalReplyPolish.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const koChips = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8')).mooni.chips;
const enChips = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8')).mooni.chips;

const SIGHTS_KO = koChips.festival.festival_sights.sendText;
const SIGHTS_EN = enChips.festival.festival_sights.sendText;
const NEARBY_KO = koChips.festival.festival_nearby.sendText;

const PRODUCTION_LEAK =
  'GATEO가 확인한 축제 중 앞으로 30일 이 볼 수 것과 현장 분위기를 확인된 프로그램과 시간만 말하고 데이터에 없는 붐비는 시간은 지어내지 마와 겹치는 행사는 없어요.';

const INSTRUCTION_MARKERS = [
  '지어내지 마',
  '데이터에 없는',
  '확인된 프로그램과 시간만',
  '넣지 마',
  '단정하지 마',
  '말하지 마',
  'Do not invent',
  'do not invent',
  'on-site feel',
  'Use only confirmed',
  'use only confirmed',
];

const FESTIVALS = [
  {
    contentId: '2048902',
    festivalTitle: '해운대 빛축제',
    program: '크루즈게이트\n터널게이트',
    sceneOverview: '해운대 밤바다에 빛 조형이 이어져요.',
    timeText: '18:00~23:00',
    names: ['크루즈게이트', '터널게이트'],
  },
  {
    contentId: '1095732',
    festivalTitle: '서울빛초롱축제',
    program: '청계천 등불\n빛 조형',
    sceneOverview: '청계천을 따라 등이 켜져요.',
    timeText: '17:30~22:30',
    names: ['청계천 등불', '빛 조형'],
  },
];

function assertNoInstruction(text, label) {
  const body = String(text || '');
  for (const marker of INSTRUCTION_MARKERS) {
    assert.equal(body.includes(marker), false, `${label} contains ${marker}: ${body}`);
  }
}

function collectSendTexts(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (typeof node.sendText === 'string' && node.sendText.trim()) out.push(node.sendText.trim());
  for (const value of Object.values(node)) collectSendTexts(value, out);
  return out;
}

function polishLeak(userText, chipId, festival, locale = 'ko') {
  const leaked = locale === 'en'
    ? `GATEO has no verified festivals overlapping ${userText} for the next 30 days.`
    : `GATEO가 확인한 축제 중 앞으로 30일 ${userText}와 겹치는 행사는 없어요.`;
  return polishFestivalModelReply(leaked, {
    locale,
    chipId,
    userText,
    ...festival,
  });
}

test('i18n chip send texts are instruction turns and stay out of the zero-candidate template', () => {
  const sends = [...collectSendTexts(koChips), ...collectSendTexts(enChips)];
  assert.ok(sends.includes(SIGHTS_KO));
  assert.ok(sends.includes(SIGHTS_EN));
  for (const text of sends) {
    assert.equal(isMooniChipInstructionTurn(text, ''), true, text);
    const built = buildMooniKoreaFestivalZeroCandidateUserReply({
      locale: /[가-힣]/.test(text) ? 'ko' : 'en',
      userText: text,
      chipId: 'festival_sights',
      boundPlaceName: '해운대 빛축제',
      window: { label: '앞으로 30일' },
    });
    assert.equal(built, '', text);
  }
  for (const row of FESTIVAL_DOMESTIC_ORIGINS) {
    for (const locale of ['ko', 'en']) {
      const ask = buildFestivalAccessAskText(row, locale);
      assert.equal(isMooniChipInstructionTurn(ask, 'festival_access'), true, ask);
      assert.equal(
        buildMooniKoreaFestivalZeroCandidateUserReply({
          locale,
          userText: ask,
          chipId: 'festival_access',
          boundPlaceName: '해운대 빛축제',
        }),
        '',
        ask,
      );
      const place = extractMooniFestivalLocationQueryText(ask, '해운대 빛축제');
      assert.equal(place, '해운대 빛축제', ask);
      assertNoInstruction(place, ask);
    }
  }
});

test('production 해운대 볼거리 leak is rewritten from program data', () => {
  for (const festival of FESTIVALS) {
    assert.equal(
      shouldMooniScopedFestivalReplaceEmptyCandidates(SIGHTS_KO, {
        boundFestivalSession: true,
        chipId: 'festival_sights',
      }),
      false,
    );
    const merged = mergeMooniKoreaFestivalReply('크루즈게이트가 켜져요.', {
      candidates: [],
      userText: SIGHTS_KO,
      chipId: 'festival_sights',
      locale: 'ko',
      scopedFestivalEnabled: true,
      boundFestivalSession: true,
      boundPlaceName: festival.festivalTitle,
    });
    assert.equal(merged, '크루즈게이트가 켜져요.');

    const shown = polishFestivalModelReply(PRODUCTION_LEAK, {
      locale: 'ko',
      chipId: 'festival_sights',
      userText: SIGHTS_KO,
      ...festival,
    });
    for (const name of festival.names) assert.match(shown, new RegExp(name));
    assert.match(shown, /볼 수 있는 프로그램은/);
    assertNoInstruction(shown, festival.festivalTitle);
    assert.doesNotMatch(shown, /겹치는 행사/);

    const shownEn = polishLeak(SIGHTS_EN, 'festival_sights', festival, 'en');
    assert.match(shownEn, /Confirmed programs include/);
    for (const name of festival.names) assert.match(shownEn, new RegExp(name));
    assertNoInstruction(shownEn, `${festival.festivalTitle} en`);
  }
});

test('every festival chip leak stays off the reply, nearby uses the restaurant list', () => {
  const festival = FESTIVALS[0];
  const chips = [
    ['festival_sights', SIGHTS_KO, SIGHTS_EN],
    ['festival_nearby', NEARBY_KO, enChips.festival.festival_nearby.sendText],
    ['festival_day', koChips.festival.festival_day.sendText, enChips.festival.festival_day.sendText],
    ['festival_overseas_visa', koChips.festival.festival_overseas_visa.sendText, enChips.festival.festival_overseas_visa.sendText],
    ['festival_overseas_flight', koChips.festival.festival_overseas_flight.sendText, enChips.festival.festival_overseas_flight.sendText],
    ['festival_overseas_airport', koChips.festival.festival_overseas_airport.sendText, enChips.festival.festival_overseas_airport.sendText],
  ];
  for (const [chipId, ko, en] of chips) {
    const koReply = polishLeak(ko, chipId, {
      ...festival,
      nearbyRestaurants: [{ name: '해운대 횟집', distKm: 0.3 }],
    });
    assertNoInstruction(koReply, chipId);
    assert.doesNotMatch(koReply, /겹치는 행사/);
    if (chipId === 'festival_nearby') assert.match(koReply, /해운대 횟집/);
    if (chipId === 'festival_sights') {
      assert.match(koReply, /크루즈게이트/);
      assert.match(koReply, /운영 시간은 18:00~23:00예요/);
      assert.doesNotMatch(koReply, /확인된 시간은/);
    }
    const enReply = polishLeak(en, chipId, festival, 'en');
    assertNoInstruction(enReply, `${chipId} en`);
    assert.doesNotMatch(enReply, /overlapping/);
    if (chipId === 'festival_sights') {
      assert.match(enReply, /Confirmed programs include/);
      assert.match(enReply, /크루즈게이트/);
      assert.match(enReply, /Hours are 18:00~23:00/);
    }
  }
  for (const row of FESTIVAL_DOMESTIC_ORIGINS.slice(0, 3)) {
    const ask = buildFestivalAccessAskText(row, 'ko');
    const reply = polishLeak(ask, 'festival_access', festival);
    assertNoInstruction(reply, ask);
    assert.doesNotMatch(reply, /겹치는 행사/);
  }
});

test('place chips for 경복궁 and 파리 are not festival-search regions', () => {
  for (const place of ['경복궁', '파리']) {
    for (const text of mooniPlaceChipSendTexts()) {
      assert.equal(isMooniChipInstructionTurn(text, ''), true, text);
      assert.equal(
        buildMooniKoreaFestivalZeroCandidateUserReply({
          locale: /[가-힣]/.test(text) ? 'ko' : 'en',
          userText: text,
          boundPlaceName: place,
          window: { label: '앞으로 30일' },
        }),
        '',
        `${place} ${text}`,
      );
      const merged = mergeMooniKoreaFestivalReply('장소 안내예요.', {
        candidates: [],
        userText: text,
        locale: 'ko',
        scopedFestivalEnabled: true,
        boundFestivalSession: false,
        boundPlaceName: place,
      });
      assert.equal(merged, '장소 안내예요.', `${place} ${text}`);
      const repaired = repairFestivalChipInstructionLeak(PRODUCTION_LEAK, {
        locale: 'ko',
        userText: text,
        chipId: 'place_overview',
      });
      assertNoInstruction(repaired, `${place} ${text}`);
      const polished = polishFestivalModelReply(PRODUCTION_LEAK, {
        locale: 'ko',
        userText: text,
        chipId: 'place_overview',
      });
      assert.match(polished, /확인된 내용만 말할 수 있어요/);
      assertNoInstruction(polished, `${place} polished ${text}`);
    }
  }
});

test('real festival searches still use the no-overlap sentence', () => {
  assert.equal(
    shouldMooniScopedFestivalReplaceEmptyCandidates('이번 주말 부산 다른 축제 있어?', {
      boundFestivalSession: true,
    }),
    true,
  );
  const merged = mergeMooniKoreaFestivalReply('모델 본문', {
    candidates: [],
    userText: '부산 이번 주말 축제',
    locale: 'ko',
    scopedFestivalEnabled: true,
    boundFestivalSession: true,
    boundPlaceName: '해운대 빛축제',
  });
  assert.match(merged, /겹치는 행사는 없어요/);
  assertNoInstruction(merged, '부산 이번 주말 축제');
  assert.doesNotMatch(merged, /다른과/);
  const polishedSearch = polishFestivalModelReply(merged, {
    locale: 'ko',
    userText: '부산 이번 주말 축제',
    festivalTitle: '해운대 빛축제',
    program: '크루즈게이트\n터널게이트',
    timeText: '18:00~23:00',
    contentId: '2048902',
  });
  assert.match(polishedSearch, /겹치는 행사는 없어요/);
  assert.doesNotMatch(polishedSearch, /볼 수 있는 프로그램은/);

  const other = buildMooniKoreaFestivalZeroCandidateUserReply({
    locale: 'ko',
    userText: '다른 축제 있어?',
    boundPlaceName: '서울빛초롱축제',
    window: { label: '앞으로 30일' },
  });
  assert.match(other, /다른 행사와 겹치는 행사는 없어요/);
  assertNoInstruction(other, '다른 축제');
});

test('template place and window reject chip instructions', () => {
  assert.equal(extractMooniFestivalLocationQueryText(SIGHTS_KO, '해운대 빛축제'), '해운대 빛축제');
  assert.equal(extractMooniFestivalLocationQueryText(SIGHTS_EN, 'Haeundae Light Festival'), 'Haeundae Light Festival');
  assert.equal(isMooniInstructionFragment(SIGHTS_KO), true);
  const scrubbed = buildMooniKoreaFestivalZeroCandidateUserReply({
    locale: 'ko',
    userText: '부산 이번 주말 축제',
    boundPlaceName: SIGHTS_KO,
    window: { label: SIGHTS_KO },
  });
  assert.match(scrubbed, /앞으로 30일/);
  assert.match(scrubbed, /부산/);
  assertNoInstruction(scrubbed, 'scrubbed window');

  assert.equal(
    buildMooniKoreaFestivalSystemHint({
      userText: SIGHTS_KO,
      chipId: 'festival_sights',
      items: [],
      locale: 'ko',
    }),
    '',
  );
  const bound = buildMooniKoreaFestivalSystemHint({
    userText: SIGHTS_KO,
    chipId: 'festival_sights',
    locale: 'ko',
    festivalContext: {
      title: '해운대 빛축제',
      contentId: '2048902',
      program: '크루즈게이트\n터널게이트',
    },
  });
  assert.match(bound, /프로그램:\s*크루즈게이트/);
  assert.doesNotMatch(bound, /한국 축제 — 매칭 없음/);
  assert.doesNotMatch(bound, /지어내지 마와/);
});

test('chip turn does not search the festival catalog', async () => {
  let loaded = false;
  const result = await resolveMooniChatKoreaFestivalHint({
    userText: SIGHTS_KO,
    chipId: 'festival_sights',
    locale: 'ko',
    loadFestivalItems: async () => {
      loaded = true;
      return [];
    },
  });
  assert.equal(loaded, false);
  assert.equal(result.hint, '');
  assert.deepEqual(result.candidates, []);

  const bound = await resolveMooniChatKoreaFestivalHint({
    userText: NEARBY_KO,
    chipId: 'festival_nearby',
    locale: 'ko',
    festivalContext: {
      title: '서울빛초롱축제',
      contentId: '1095732',
      program: '청계천 등불',
    },
  });
  assert.match(bound.hint, /프로그램:\s*청계천 등불/);
  assert.equal(bound.candidates.length, 0);
});

test('a normal sights answer is kept, and the chat passes chipId into merge', () => {
  const mock = '확인된 프로그램 기준으로 태권도 시연이 이어져요. GATEO_E2E_CHIP_SIGHTS_7c2a';
  const kept = polishFestivalModelReply(mock, {
    locale: 'ko',
    chipId: 'festival_sights',
    userText: SIGHTS_KO,
    program: '크루즈게이트',
    contentId: '2048902',
    festivalTitle: '해운대 빛축제',
  });
  assert.match(kept, /GATEO_E2E_CHIP_SIGHTS_7c2a/);
  assertNoInstruction(kept, 'mock');

  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.match(chat, /mergeMooniKoreaFestivalReply\(aiReply, \{[\s\S]*chipId,/);
  assert.match(chat, /isMooniChipInstructionTurn\(cleanText, chipId\)/);
  assert.match(chat, /chipInstructionTurn[\s\S]{0,280}resolveDestinationFromChat/);
  const place = readFileSync(join(root, 'src/components/PlaceCard/hooks/usePlaceChat.js'), 'utf8');
  assert.doesNotMatch(place, /repairFestivalChipInstructionLeak/);
  assert.ok(mooniFestivalChipSendTexts().includes(SIGHTS_KO));
});

test('one instruction word does not replace a normal answer', () => {
  assert.equal(replySentenceLeaksChipInstruction('The on-site feel is a bright beach walk.'), false);
  assert.equal(replySentenceLeaksChipInstruction('데이터에 없는 부스 이름은 빼고 크루즈게이트를 말해요.'), false);
  assert.equal(replySentenceLeaksChipInstruction('데이터에 없는 붐비는 시간은 지어내지 마.'), true);
  assert.equal(replySentenceLeaksChipInstruction(PRODUCTION_LEAK), true);
  const placeTail = repairFestivalChipInstructionLeak(
    'GATEO가 확인한 축제 중 앞으로 30일 이곳은 어떤 곳이야?와 겹치는 행사는 없어요. 데이터에 없는 붐비는 시간은 지어내지 마.',
    { locale: 'ko', userText: '이곳은 어떤 곳이야?', chipId: 'place_overview' },
  );
  assert.equal(placeTail, '확인된 내용만 말할 수 있어요.');

  const en = 'The on-site feel is a bright beach walk. Cruise gate lights stay on until late.';
  const enKept = polishFestivalModelReply(en, {
    locale: 'en',
    chipId: 'festival_sights',
    userText: SIGHTS_EN,
    program: '크루즈게이트\n터널게이트',
    sceneOverview: '해운대 밤바다에 빛 조형이 이어져요.',
    timeText: '18:00~23:00',
    contentId: '2048902',
    festivalTitle: '해운대 빛축제',
  });
  assert.match(enKept, /The on-site feel is a bright beach walk/);
  assert.match(enKept, /Cruise gate lights stay on until late/);
  assert.doesNotMatch(enKept, /Confirmed programs include/);

  const ko = '데이터에 없는 부스 이름은 빼고 크루즈게이트를 말해요. 밤바다에 조명이 이어져요.';
  const koKept = polishFestivalModelReply(ko, {
    locale: 'ko',
    chipId: 'festival_sights',
    userText: SIGHTS_KO,
    program: '크루즈게이트\n터널게이트',
    timeText: '18:00~23:00',
    contentId: '2048902',
    festivalTitle: '해운대 빛축제',
  });
  assert.match(koKept, /데이터에 없는 부스 이름은 빼고 크루즈게이트를 말해요/);
  assert.match(koKept, /밤바다에 조명이 이어져요/);
  assert.doesNotMatch(koKept, /볼 수 있는 프로그램은/);

  const mixed = '크루즈게이트가 켜져요. GATEO가 확인한 축제 중 앞으로 30일 지어내지 마와 겹치는 행사는 없어요.';
  const mixedKept = repairFestivalChipInstructionLeak(mixed, {
    locale: 'ko',
    chipId: 'festival_sights',
    userText: SIGHTS_KO,
    program: '크루즈게이트\n터널게이트',
    timeText: '18:00~23:00',
    contentId: '2048902',
    festivalTitle: '해운대 빛축제',
  });
  assert.match(mixedKept, /크루즈게이트가 켜져요/);
  assert.doesNotMatch(mixedKept, /겹치는 행사/);
  assert.doesNotMatch(mixedKept, /볼 수 있는 프로그램은/);
});

test('on-site does not resolve Seattle, and IT matches only as a word', () => {
  const fromInstruction = resolveDestinationFromChat(SIGHTS_EN, [], 'MOONi');
  assert.notEqual(fromInstruction.slug, 'seattle');
  const fromAnswer = resolveDestinationFromChat(
    'The on-site feel is a bright beach walk.',
    [],
    'MOONi',
  );
  assert.notEqual(fromAnswer.slug, 'seattle');
  const named = resolveDestinationFromChat('시애틀 여행', [], 'MOONi');
  assert.equal(named.slug, 'seattle');
  const itWord = resolveDestinationFromChat('IT 기업이 모인 도시', [], 'MOONi');
  assert.equal(itWord.slug, 'seattle');
});
