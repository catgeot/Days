import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
import { KO, EN } from '../../src/i18n/mooniPromptBundleData.js';
import { KO as ServerKO, EN as ServerEN } from '../../supabase/functions/_shared/gemini/mooniPromptBundleData.js';
import koLocale from '../../src/i18n/locales/ko.json' with { type: 'json' };
import enLocale from '../../src/i18n/locales/en.json' with { type: 'json' };
import {
  acceptFestivalModelOpening,
  buildFestivalFirstAnswerFacts,
  buildFestivalMooniContext,
  buildFestivalMooniSentenceAnswer,
  countFestivalCardSentences,
  festivalChatHeaderTitle,
  unsupportedFestivalFactMentions,
} from '../../src/pages/Korea/lib/festivalMooniContext.js';
import {
  festivalTripMatchesLocale,
  readFestivalMooniSession,
  showFestivalOpeningInThread,
  writeFestivalMooniSession,
} from '../../src/pages/Home/lib/festivalMooniSessionCache.js';
import { festivalResolutionLabel } from '../../src/pages/Home/lib/mooniPlaceChatLabel.js';
import {
  FESTIVAL_DOMESTIC_ORIGINS,
  buildFestivalAccessAskText,
  clearDomesticAirportDeparture,
  domesticFestivalGroundOrigin,
  domesticGroundModelSuffix,
  festivalDomesticLabelsAreCities,
  festivalOriginLabel,
  findFestivalDomesticOrigin,
  formatOriginHubGuidance,
  visibleFestivalDomesticOrigins,
} from '../../src/pages/Home/lib/festivalDomesticOrigins.js';
import { resolveDepartureIataFromChat, resolveDepartureLabelFromChat } from '../../src/utils/resolveDepartureIataFromChat.js';
import { patchFestivalBoundSpot } from '../../src/pages/Korea/lib/festivalMooniBoundSpot.js';
import {
  beginFestivalRestaurantLoad,
  resetFestivalRestaurantLoad,
  waitForFestivalRestaurantNames,
} from '../../src/pages/Korea/lib/festivalRestaurantLoad.js';
import {
  beginFestivalLodgingLoad,
  loadFestivalLodgingForAsk,
  publishFestivalLodgingStays,
  resetFestivalLodgingStays,
  waitForFestivalLodgingStays,
} from '../../src/pages/Korea/lib/festivalStayLoad.js';
import {
  appendFestivalLodgingNextStep,
  buildMooniBoundFestivalSystemHint,
  hasFestivalParkingData,
  stripFestivalPageParkingPointers,
  FESTIVAL_CHAIN_RE,
  filterFestivalStayAreaNames,
  gateoKoreaFestivalLodgingUrl,
  isFestivalLodgingAsk,
  linkifyBareGateoFestivalUrls,
  cleanOrphanLinkConjunctions,
  dedupeFestivalPageLinks,
  polishFestivalModelReply,
  rankFestivalRestaurants,
  resolveMooniChatKoreaFestivalHint,
  stripDomesticTwelveGoMention,
  stripNonStayFacilities,
  stripUnaskedBroadcastLines,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import {
  dropHanjaParentheticals,
  formatEnglishThenKorean,
  formatFestivalProgramLabel,
  formatNearbyPlaceLabel,
  romanizeFestivalTitle,
  translateDescriptiveKorean,
} from '../../src/shared/korea/englishPlaceLabel.js';
import {
  expandCompactDates,
  appendFestivalAccessBookingLinks,
  dedupeFestivalAccessBookingFooters,
  ensureFestivalAccessStepLineBreaks,
  rewriteFestivalFormalEndings,
  stripDisallowedFestivalLinks,
  stripDomesticEntryDocLines,
  stripMooniUiChipLabels,
  stripInlineChipLabelPhrases,
  stripRedundantBookingLinkOnlyLines,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import {
  invokeMooniChatToleratingChip,
  LEGACY_MOONI_CHIP_IDS,
  MOONI_CHIP_EDGE_FALLBACK,
} from '../../src/pages/Home/lib/mooniChipEdgeFallback.js';
import { GeminiProxyError } from '../../src/pages/Home/lib/geminiProxyError.js';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';
import { renderChipHint, renderFestivalFirstAnswer, renderMooniSystem } from '../../supabase/functions/_shared/gemini/templates.js';
import { extractMooniChipPromptFacts } from '../../src/pages/Home/lib/mooniChipPrompts.js';
import {
  buildFestivalMooniPolishOptions,
  prepareFestivalMooniChatPayload,
} from '../../src/pages/Home/lib/festivalMooniRequest.js';
import { normalizeFestivalEventYmd } from '../../src/pages/Korea/lib/festivalMooniContext.js';
import { hasMooniTripSessionFacts } from '../../src/pages/Home/lib/mooniTripSession.js';
import { countMooniPlannerHeaderGuidance } from '../../supabase/functions/_shared/gemini/mooniChatPlannerHeaderPrompt.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const NOW = new Date('2026-10-09T03:00:00Z');

const GANGNEUNG = {
  item: {
    contentId: '2930716',
    title: '강릉 국수 축제',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
    addr1: '강원특별자치도 강릉시 경강로 2111',
  },
  intro: { eventplace: '강릉 월화거리 일원', playtime: '12:00~21:00' },
  summaryFields: { timeText: '12:00~21:00', fee: { text: '입장료 무료' } },
  overview:
    '강릉 국수 축제는 그 어느 지역보다 면 요리가 많은 사랑을 받고 있는 대표 미식 축제이다. 2025년 제5회를 맞이하여 행사명이 변경되었다. 2026년의 황금빛 가을을 이곳 월화거리에서 마음껏 즐길 수 있다. 장칼국수와 막국수를 맛보는 자리입니다.',
  program: '먹거리존\n누들 경연대회',
  nearbyPlaces: ['경포해변', '오죽헌', '기린사우나', '강릉시 행정복지센터', '대한노인회 강릉지회', '중앙동 주민센터'],
  homepage: 'https://visitgangneung.net/pub/gnfestival/4748.do',
};

test('promo festival mooni context uses social promo dates when API lags', () => {
  const masan = buildFestivalMooniContext({
    item: { contentId: '637693', title: '마산가고파국화축제', eventStartDate: '20261026', eventEndDate: '20261103' },
    intro: { eventplace: '마산' },
  });
  assert.equal(masan.eventStartDate, '20261031');
  assert.equal(masan.eventEndDate, '20261108');
});

test('normalizeFestivalEventYmd accepts ISO and compact API strings', () => {
  assert.equal(normalizeFestivalEventYmd('20261031'), '20261031');
  assert.equal(normalizeFestivalEventYmd('2026-10-31'), '20261031');
  assert.equal(normalizeFestivalEventYmd(''), '');
});

test('festival opening is sentences with dates, link, and no filler', () => {
  const ctx = buildFestivalMooniContext(GANGNEUNG);
  const ko = buildFestivalMooniSentenceAnswer(ctx, { locale: 'ko', now: NOW });
  const en = buildFestivalMooniSentenceAnswer(ctx, { locale: 'en', now: NOW });

  assert.match(ko, /강릉 국수 축제는 10\/15~18, 엿새 뒤 시작해요/);
  assert.match(ko, /월화거리에서 먹거리존과 누들 경연대회가 열려요/);
  assert.match(ko, /장칼국수와 막국수를 맛볼 수 있고, 축제 분위기가 저녁까지 이어져요/);
  assert.doesNotMatch(ko, /맛보며|월화거리에서 저녁까지/);
  assert.equal(ko.split('월화거리').length - 1, 1);
  assert.ok(ko.indexOf('월화거리') < ko.indexOf('맛볼 수 있고'));
  assert.ok(ko.indexOf('축제 분위기가 저녁까지') < ko.indexOf('근처에서는'));
  assert.match(ko, /근처에서는 경포해변, 오죽헌을 둘러볼 수 있어요/);
  assert.doesNotMatch(ko, /하나예요|합니다|입니다|기준|경강로|12:00|입장료|사우나|복지|노인회|주민센터/);
  assert.match(ko, /\[강릉 국수 축제 페이지\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716\)/);
  assert.match(ko, /자세한 내용은 \[강릉 국수 축제 페이지\]/);
  assert.doesNotMatch(ko, /가는 법/);
  assert.match(ko, /(해요|예요|이에요|있어요)/);
  assert.ok(countFestivalCardSentences(ko) <= 5, `sentences ${countFestivalCardSentences(ko)}: ${ko}`);
  assert.ok(countFestivalCardSentences(ko) >= 4);
  const facts = buildFestivalFirstAnswerFacts(ctx, { locale: 'ko', now: NOW });
  assert.deepEqual(facts.nearby, ['경포해변', '오죽헌']);
  assert.equal(acceptFestivalModelOpening(ko, facts, [ctx.address, ctx.timeText, ctx.feeText]), ko);
  assert.equal(acceptFestivalModelOpening(`${ko} 기린사우나도 있어요.`, facts), '');
  assert.equal(acceptFestivalModelOpening('강릉 국수 축제는 경강로 2111에서 열립니다.', facts), '');
  for (const phrase of [
    '사랑을 받',
    '대표',
    '마음껏',
    '황금빛',
    '다양한 즐길거리',
    '친숙하게',
    '행사명이 변경',
    '제5회',
    '오신 것을 환영합니다',
    '단순히 국수를 먹는',
    '공식 홈페이지에서 확인',
    '오후 2시',
  ]) {
    assert.equal(ko.includes(phrase), false, phrase);
  }
  assert.doesNotMatch(ko, /^[-•*]\s/m);
  assert.doesNotMatch(ko, /입니다/);

  assert.match(en, /Gangneung Noodle Festival \(강릉 국수 축제\) runs 10\/15–18 and starts in 6 days/);
  assert.match(en, /You can taste spicy hand-cut noodles \(장칼국수\) and buckwheat noodles \(막국수\)/);
  assert.doesNotMatch(en.replace(/\([^)]*\)/g, ''), /[가-힣]/);
  assert.match(en, /Food Zone \(먹거리존\)/);
  assert.match(en, /Noodle contest \(누들 경연대회\)/);
  assert.match(en, /Wolhwa Street \(월화거리\)/);
  assert.match(en, /Gyeongpo Beach \(경포해변\) and Ojukheon \(오죽헌\)/);
  assert.doesNotMatch(en, /One nearby|is held at|Gyeonggang-ro|12:00|Admission|as of/i);
  assert.doesNotMatch(en, /from ICN|how to get there|getting there/i);
  assert.match(en, /\[Gangneung Noodle Festival \(강릉 국수 축제\) page\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716\)/);
  assert.match(en, /Details are on \[Gangneung Noodle Festival/);
  assert.doesNotMatch(en, /welcome/i);
  assert.doesNotMatch(en, /사랑을 받/);
  assert.ok(countFestivalCardSentences(en) <= 5, en);
});

test('food evening join keeps one subject and daytime drops the evening clause', () => {
  const broken = '강릉 국수 축제는 10/15~18, 사흘 뒤 시작해요. 월화거리 일대에서 메인 먹거리존과 국수존, 페어링존이 열려요. 장칼국수와 막국수, 짬뽕, 감자옹심이칼국수를 맛보며 월화거리에서 축제 분위기가 저녁까지 이어져요. 강릉 오금집과 강릉향교, 오죽헌이 근처에 있어요.';
  const fixed = polishFestivalModelReply(broken, {
    contentId: '2930716',
    locale: 'ko',
    venue: '강릉 월화거리 일원',
    evening: true,
  });
  assert.match(fixed, /장칼국수와 막국수, 짬뽕, 감자옹심이칼국수를 맛볼 수 있고, 축제 분위기가 저녁까지 이어져요/);
  assert.doesNotMatch(fixed, /맛보며/);
  const missingComma = polishFestivalModelReply(
    '장칼국수와 막국수, 짬뽕, 감자옹심이칼국수를 맛볼 수 있고 축제 분위기가 저녁까지 이어져요.',
    { contentId: '2930716', locale: 'ko', evening: true },
  );
  assert.match(missingComma, /맛볼 수 있고, 축제 분위기가 저녁까지 이어져요/);
  const foodAt = fixed.indexOf('맛볼 수 있고');
  assert.ok(fixed.indexOf('월화거리 일대') >= 0 && fixed.indexOf('월화거리 일대') < foodAt);
  assert.equal(fixed.slice(foodAt).includes('월화거리'), false);
  assert.match(renderFestivalFirstAnswer('ko', { title: '강릉 국수 축제' }).system, /맛볼 수 있고/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '강릉 국수 축제' }).system, /맛보며/);

  const day = buildFestivalMooniContext({
    ...GANGNEUNG,
    intro: { eventplace: '강릉 월화거리 일원', playtime: '10:00~17:00' },
    summaryFields: { timeText: '10:00~17:00', fee: { text: '입장료 무료' } },
  });
  const dayKo = buildFestivalMooniSentenceAnswer(day, { locale: 'ko', now: NOW });
  assert.doesNotMatch(dayKo, /저녁까지/);
  assert.match(dayKo, /장칼국수와 막국수/);
  const dayPolished = polishFestivalModelReply(broken, {
    contentId: '2930716',
    locale: 'ko',
    venue: '강릉 월화거리 일원',
    evening: false,
  });
  assert.doesNotMatch(dayPolished, /저녁까지|맛보며/);
  assert.match(dayPolished, /장칼국수와 막국수, 짬뽕, 감자옹심이칼국수를 맛볼 수 있어요/);
});

test('nearby parenthetical does not append a second sentence after the page link', () => {
  const ctx = buildFestivalMooniContext({
    item: {
      contentId: '2870929',
      title: '연천 국화축제',
      eventStartDate: '20261015',
      eventEndDate: '20261018',
    },
    intro: { eventplace: '연천역' },
    nearbyPlaces: [
      '전곡선사박물관',
      '은대리 판상절리와 습곡구조 (한탄강 유네스코 세계지질공원)',
      '열두개울',
    ],
  });
  const facts = buildFestivalFirstAnswerFacts(ctx, { locale: 'ko', now: NOW });
  const once = acceptFestivalModelOpening(
    `연천 국화축제는 10/15~18에 열려요. 전곡선사박물관과 은대리 판상절리와 습곡구조, 열두개울이 근처에 있어요. ${facts.closing}`,
    facts,
  );
  assert.match(once, /전곡선사박물관과 은대리 판상절리와 습곡구조, 열두개울이 근처에 있어요/);
  assert.doesNotMatch(once, /둘러볼 수 있어요|한탄강 유네스코/);
  assert.equal((once.match(/근처/g) || []).length, 1);
  assert.ok(once.indexOf('근처에 있어요') < once.indexOf(facts.gateoUrl));
  assert.equal(once.slice(once.indexOf(facts.gateoUrl)).includes('근처'), false);

  const duplicated = acceptFestivalModelOpening(
    `연천 국화축제는 10/15~18에 열려요. 전곡선사박물관과 은대리 판상절리와 습곡구조, 열두개울이 근처에 있어요. ${facts.closing} 근처에서는 전곡선사박물관, 은대리 판상절리와 습곡구조 (한탄강 유네스코 세계지질공원), 열두개울을 둘러볼 수 있어요.`,
    facts,
  );
  assert.doesNotMatch(duplicated, /둘러볼 수 있어요/);
  assert.equal((duplicated.match(/근처/g) || []).length, 1);
  assert.ok(duplicated.indexOf('근처에 있어요') < duplicated.indexOf(facts.gateoUrl));
  assert.equal(duplicated.slice(duplicated.indexOf(facts.gateoUrl)).includes('근처'), false);
});

test('captured festival fixtures keep real nearby names and drop the info card', () => {
  for (const contentId of ['2930716', '1998564', '2855626']) {
    const input = JSON.parse(readFileSync(join(root, `scripts/staging/fixtures/festival-opening/${contentId}.json`), 'utf8'));
    const ctx = buildFestivalMooniContext(input);
    const ko = buildFestivalMooniSentenceAnswer(ctx, { locale: 'ko', now: NOW });
    assert.ok(input.nearbyPlaces.length >= 3, contentId);
    assert.match(ko, /해요|예요|이에요|있어요/);
    assert.doesNotMatch(ko, /기준|합니다|입니다|\d{1,2}:\d{2}|입장료|사우나|복지관|노인회|주민센터/);
    if (ctx.address) assert.equal(ko.includes(ctx.address), false, contentId);
    const named = input.nearbyPlaces.filter((name) => ko.includes(name));
    assert.ok(named.length >= 2 && named.length <= 3, `${contentId} ${named.join(',')}`);
  }
  const gangneung = JSON.parse(readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/2930716.json'), 'utf8'));
  const ko = buildFestivalMooniSentenceAnswer(buildFestivalMooniContext(gangneung), { locale: 'ko', now: NOW });
  assert.match(ko, /장칼국수, 막국수/);
  assert.doesNotMatch(ko, /사랑을 받|행사명이 변경|황금빛/);
});

test('model opening keeps ordinary Korean and rejects invented names', () => {
  const ctx = buildFestivalMooniContext(GANGNEUNG);
  const facts = buildFestivalFirstAnswerFacts(ctx, { locale: 'ko', now: NOW });
  const prose = [
    '강릉 국수 축제는 10/15~18, 엿새 뒤 시작해요.',
    '장칼국수와 막국수를 맛볼 수 있는 자리예요.',
    '월화거리에서 저녁까지 이어지는 분위기를 함께 즐겨보세요.',
    '축제 동안 근처에 다양한 국수를 맛봐요.',
    '근처에서는 경포해변, 오죽헌을 둘러볼 수 있어요.',
    facts.closing,
  ].join(' ');
  assert.equal(acceptFestivalModelOpening(prose, facts, [ctx.address, ctx.timeText, ctx.feeText]), prose);
  assert.equal(acceptFestivalModelOpening('10/15~18 동안 진행해요. 맛볼 수 있어요.', facts), '');
  assert.equal(
    acceptFestivalModelOpening('강릉 국수 축제는 10/15~18에 열려요. 근처에서는 안목 커피거리를 둘러볼 수 있어요.', facts),
    '',
  );
  assert.equal(acceptFestivalModelOpening('강릉 국수 축제는 경강로 2111에서 열려요.', facts), '');

  const enFacts = buildFestivalFirstAnswerFacts(ctx, { locale: 'en', now: NOW });
  assert.equal(enFacts.titleEn, 'Gangneung Noodle Festival (강릉 국수 축제)');
  assert.ok(enFacts.nearby.every((name) => /\([가-힣]/.test(name)));
  assert.match(enFacts.nearby.join(' '), /Gangneung Ogeumjip \(강릉 오금집\)|Gyeongpo Beach \(경포해변\)/);
  const enProse = acceptFestivalModelOpening(
    `Gangneung Noodle Festival (강릉 국수 축제) runs 10/15–18 and starts in 6 days. You can taste Jangkalguksu (장칼국수). It continues into the evening on the Wolhwa Street (월화거리). The event brings life to Wolhwa Street (월화거리). This is the history of the palace. Nearby, you can walk to Gyeongpo Beach (경포해변). ${enFacts.closing}`,
    enFacts,
  );
  assert.match(enProse, /on Wolhwa Street \(월화거리\)/);
  assert.match(enProse, /The event brings life/);
  assert.match(enProse, /history of the palace/);
  assert.doesNotMatch(enProse, /the Wolhwa/);
  const zoneFacts = buildFestivalFirstAnswerFacts(buildFestivalMooniContext({
    item: { contentId: '2930716', title: '강릉 국수 축제', titleEn: 'Gangneung Noodle Festival' },
    intro: { eventplace: '강릉 월화거리 일원' },
    program: '메인 먹거리존',
  }), { locale: 'en', now: NOW });
  const zoneOpening = acceptFestivalModelOpening(
    `Gangneung Noodle Festival (강릉 국수 축제) runs 10/15–18. Visitors can explore the Main Food Zone and walk the Wolhwa Street. ${zoneFacts.closing}`,
    zoneFacts,
  );
  assert.match(zoneOpening, /explore the Main Food Zone/);
  assert.doesNotMatch(zoneOpening, /the Wolhwa/);
  assert.match(enProse, /Details are on \[Gangneung Noodle Festival/);
  assert.doesNotMatch(enProse, /how to get there|getting there/i);
  assert.equal(
    acceptFestivalModelOpening('강릉 국수 축제 runs 10/15–18. Nearby, 경포해변.', enFacts),
    '',
  );

  const endedCtx = buildFestivalMooniContext({
    item: {
      title: '봄꽃 축제',
      contentId: '1',
      titleEn: 'Spring Flower Festival',
      eventStartDate: '20260101',
      eventEndDate: '20260103',
    },
    overview: '내년에도 개최합니다. 개막 공연이 있어요.',
    program: '개막 공연',
    nearbyPlaces: ['경포해변'],
  });
  const endedFacts = buildFestivalFirstAnswerFacts(endedCtx, { locale: 'en', now: NOW });
  assert.match(endedFacts.dateLine, /has ended/);
  assert.match(endedFacts.dateLine, /The next edition is next year/);
  const messy = acceptFestivalModelOpening(
    'Nearby, you can walk to Gyeongpo Beach (경포해변). Visitors engage with various hands-on programs. The lively atmosphere continues into the evening. Spring Flower Festival (봄꽃 축제) ran 1/1–3 and has ended.',
    endedFacts,
  );
  assert.doesNotMatch(messy, /hands-on programs|lively atmosphere/i);
  assert.ok(messy.indexOf('has ended') < messy.toLowerCase().indexOf('nearby'));
  assert.match(messy, /next year|next edition/i);
});

test('captured fixtures explain the scene without passes or bare English Hangul', () => {
  const palace = JSON.parse(readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/1998564.json'), 'utf8'));
  const palaceCtx = buildFestivalMooniContext(palace);
  const palaceEn = buildFestivalFirstAnswerFacts(palaceCtx, { locale: 'en', now: NOW });
  const palaceKo = buildFestivalFirstAnswerFacts(palaceCtx, { locale: 'ko', now: NOW });
  assert.equal(palaceEn.titleEn, 'Royal Culture Festival (궁중문화축전)');
  assert.ok(!palaceKo.programs.some((name) => /궁패스|굿즈/.test(name)));
  assert.ok(!palaceEn.programs.some((name) => /궁패스|굿즈/.test(name)));
  assert.ok(palaceEn.programs.every((name) => !/[가-힣]/.test(name.replace(/\([^)]*\)/g, ''))));
  assert.ok(palaceEn.nearby.length >= 2);
  assert.ok(palaceEn.nearby.every((name) => /\([가-힣]/.test(name)));
  assert.ok(palaceKo.overviewFacts.length >= 1);
  assert.doesNotMatch(palaceKo.overviewFacts.join(' '), /방청|입장료/);
  assert.match(palaceEn.overviewFacts.join(' '), /performances and try hands-on programs/);
  assert.doesNotMatch(palaceEn.overviewFacts.join(' '), /Gungjung|Maenyeon|Pyeolchyeo/);
  assert.ok(palaceEn.overviewFacts.every((line) => line.length <= 160));

  const busan = JSON.parse(readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/2855626.json'), 'utf8'));
  const busanEn = buildFestivalFirstAnswerFacts(buildFestivalMooniContext(busan), { locale: 'en', now: NOW });
  assert.equal(busanEn.titleEn, 'Heosimcheong Brewery Oktoberfest (허심청브로이 옥토버페스트)');
  assert.doesNotMatch(busanEn.dateLine, /^허심청브로이/);
  assert.match(busanEn.overviewFacts.join(' '), /drink beer/);
  assert.doesNotMatch(busanEn.overviewFacts.join(' '), /Maekju|Oktobeopeseuteu/);

  const gang = JSON.parse(readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/2930716.json'), 'utf8'));
  const gangEn = buildFestivalFirstAnswerFacts(buildFestivalMooniContext(gang), { locale: 'en', now: NOW });
  assert.match(gangEn.nearby[0], /Gangneung Ogeumjip \(강릉 오금집\)/);
  assert.match(gangEn.nearby.join(' '), /Gangneung Hyanggyo \(강릉향교\)/);
  assert.match(gangEn.nearby.join(' '), /Donghae Santa Train \(동해산타열차\)/);
  assert.doesNotMatch(gangEn.nearby.join(' '), /Gangreunghyanggyo|Donghaesantayeolcha/);
  assert.ok(gangEn.nearby.every((name) => /\([가-힣]/.test(name)));
  assert.match(palaceEn.nearby.join(' '), /Bukchon Hanok Village Gamgodang-gil \(북촌한옥마을 감고당길\)/);
  assert.match(palaceEn.nearby.join(' '), /Atti Rickshaw \(아띠인력거\)/);
  assert.doesNotMatch(palaceEn.nearby.join(' '), /Bukchonhanokmaeul|Attiinryeokgeo/);
  assert.match(busanEn.nearby.join(' '), /Geumgang Temple \(금강사\)/);
  assert.match(busanEn.nearby.join(' '), /Geumgang Botanical Garden \(금강식물원\)/);
  assert.doesNotMatch(busanEn.nearby.join(' '), /금강사\(부산\)|Geumgangsikmulwon/);
});

test('promo wording in a beer sentence is kept and a repeated title is dropped', () => {
  const ctx = buildFestivalMooniContext(GANGNEUNG);
  const facts = buildFestivalFirstAnswerFacts(ctx, { locale: 'ko', now: NOW });
  const beer = '강릉 국수 축제는 10/15~18에 열려요. 시원한 맥주를 마음껏 마시며 즐길 수 있어요.';
  assert.match(acceptFestivalModelOpening(beer, facts), /마음껏/);
  const repeated = '강릉 국수 축제는 장칼국수, 막국수를 맛보는 자리예요. 강릉 국수 축제는 10/15~18. 근처에서는 경포해변을 둘러볼 수 있어요.';
  const kept = acceptFestivalModelOpening(repeated, facts);
  assert.match(kept, /장칼국수, 막국수/);
  assert.match(kept, /10\/15~18, 엿새 뒤 시작해요/);
  assert.equal((kept.match(/강릉 국수 축제/g) || []).length, 2);
  assert.match(kept, /\[강릉 국수 축제 페이지\]/);
  assert.match(kept, /^강릉 국수 축제/);
  assert.equal(formatNearbyPlaceLabel('노암터널'), '');
  assert.equal(formatNearbyPlaceLabel('금강사(부산)'), 'Geumgang Temple (금강사)');
  assert.equal(formatNearbyPlaceLabel('강릉향교'), 'Gangneung Hyanggyo (강릉향교)');
});

test('leading facts JSON is stripped before the title check', () => {
  const input = JSON.parse(readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/2855626.json'), 'utf8'));
  const ctx = buildFestivalMooniContext(input);
  const facts = buildFestivalFirstAnswerFacts(ctx, { locale: 'ko', now: NOW });
  const echo = '{"title":"허심청브로이 옥토버페스트","dateLine":"10/15~17"}\n허심청브로이 옥토버페스트는 10/15~17, 엿새 뒤 시작해요. 시원한 맥주를 마음껏 마시며 즐길 수 있어요.';
  const kept = acceptFestivalModelOpening(echo, facts, [ctx.address, ctx.timeText, ctx.feeText]);
  assert.match(kept, /^허심청브로이 옥토버페스트/);
  assert.doesNotMatch(kept, /\{"title"/);
  assert.match(kept, /마음껏/);
  const fenced = `\`\`\`json\n{"title":"허심청브로이 옥토버페스트","dateLine":"10/15~17"}\n\`\`\`\n${echo.split('\n')[1]}`;
  const fromFence = acceptFestivalModelOpening(fenced, facts, [ctx.address, ctx.timeText, ctx.feeText]);
  assert.match(fromFence, /^허심청브로이 옥토버페스트/);
  assert.doesNotMatch(fromFence, /```|\{"title"/);
});

test('2855626 formal endings are rewritten before the title check', () => {
  const input = JSON.parse(readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/2855626.json'), 'utf8'));
  const ctx = buildFestivalMooniContext(input);
  const facts = buildFestivalFirstAnswerFacts(ctx, { locale: 'ko', now: NOW });
  const raw = [
    '허심청브로이 옥토버페스트는 10/15~17에 특별한 맥주 축제를 엽니다.',
    '허심청브로이 옥토버페스트에서는 라이브 퍼포먼스가 펼쳐집니다.',
    '금강식물원 근처에 있습니다.',
  ].join(' ');
  const kept = acceptFestivalModelOpening(raw, facts, [ctx.address, ctx.timeText, ctx.feeText]);
  assert.match(kept, /^허심청브로이 옥토버페스트/);
  assert.equal((kept.match(/허심청브로이 옥토버페스트/g) || []).length, 2);
  assert.match(kept, /\[허심청브로이 옥토버페스트 페이지\]/);
  assert.match(kept, /특별한 맥주 축제를 열어요/);
  assert.match(kept, /라이브 퍼포먼스가 펼쳐져요/);
  assert.match(kept, /근처에 있어요/);
  assert.doesNotMatch(kept, /엽니다|집니다|습니다|입니다/);
  const liked = acceptFestivalModelOpening(
    '허심청브로이 옥토버페스트는 10/15~17에 특별한 맥주 축제를 엽니다. 분위기가 좋습니다. 공식 채널에서 확인하세요.',
    facts,
    [ctx.address, ctx.timeText, ctx.feeText],
  );
  assert.match(liked, /좋아요/);
  assert.match(liked, /확인하세요/);
  assert.doesNotMatch(liked, /좋습니다/);
  assert.equal(
    acceptFestivalModelOpening(
      '허심청브로이 옥토버페스트는 10/15~17에 특별한 맥주 축제를 엽니다. 시작까지 남았습니다.',
      facts,
      [ctx.address, ctx.timeText, ctx.feeText],
    ),
    '',
  );
  const system = renderFestivalFirstAnswer('ko', { title: '허심청브로이 옥토버페스트' }).system;
  assert.match(system, /모든 문장은 -요로 끝난다/);
  assert.match(system, /축제 제목은 첫 문장에서 한 번만/);
  assert.match(system, /예: 축제는 10\/15~18, 엿새 뒤 시작해요/);
  assert.match(system, /하세요/);
});

test('Jeju press-release overview and program labels stay off the card', () => {
  const ctx = buildFestivalMooniContext({
    item: {
      contentId: '3554702',
      title: '2026 원도심 야간여행 ‘섬夜시즌’',
      eventStartDate: '20261017',
      eventEndDate: '20261018',
      addr1: '제주특별자치도 제주시 중앙로 1 (건입동)',
    },
    intro: { eventplace: '제주시 탑동광장', playtime: '18:00~20:40' },
    summaryFields: {
      timeText: '18:00~20:40',
      fee: { text: '무료 ※ 나이트워크 선착순 사전신청 참가비 5,000원' },
    },
    overview:
      '제주특별자치도와 제주특별자치도관광협회는 10월 17일(토)부터 18일(일)까지 2일간 제주시 원도심 일대에서 「2026 원도심 야간여행 섬夜시즌」 축제를 개최한다. 특히 축제 첫날인 17일에는 일상의 분주함을 잠시 내려놓고 원도심 일대를 걸으며 정취를 느끼는 「나이트워크」가 열린다. 또한 양일간 제주시 탑동광장에서는 콘서트와 불꽃놀이가 펼쳐질 예정이다.',
    program: '주요 프로그램 : 나이트워크, 섬夜 콘서트, 부대 행사, 프로그램 : 섬夜 불꽃놀이',
    nearbyPlaces: ['제주항'],
  });
  const ko = buildFestivalMooniSentenceAnswer(ctx, { locale: 'ko', now: NOW });
  assert.match(ko, /10\/17~18, 여드레 뒤 시작해요/);
  assert.match(ko, /나이트워크, 섬夜 콘서트, 부대 행사가 있어요/);
  assert.match(ko, /탑동광장에서 저녁까지 이어져요/);
  assert.match(ko, /근처에서는 제주항을 둘러볼 수 있어요/);
  assert.doesNotMatch(ko, /프로그램\s*:|불꽃놀이|중앙로|5,000|하나예요|기준/);
  assert.doesNotMatch(ko, /개최/);
  assert.doesNotMatch(ko, /관광협회/);
  assert.doesNotMatch(ko, /정취/);
  assert.doesNotMatch(ko, /내려놓/);
  assert.doesNotMatch(ko, /열린다/);
  assert.doesNotMatch(ko, /펼쳐질/);
  assert.doesNotMatch(ko, /또한 양일간/);
  assert.match(ko, /\?festival=3554702/);
  assert.match(ko, /자세한 내용은 \[2026 원도심 야간여행 ‘섬夜시즌’ 페이지\]/);
  assert.doesNotMatch(ko, /가는 법/);
  assert.ok(countFestivalCardSentences(ko) <= 5);

  const enCtx = { ...ctx, feeText: 'Free' };
  const en = buildFestivalMooniSentenceAnswer(enCtx, { locale: 'en', now: NOW });
  assert.match(en, /Night festival \(2026 원도심 야간여행 ‘섬夜시즌’\)/);
  assert.match(en, /Night Walk \(나이트워크\)/);
  assert.match(en, /starts in 8 days/);
  assert.match(en, /Tapdong Plaza \(탑동광장\)/);
  assert.doesNotMatch(en, /admission is free|is held at|Gungjung/i);
  assert.doesNotMatch(en, /from ICN|how to get there|getting there/i);
  assert.match(en, /Details are on \[Night festival/);
});

test('festival chips: four answers plus overseas group, English puts overseas first', () => {
  const replies = readFileSync(join(root, 'src/pages/Home/lib/mooniQuickReplies.js'), 'utf8');
  const chips = readFileSync(join(root, 'src/components/chat/MooniQuickReplyChips.jsx'), 'utf8');
  assert.match(replies, /en \? \[FESTIVAL_OVERSEAS_L1, \.\.\.FESTIVAL_CORE_L1\]/);
  assert.match(replies, /id: 'festival_sights'/);
  assert.match(replies, /id: 'festival_access', drillDown: true/);
  assert.match(replies, /id: 'festival_overseas', drillDown: true/);
  const origins = readFileSync(join(root, 'src/pages/Home/lib/festivalDomesticOrigins.js'), 'utf8');
  assert.match(origins, /축제장까지 대중교통과 차로 가는 법/);
  assert.match(origins, /to this festival by public transit and by car/);
  assert.match(origins, /id: 'incheon', ko: '인천'/);
  assert.match(origins, /id: 'jeonnam', ko: '여수'/);
  assert.doesNotMatch(origins, /iata:/);
  assert.match(chips, /withGroupChipCaret\(chip\.label, chip\.drillDown\)/);

  const koFest = koLocale.mooni.chips.festival;
  assert.equal(koFest.festival_sights.label, '🎪 볼거리·분위기');
  assert.equal(koFest.festival_access.label, '🚆 가는 법');
  assert.equal(koFest.festival_nearby.label, '🍜 근처 먹고 둘러볼 곳');
  assert.equal(koFest.festival_day.label, '🗺️ 하루 동선');
  assert.equal(koFest.festival_overseas.label, '해외에서 오시나요?');
  assert.equal(enLocale.mooni.chips.festival.festival_overseas.label, 'Visiting from abroad?');
  for (const id of [
    'festival_sights',
    'festival_access',
    'festival_nearby',
    'festival_day',
    'festival_overseas_visa',
    'festival_overseas_flight',
    'festival_overseas_airport',
  ]) {
    assert.ok(KO.chips[id], id);
    assert.ok(EN.chips[id], id);
  }
});

test('festival access drill-down opens origin chips without auto-sending Seoul', () => {
  const chatModal = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.match(chatModal, /showFestivalAccessDock/);
  assert.match(chatModal, /data-testid="mooni-festival-access-dock"/);
  assert.doesNotMatch(chatModal, /useCardTransport:\s*true/);
  assert.doesNotMatch(chatModal, /확인된 열차와 버스 시각을 알려줘/);
  assert.match(chatModal, /onDrillDown:\s*\(parentId\)\s*=>\s*\{\s*setTopicDockParent\(parentId\);/);
  assert.match(chatModal, /polishFestivalModelReply\(festivalMergedReply/);
});

test('festival access hint urges real routes when TAGO times are missing', async () => {
  const assist = readFileSync(join(root, 'src/shared/korea/mooniKoreaFestivalAssist.js'), 'utf8');
  assert.match(assist, /isFestivalAccessAsk/);
  assert.match(assist, /festivalAccessVenueGuidanceLines/);
  assert.match(assist, /역에서 축제장까지/);
  const gukhyang = await resolveMooniChatKoreaFestivalHint({
    chipId: 'festival_access',
    userText: '서울에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘',
    departureLabel: '서울',
    locale: 'ko',
    festivalContext: {
      contentId: '638576',
      title: '국향대전',
      venue: '함평엑스포공원',
      address: '전라남도 함평군 함평읍 수호리',
      eventStartDate: '20261023',
      eventEndDate: '20261108',
      overview: '국화가 만개하는 축제입니다.',
      program: '개막식',
    },
  });
  assert.doesNotMatch(gukhyang.hint, /^- 개요:/m);
  assert.match(gukhyang.hint, /함평역/);
  assert.match(gukhyang.hint, /역에서 축제장까지/);
  assert.match(gukhyang.hint, /KTX는 평소 함평역에 정차하지 않/);
  assert.match(gukhyang.hint, /무궁화·ITX-새마을/);
  assert.match(gukhyang.hint, /광주송정/);
  const daeguGukhyang = await resolveMooniChatKoreaFestivalHint({
    chipId: 'festival_access',
    userText: buildFestivalAccessAskText('daegu', 'ko'),
    departureLabel: '대구',
    locale: 'ko',
    festivalContext: {
      contentId: '638576',
      title: '국향대전',
      venue: '함평엑스포공원',
      address: '전라남도 함평군 함평읍 수호리',
      eventStartDate: '20261023',
      eventEndDate: '20261108',
      transport: { origins: [{ label: '대구', segments: [] }], selected: { segments: [] } },
    },
  });
  assert.match(daeguGukhyang.hint, /이 안내만 보고 출발해요/);
  assert.match(daeguGukhyang.hint, /확인된 직통 열차/);
  assert.match(daeguGukhyang.hint, /서부·동대구/);
  assert.doesNotMatch(daeguGukhyang.hint, /KTX·SRT는 동대구역에서 출발하도록/);
  const masan = await resolveMooniChatKoreaFestivalHint({
    chipId: 'festival_access',
    userText: '부산에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘',
    locale: 'ko',
    festivalContext: {
      contentId: '637693',
      title: '마산가고파국화축제',
      venue: '3·15해양누리공원',
      address: '경상남도 창원시 마산합포구',
      eventStartDate: '20261031',
      eventEndDate: '20261108',
    },
  });
  assert.match(masan.hint, /마산역/);
  assert.match(masan.hint, /창원중앙역은 보조|창원중앙역은 같은 대중교통/);
  assert.match(masan.hint, /자가용.*창원중앙역을 다시 넣지|자가용 문단 뒤에 창원중앙역/);
  assert.match(assist, /bustago\.or\.kr/);
  assert.match(assist, /appendFestivalAccessBookingLinks/);
  assert.match(KO.chips.festival_access.rules.join('\n'), /당신을 믿고 이 축제에 갑니다/);
  assert.match(KO.chips.festival_access.rules.join('\n'), /KTX 역과 SRT 역/);
  assert.match(KO.chips.festival_access.rules.join('\n'), /광명·용산에서는 SRT가 없다/);
  assert.match(KO.chips.festival_access.rules.join('\n'), /버스타고/);
});

test('festival departure chips are 17 cities, swap the host city, and stay off airports', () => {
  const provinces = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  ];
  const provinceOnly = ['경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남'];
  assert.equal(FESTIVAL_DOMESTIC_ORIGINS.length, 17);
  assert.equal(festivalDomesticLabelsAreCities(), true);
  assert.deepEqual(
    [...FESTIVAL_DOMESTIC_ORIGINS.map((row) => row.province)].sort(),
    [...provinces].sort(),
  );
  const labels = FESTIVAL_DOMESTIC_ORIGINS.map((row) => row.ko);
  assert.equal(new Set(labels).size, labels.length);
  for (const name of provinceOnly) assert.equal(labels.includes(name), false, name);
  for (const row of FESTIVAL_DOMESTIC_ORIGINS) {
    assert.equal(festivalOriginLabel(row.id, 'ko'), row.ko, row.id);
    assert.equal(row.iata, undefined, row.id);
  }
  assert.equal(labels.includes('수원'), true);
  assert.equal(labels.includes('천안'), true);
  assert.equal(labels.includes('전주'), true);
  assert.equal(labels.includes('포항'), true);
  assert.equal(labels.includes('창원'), true);
  const originsSrc = readFileSync(join(root, 'src/pages/Home/lib/festivalDomesticOrigins.js'), 'utf8');
  assert.doesNotMatch(originsSrc, /KAG|HIN|KPO|KUV|ICN|GMP/);
  assert.equal(resolveDepartureIataFromChat('강릉 공항'), 'YNY');
  assert.notEqual(resolveDepartureIataFromChat('강릉에서 가자'), 'KAG');

  const gangneung = visibleFestivalDomesticOrigins('강릉', '강원특별자치도 강릉시 경강로 2111');
  assert.equal(gangneung.length, 17);
  assert.equal(gangneung.some((row) => row.ko === '강릉'), false);
  assert.equal(gangneung.some((row) => row.ko === '원주'), true);
  assert.equal(gangneung.some((row) => row.ko === '서울'), true);

  const masan = visibleFestivalDomesticOrigins('마산', '경상남도 창원시 마산합포구 3·15대로');
  assert.equal(masan.length, 17);
  assert.equal(masan.some((row) => row.ko === '경남' || row.ko === '창원'), false);
  assert.equal(masan.some((row) => row.ko === '진주'), true);

  const yeosuAsk = buildFestivalAccessAskText('jeonnam', 'ko');
  assert.match(yeosuAsk, /여수에서 이 축제장까지/);
  assert.doesNotMatch(yeosuAsk, /안내해 주세요|여수EXPO역|여수종합버스터미널/);
  const seoulAsk = buildFestivalAccessAskText('seoul', 'ko');
  assert.equal(seoulAsk, '서울에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘');
  assert.doesNotMatch(seoulAsk, /KTX|SRT|안내해 주세요|용산역/);
  const incheonAsk = buildFestivalAccessAskText('incheon', 'ko');
  assert.equal(incheonAsk, '인천에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘');
  assert.doesNotMatch(incheonAsk, /KTX|SRT|안내해|부평/);
  const cheonanRow = findFestivalDomesticOrigin('chungnam');
  assert.match(formatOriginHubGuidance(cheonanRow, 'ko'), /천안아산역/);
  assert.doesNotMatch(formatOriginHubGuidance(cheonanRow, 'ko'), /수서|평택지제/);
  const daeguRow = findFestivalDomesticOrigin('daegu');
  assert.match(formatOriginHubGuidance(daeguRow, 'ko'), /KTX·SRT는 동대구역/);
  const seoulRow = domesticFestivalGroundOrigin('서울에서 이 축제장까지 어떻게 가?', '');
  assert.equal(seoulRow?.ko, '서울');
  assert.match(domesticGroundModelSuffix(seoulRow, 'ko'), /용산역/);
  const session = { departureIata: 'ICN', departureAirportLabel: '서울' };
  clearDomesticAirportDeparture(session);
  assert.equal(session.departureIata, '');
  assert.equal(session.departureAirportLabel, '');
  assert.equal(domesticFestivalGroundOrigin('서울에서 비행기로 가', '서울'), null);

  const history = [{ text: '서울에서 어떻게 가?', departureLabel: '서울', role: 'user' }];
  assert.equal(
    resolveDepartureLabelFromChat(yeosuAsk, history),
    '여수',
  );
  assert.equal(
    resolveDepartureLabelFromChat('서울에서 어떻게 가?', history, { departureLabel: '여수' }),
    '여수',
  );
});

test('domestic festival origin payload drops airports; overseas chip keeps them', () => {
  const guide = {
    primary_arrival_airports_iata: ['ICN', 'GMP'],
    categories: {
      pre_travel: [{ title: 'K-ETA 신청' }],
      flight: { advice: '인천국제공항(ICN) 또는 김포국제공항(GMP).' },
    },
  };
  const place = {
    festivalContext: true,
    slug: 'festival-probe-no-spot',
    destinationName: '강릉 국수 축제',
    essentialGuide: guide,
    locale: 'ko',
  };
  const air = /ICN|GMP|K-ETA|공항|airport/i;
  const requestBody = (prepared) => JSON.stringify({
    chipId: prepared.chipFacts?.chipId ?? null,
    facts: prepared.chipFacts?.facts ?? null,
    tripSession: hasMooniTripSessionFacts(prepared.session) ? prepared.session : null,
    userText: prepared.modelUserText,
  });

  const beforeFacts = extractMooniChipPromptFacts({
    userText: '서울에서 가요',
    slug: place.slug,
    destinationName: place.destinationName,
    essentialGuide: guide,
    locale: 'ko',
  });
  const beforeHint = renderChipHint('ko', beforeFacts.chipId, beforeFacts.facts, false);
  assert.match(beforeHint, /대화에서 추정한 출발 공항: 인천국제공항\(ICN\) \(서울\)/);
  assert.match(beforeHint, /K-ETA/);
  assert.match(beforeHint, /GMP/);

  const typed = prepareFestivalMooniChatPayload({ ...place, userText: '서울에서 가요', chipId: null });
  const seoulChip = prepareFestivalMooniChatPayload({
    ...place,
    userText: buildFestivalAccessAskText('seoul', 'ko'),
    chipId: 'festival_access',
    departureLabel: '서울',
  });
  assert.equal(typed.chipFacts.chipId, 'festival_access');
  assert.equal(seoulChip.chipFacts.chipId, 'festival_access');
  assert.doesNotMatch(requestBody(typed), air);
  assert.doesNotMatch(requestBody(seoulChip), air);
  assert.equal(typed.modelUserText, '서울에서 가요');
  assert.equal(seoulChip.modelUserText, buildFestivalAccessAskText('seoul', 'ko'));
  assert.doesNotMatch(seoulChip.modelUserText, /KTX는|안내해 주세요/);

  const overseas = prepareFestivalMooniChatPayload({
    ...place,
    userText: '공항에서 이 축제장까지 가는 법을 알려줘. 확인되지 않은 셔틀은 말하지 마.',
    chipId: 'festival_overseas_airport',
  });
  const overseasBody = requestBody(overseas);
  assert.equal(overseas.chipFacts.chipId, 'festival_overseas_airport');
  assert.match(overseasBody, /ICN/);
  assert.match(overseasBody, /GMP/);
  assert.match(overseasBody, /K-ETA/);
  assert.match(overseasBody, /공항|airport/);

  const incheonAirport = prepareFestivalMooniChatPayload({
    ...place,
    userText: '인천공항에서 가요',
    chipId: null,
  });
  assert.match(requestBody(incheonAirport), /ICN/);
  assert.match(requestBody(incheonAirport), /공항/);

  const outsideFestival = prepareFestivalMooniChatPayload({
    ...place,
    festivalContext: false,
    userText: '서울에서 가요',
    chipId: null,
  });
  assert.match(requestBody(outsideFestival), /인천국제공항\(ICN\)/);
});

test('general chips drop duplicate why-go and flights, and rename local transport', () => {
  const replies = readFileSync(join(root, 'src/pages/Home/lib/mooniQuickReplies.js'), 'utf8');
  const explore = replies.slice(replies.indexOf('const L2_EXPLORE'), replies.indexOf('const L2_ACCESS_EXTRAS'));
  const prep = replies.slice(replies.indexOf('const L2_PREP'), replies.indexOf('const L2_ENJOY'));
  assert.doesNotMatch(explore, /why_go/);
  assert.doesNotMatch(prep, /prep_flight/);
  assert.match(prep, /prep_transport/);
  assert.equal(koLocale.mooni.chips.l2.prep.prep_transport.label, '현지 교통');
  assert.equal(enLocale.mooni.chips.l2.prep.prep_transport.label, 'Local transport');
});

test('festival lodging answers end on the stay-section link', async () => {
  assert.equal(
    gateoKoreaFestivalLodgingUrl('2930716'),
    'https://www.gateo.kr/korea/?festival=2930716#festival-lodging',
  );
  assert.equal(isFestivalLodgingAsk({ chipId: 'prep_hotel', userText: '볼거리' }), true);
  assert.equal(isFestivalLodgingAsk({ userText: 'where to stay near this festival' }), true);
  assert.equal(isFestivalLodgingAsk({ userText: '숙소는 어디가 좋아요' }), true);
  assert.equal(isFestivalLodgingAsk({ userText: '축제에서 볼 수 있는 것과 현장 분위기' }), false);

  const ko = appendFestivalLodgingNextStep('강릉 월화거리에서 열려요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '숙소 추천해줘',
  });
  assert.match(ko, /다음으로 이 축제의 \[숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716#festival-lodging\)에서 볼 수 있어요\.$/);
  assert.equal(
    appendFestivalLodgingNextStep(ko, { contentId: '2930716', userText: '숙소' }),
    ko,
  );

  const en = appendFestivalLodgingNextStep('It is in Gangneung.', {
    contentId: '2930716',
    locale: 'en',
    chipId: 'prep_hotel',
  });
  assert.match(en, /\[the lodging card\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716#festival-lodging\)\.$/);

  const sights = appendFestivalLodgingNextStep('먹거리존이 있어요.', {
    contentId: '2930716',
    locale: 'ko',
    chipId: 'festival_sights',
    userText: '축제에서 볼 수 있는 것',
  });
  assert.doesNotMatch(sights, /festival-lodging/);

  const lodgingHint = await resolveMooniChatKoreaFestivalHint({
    userText: 'where to stay',
    festivalContext: { title: '강릉 국수 축제', contentId: '2930716' },
    locale: 'en',
  });
  assert.match(lodgingHint.hint, /#festival-lodging/);
  assert.match(lodgingHint.hint, /no other stay URL/i);

  const otherHint = await resolveMooniChatKoreaFestivalHint({
    userText: 'what can I see',
    festivalContext: { title: '강릉 국수 축제', contentId: '2930716' },
    locale: 'en',
  });
  assert.doesNotMatch(otherHint.hint, /festival-lodging/);

  const rawLodging = polishFestivalModelReply(
    '월화거리 근처 호텔이 편해요. https://www.gateo.kr/korea/?festival=2930716#festival-lodging',
    { contentId: '2930716', locale: 'ko', userText: '숙소 추천해줘' },
  );
  assert.match(rawLodging, /\[숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716#festival-lodging\)/);
  assert.doesNotMatch(rawLodging, /(?<!\]\()https:\/\/www\.gateo\.kr/);
  assert.equal(
    (rawLodging.match(/festival-lodging/g) || []).length,
    1,
  );

  const rawPage = appendFestivalLodgingNextStep(
    '일정은 https://www.gateo.kr/korea/?festival=2930716 에 있어요.',
    { contentId: '2930716', locale: 'ko', userText: '숙소' },
  );
  assert.match(rawPage, /\[축제 페이지\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716\)/);
  assert.match(rawPage, /\[숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716#festival-lodging\)/);
  assert.doesNotMatch(rawPage, /(?<!\]\()https:\/\/www\.gateo\.kr/);

  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  assert.match(chat, /polishFestivalModelReply/);
  assert.match(sheet, /id=\{FESTIVAL_LODGING_SECTION_ID\}/);
  assert.match(sheet, /FESTIVAL_LODGING_EVENT/);
});

test('English card translates fees and addresses and does not romanize festival names', () => {
  assert.equal(romanizeFestivalTitle('궁중문화축전'), 'Gungjungmunhwachukjeon');
  assert.equal(dropHanjaParentheticals('백(白)의 질서'), '백의 질서');
  assert.equal(translateDescriptiveKorean('프로그램별 상이'), 'varies by program');
  assert.match(translateDescriptiveKorean('유료 34000원 얼리버드 특가'), /Paid/);
  assert.match(translateDescriptiveKorean('유료 34000원 얼리버드 특가'), /34,000 won/);
  assert.doesNotMatch(translateDescriptiveKorean('유료 34000원 얼리버드 특가'), /Yuryo|Eolribeodeu|Teukga/);
  const address = formatEnglishThenKorean('부산광역시 동래구 금강공원로20번길');
  assert.match(address, /Dongnae-gu, Busan/);
  assert.doesNotMatch(address, /Busangwangyeoksi|Dongraegu/);
  assert.equal(formatFestivalProgramLabel('메인 푸드존'), 'Main Food Zone (메인 푸드존)');
  assert.equal(formatFestivalProgramLabel('국수존'), 'Guksu Zone (국수존)');
  assert.equal(formatFestivalProgramLabel('라이브 공연'), 'live performance (라이브 공연)');
  assert.equal(formatFestivalProgramLabel('조선 공간 미학: 백의 질서'), '조선 공간 미학: 백의 질서');

  const palaceVenue = '경복궁, 창덕궁, 창경궁, 덕수궁';
  assertNameListKept(formatEnglishThenKorean(palaceVenue), palaceVenue);
  const palace = buildFestivalMooniContext({
    item: { contentId: '1998564', title: '궁중문화축전' },
    intro: { eventplace: palaceVenue },
    summaryFields: { fee: { text: '프로그램별 상이' } },
    program: '조선 공간 미학: 백(白)의 질서\n메인 푸드존\n페어링 존\n불꽃놀이',
  });
  const ko = buildFestivalMooniSentenceAnswer(palace, { locale: 'ko', now: NOW });
  const en = buildFestivalMooniSentenceAnswer(palace, { locale: 'en', now: NOW });
  assert.match(ko, /조선 공간 미학: 백의 질서/);
  assert.match(ko, /메인 푸드존/);
  assert.doesNotMatch(ko, /불꽃놀이|백 의|경복궁|프로그램별|기준/);
  assert.match(en, /^Royal Culture Festival \(궁중문화축전\) includes Main Food Zone \(메인 푸드존\) and Pairing Zone \(페어링 존\)/);
  assert.doesNotMatch(en, /This festival|Gungjungmunhwachukjeon|Joseon Gonggan|is held at|varies by program|Fireworks|불꽃놀이|백 의/);
  assert.doesNotMatch(en.replace(/\([^)]*\)/g, ''), /[가-힣]/);

  const titled = buildFestivalMooniContext({
    item: {
      contentId: '1998564',
      title: '궁중문화축전',
      titleEn: 'Royal Culture Festival (궁중문화축전)',
    },
  });
  const titledEn = buildFestivalMooniSentenceAnswer(titled, { locale: 'en', now: NOW });
  assert.match(titledEn, /Royal Culture Festival \(궁중문화축전\)/);
  assert.doesNotMatch(titledEn, /This festival|Gungjungmunhwachukjeon/);

  const busanVenue = '호텔농심 야외마당 & 비어가든';
  assertNameListKept(formatEnglishThenKorean(busanVenue), busanVenue);
  const busan = buildFestivalMooniContext({
    item: {
      contentId: '2855626',
      title: '허심청브로이 옥토버페스트',
      addr1: '부산광역시 동래구 금강공원로20번길',
    },
    intro: { eventplace: busanVenue },
    summaryFields: { fee: { text: '유료 34000원 얼리버드 특가' } },
    program: '라이브 공연\n비어 텐트\n전통 의상\n음악 무대',
  });
  const busanKo = buildFestivalMooniSentenceAnswer(busan, { locale: 'ko', now: NOW });
  const busanEn = buildFestivalMooniSentenceAnswer(busan, { locale: 'en', now: NOW });
  assert.match(busanKo, /라이브 공연, 비어 텐트, 전통 의상이 있어요/);
  assert.doesNotMatch(busanKo, /금강공원로|34000|얼리버드|호텔농심/);
  assert.match(busanEn, /^Heosimcheong Brewery Oktoberfest \(허심청브로이 옥토버페스트\) includes live performance \(라이브 공연\)/);
  assert.doesNotMatch(busanEn, /비어 텐트|전통 의상|Heosimcheongbeuroi|Dongnae-gu|34,000|Hotel Nongsim|음악 무대/);
  assert.doesNotMatch(busanEn.replace(/\([^)]*\)/g, ''), /[가-힣]/);
  const busanTitled = buildFestivalMooniSentenceAnswer(
    buildFestivalMooniContext({
      item: {
        contentId: '2855626',
        title: '허심청브로이 옥토버페스트',
        titleEn: 'Heosimcheong Brewery Oktoberfest',
      },
      intro: { eventplace: busanVenue },
    }),
    { locale: 'en', now: NOW },
  );
  assert.match(busanTitled, /Heosimcheong Brewery Oktoberfest \(허심청브로이 옥토버페스트\)/);

  const noodle = buildFestivalMooniContext({
    item: { contentId: '2930716', title: '강릉 국수 축제' },
    intro: { eventplace: '강릉 월화거리 일원' },
    program: '국수존\n메인 먹거리존\n페어링 존\n후루룩 대회',
  });
  const noodleKo = buildFestivalMooniSentenceAnswer(noodle, { locale: 'ko', now: NOW });
  const noodleEn = buildFestivalMooniSentenceAnswer(noodle, { locale: 'en', now: NOW });
  assert.match(noodleKo, /국수존, 메인 먹거리존, 페어링 존이 있어요/);
  assert.doesNotMatch(noodleKo, /후루룩/);
  assert.match(noodleEn, /Guksu Zone \(국수존\)/);
  assert.match(noodleEn, /Main Food Zone \(메인 먹거리존\)/);
  assert.match(noodleEn, /Wolhwa Street \(월화거리\)/);
  assert.doesNotMatch(noodleEn, /후루룩|Listed programs include|[^u] Zone \(국수존\)|^Zone \(국수존\)/);
});

function assertNameListKept(rendered, source) {
  assert.doesNotMatch(rendered, /,,/);
  assert.doesNotMatch(rendered, /&\s*\(/);
  const koreanItems = source.split(/\s*[,&·・]\s*/).map((part) => part.trim()).filter((part) => /[가-힣]/.test(part));
  const englishSide = rendered.slice(0, rendered.indexOf(`(${source})`));
  const englishItems = englishSide.split(/\s*[,&·・]\s*/).map((part) => part.trim()).filter((part) => /[A-Za-z0-9]/.test(part));
  assert.equal(englishItems.length, koreanItems.length, `${englishSide} :: ${source}`);
  for (const item of englishItems) assert.match(item, /[A-Za-z0-9]/);
}

test('English place names lead and Korean stays in parentheses', () => {
  assert.equal(formatEnglishThenKorean('함평엑스포공원'), 'Hampyeong Expo Park (함평엑스포공원)');
  assert.equal(formatEnglishThenKorean('강릉 월화거리 일원'), 'Wolhwa Street (월화거리)');
  assert.equal(formatEnglishThenKorean('경포해변'), 'Gyeongpo Beach (경포해변)');

  const ctx = buildFestivalMooniContext({
    item: { contentId: '1', title: '함평 나비축제' },
    intro: { eventplace: '함평엑스포공원' },
    nearbyPlaces: ['함평엑스포공원', '월화거리'],
  });
  const ko = buildFestivalMooniSentenceAnswer(ctx, { locale: 'ko', now: NOW });
  const en = buildFestivalMooniSentenceAnswer(ctx, { locale: 'en', now: NOW });
  assert.match(ko, /함평 나비축제 근처에서는 함평엑스포공원, 월화거리를 둘러볼 수 있어요/);
  const yongcheon = buildFestivalMooniContext({
    item: { contentId: '2', title: '함평 나비축제' },
    location: { name: '함평군' },
    nearbyPlaces: ['용천사 함평', '함평엑스포공원'],
  });
  assert.deepEqual(yongcheon.nearbyPlaces, ['용천사', '함평엑스포공원']);
  const yongcheonKo = buildFestivalMooniSentenceAnswer(yongcheon, { locale: 'ko', now: NOW });
  assert.match(yongcheonKo, /용천사/);
  assert.doesNotMatch(yongcheonKo, /용천사 함평/);
  assert.doesNotMatch(ko, /하나예요/);
  assert.match(en, /Hampyeong Expo Park \(함평엑스포공원\)/);
  assert.match(en, /Wolhwa Street \(월화거리\)/);
  assert.match(en, /Near 함평 나비축제, you can walk to/);
  assert.doesNotMatch(en, /One nearby/);
  assert.ok(countFestivalCardSentences(ko) <= 5);
  assert.ok(countFestivalCardSentences(en) <= 5);
});

test('prod Edge 400 on a new chip retries once with a legacy chip', async () => {
  const tasks = readFileSync(join(root, 'supabase/functions/_shared/gemini/tasks.ts'), 'utf8');
  for (const id of LEGACY_MOONI_CHIP_IDS) {
    assert.match(tasks, new RegExp(`"${id}"`));
    assert.ok(KO.chips[id], id);
  }
  assert.equal(MOONI_CHIP_EDGE_FALLBACK.festival_sights, 'activities');
  assert.equal(MOONI_CHIP_EDGE_FALLBACK.festival_day, 'itinerary');
  assert.equal(MOONI_CHIP_EDGE_FALLBACK.festival_overseas_flight, 'prep_flight');

  const badRequest = new GeminiProxyError({
    kind: 'generic',
    userMessage: 'AI 서버와의 통신에 실패했습니다. 잠시 후 다시 시도해주세요.',
    devDetail: 'bad_request',
    httpStatus: 400,
    errorCode: 'bad_request',
  });
  const seen = [];
  const text = await invokeMooniChatToleratingChip(async (params) => {
    seen.push(params.chipId);
    if (params.chipId === 'festival_sights') throw badRequest;
    return { text: 'ok' };
  }, { chipId: 'festival_sights', userText: '볼거리' });
  assert.deepEqual(seen, ['festival_sights', 'activities']);
  assert.equal(text.text, 'ok');

  const quota = new GeminiProxyError({
    kind: 'quota',
    userMessage: 'limit',
    devDetail: 'quota',
  });
  await assert.rejects(
    () => invokeMooniChatToleratingChip(async () => {
      throw quota;
    }, { chipId: 'festival_day', userText: '동선' }),
    (error) => error.kind === 'quota',
  );

  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.match(chat, /invokeMooniChatToleratingChip/);
  const booking = readFileSync(join(root, 'src/utils/chatBookingResolver.js'), 'utf8');
  assert.match(booking, /domesticKoreaFestival/);
  assert.match(booking, /provider !== 'twelve_go'/);
});

test('festival replies link GATEO urls and drop sauna, broadcast, and 12Go lines', () => {
  const linked = linkifyBareGateoFestivalUrls(
    '자세히: https://www.gateo.kr/korea/?festival=2930716.',
    'ko',
  );
  assert.match(linked, /\[축제 페이지\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716\)/);
  assert.doesNotMatch(linked, /(?<!\]\()https:\/\/www\.gateo\.kr/);

  const stay = stripNonStayFacilities(
    '월화거리 호텔이 편해요. 기린사우나도 근처예요.',
    '숙소 추천',
  );
  assert.match(stay, /호텔/);
  assert.doesNotMatch(stay, /사우나/);
  assert.match(stripNonStayFacilities('사우나 추천해요.', '사우나 어디야'), /사우나/);

  const broadcast = stripUnaskedBroadcastLines('국수존이 있어요. KBS 방청 신청은 공식 안내를 보세요.', '프로그램');
  assert.match(broadcast, /국수존/);
  assert.doesNotMatch(broadcast, /방청/);
  assert.match(stripUnaskedBroadcastLines('KBS 방청은 사전 신청이에요.', '방청 방법'), /방청/);

  const twelve = stripDomesticTwelveGoMention('버스가 있어요. 12Go 바로가기로 예매하세요.');
  assert.match(twelve, /버스/);
  assert.doesNotMatch(twelve, /12Go/);
  const twelveSearch = polishFestivalModelReply('버스도 있어요. 교통편 검색(12Go)에서 확인하세요.', {
    contentId: '637693',
    locale: 'ko',
    chipId: 'festival_access',
    userText: buildFestivalAccessAskText('daegu', 'ko'),
  });
  assert.match(twelveSearch, /버스/);
  assert.doesNotMatch(twelveSearch, /12Go|12go/i);
  const invented = polishFestivalModelReply(
    '버스가 있어요. [강릉행 교통편 확인](https://www.gateo.kr/) [출발 전 준비] [교통 · 티켓]',
    { contentId: '2930716', locale: 'ko', userText: '근처' },
  );
  assert.doesNotMatch(invented, /gateo\.kr\/\)|출발 전 준비|교통 · 티켓/);
  assert.match(invented, /버스/);

  const entry = polishFestivalModelReply(
    '월화거리 호텔이 편해요. 입국 증빙으로 예약 확인서가 필요해요.',
    { contentId: '2930716', locale: 'ko', chipId: 'prep_hotel', userText: '숙소 추천' },
  );
  assert.match(entry, /호텔/);
  assert.doesNotMatch(entry, /입국 증빙/);
  assert.match(
    polishFestivalModelReply('입국 증빙이 필요해요.', {
      contentId: '2930716',
      chipId: 'visa_docs',
      userText: '비자',
    }),
    /입국 증빙/,
  );

  assert.equal(expandCompactDates('기간은 20261015부터예요.', 'en'), '기간은 October 15, 2026부터예요.');
  assert.equal(stripDisallowedFestivalLinks('[이동](https://www.gateo.kr/)'), '이동');
  assert.match(
    stripDisallowedFestivalLinks('[숙소 카드](https://www.gateo.kr/korea/?festival=2930716#festival-lodging)'),
    /festival-lodging/,
  );
  assert.equal(stripMooniUiChipLabels('끝 [출발 전 준비] [교통 · 티켓]'), '끝');
  assert.equal(stripMooniUiChipLabels('--- ### 교통 · 티켓 ### 출발 전 준비'), '');
  assert.equal(stripMooniUiChipLabels('### 교통 · 티켓 - ### 출발 전 준비 -'), '');
  assert.equal(stripMooniUiChipLabels('교통 · 티켓 출발 전 준비'), '');
  assert.equal(
    stripMooniUiChipLabels('인천에서 갑니다.\n\n열차·버스 시각은 링크예요. 교통 · 티켓 |'),
    '인천에서 갑니다.\n\n열차·버스 시각은 링크예요.',
  );
  const accessChipTail = polishFestivalModelReply(
    'KTX로 광명에서 출발해요.\n\n열차·버스 시각은 [코레일](https://www.letskorail.com/)에서 확인할 수 있어요. 교통 · 티켓 |',
    {
      chipId: 'festival_access',
      contentId: '2930716',
      locale: 'ko',
      userText: '인천에서 가는 법',
      eventStartDate: '20261015',
      eventEndDate: '20261018',
    },
  );
  assert.match(accessChipTail, /KTX로 광명에서 출발해요/);
  assert.doesNotMatch(accessChipTail, /교통\s*·\s*티켓/);
  assert.match(accessChipTail, /bustago\.or\.kr/);
  assert.equal(
    stripMooniUiChipLabels('[강릉행 KTX 노선 확인] [강릉 숙소 추천 리스트]'),
    '',
  );
  assert.equal(
    stripMooniUiChipLabels('답변입니다.\n---\n### Transport · tickets\n### Before you go'),
    '답변입니다.',
  );
  assert.match(
    stripMooniUiChipLabels('버스가 있어요. [숙소 카드](https://www.gateo.kr/korea/?festival=2930716#festival-lodging)'),
    /\[숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716#festival-lodging\)/,
  );
  const prepShown = polishFestivalModelReply(getMooniModelMarkdownForRender([
    '월화거리 호텔이 편해요.',
    '축제 기간: 10/15~18',
    '축제 상세 안내: 강릉에서 열려요',
    '「출발 전 준비」 플래너 링크',
  ].join('\n')), {
    contentId: '2930716',
    locale: 'ko',
    chipId: 'prep_hotel',
    userText: '숙소 추천',
  });
  assert.match(prepShown, /호텔이 편해요/);
  assert.doesNotMatch(prepShown, /플래너 링크|축제 기간:|축제 상세 안내:/);
  const bareLink = polishFestivalModelReply('숙소가 있어요.\n「출발 전 준비」 링크', {
    contentId: '2930716',
    locale: 'ko',
    chipId: 'prep_hotel',
    userText: '숙소',
  });
  assert.match(bareLink, /숙소가 있어요/);
  assert.doesNotMatch(bareLink, /「출발 전 준비」/);
  assert.match(
    stripMooniUiChipLabels('숙소가 있어요. [숙소 카드](https://www.gateo.kr/korea/?festival=2930716#festival-lodging) 「출발 전 준비」 플래너 링크'),
    /festival-lodging/,
  );
  const activities = polishFestivalModelReply(
    '국수 만들기가 준비되어 있답니다. 체험이 된답니다. 현지에서 한답니다.',
    { contentId: '2930716', locale: 'ko', chipId: 'festival_sights', userText: '체험' },
  );
  assert.match(activities, /있어요/);
  assert.match(activities, /돼요/);
  assert.match(activities, /한대요/);
  assert.doesNotMatch(activities, /답니다/);
  const formalChip = polishFestivalModelReply(
    '허심청브로이 옥토버페스트는 특별한 맥주 축제를 엽니다. 야외에서 펼쳐집니다. 금강식물원 근처에 있습니다. 축제입니다. 사람입니다. 맛보는 자리에요.',
    { contentId: '2855626', locale: 'ko', chipId: 'festival_sights', userText: '볼거리' },
  );
  assert.match(formalChip, /열어요/);
  assert.match(formalChip, /펼쳐져요/);
  assert.match(formalChip, /있어요/);
  assert.match(formalChip, /축제예요/);
  assert.match(formalChip, /사람이에요/);
  assert.match(formalChip, /자리예요/);
  assert.doesNotMatch(formalChip, /엽니다|집니다|습니다|입니다|자리에요|이예요/);
  const dated = polishFestivalModelReply(
    '야외에서 맥주를 즐겨요. 10/15~18, [축제 상세 안내](https://www.gateo.kr/korea/?festival=2855626).',
    { contentId: '2855626', locale: 'ko', chipId: 'festival_sights', userText: '볼거리' },
  );
  assert.match(dated, /즐겨요/);
  assert.doesNotMatch(dated, /10\/15~18|상세 안내/);
  const stayUrl = 'https://www.gateo.kr/korea/?festival=2855626#festival-lodging';
  const lodging = polishFestivalModelReply(
    `월화거리 호텔이 편해요.\n[숙소 검색](${stayUrl})\n[숙소 검색](${stayUrl})`,
    { contentId: '2855626', locale: 'ko', chipId: 'prep_hotel', userText: '숙소 추천' },
  );
  assert.match(lodging, /호텔이 편해요/);
  assert.equal((lodging.match(/숙소 검색/g) || []).length, 1);
  assert.doesNotMatch(stripDomesticEntryDocLines('입국 증빙이 필요해요.', { chipId: 'prep_hotel' }), /입국/);
  assert.doesNotMatch(
    polishFestivalModelReply('월화거리 호텔이 편해요. 여행 증빙을 위해 숙소 예약 확인서를 미리 준비하세요.', {
      contentId: '2930716',
      locale: 'ko',
      chipId: 'prep_hotel',
      userText: '숙소 추천',
    }),
    /여행 증빙|예약 확인서/,
  );

  assert.match(KO.festivalAnswerRules, /12Go/);
  assert.match(EN.festivalAnswerRules, /Wolhwa Street \(월화거리\)/);
  assert.match(KO.mooniDestinationRules, /해요체/);
  assert.match(KO.festivalAnswerRules, /예약 확인서/);
  assert.match(KO.chips.prep_hotel.rules.join('\n'), /사우나/);

  const tasks = readFileSync(join(root, 'supabase/functions/_shared/gemini/tasks.ts'), 'utf8');
  const limits = readFileSync(join(root, 'supabase/functions/_shared/gemini/limits.ts'), 'utf8');
  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.match(tasks, /task === "festival_first_answer"/);
  assert.match(tasks, /limitThinking: false/);
  assert.match(limits, /festival_first_answer: 400/);
  assert.match(chat, /requestFestivalFirstAnswer/);
  const rendered = renderFestivalFirstAnswer('ko', { title: '강릉 국수 축제', nearby: ['경포해변'] });
  assert.match(rendered.system, /해요체/);
  assert.match(rendered.system, /2~3문장/);
  assert.match(renderFestivalFirstAnswer('en', { title: '강릉 국수 축제' }).system, /Hampyeong Expo Park \(함평엑스포공원\)/);
  assert.match(renderFestivalFirstAnswer('en', { title: '강릉 국수 축제' }).system, /Visitors engage with various hands-on programs/);
  assert.match(renderFestivalFirstAnswer('en', { title: '강릉 국수 축제' }).system, /has ended/);
  assert.match(renderFestivalFirstAnswer('en', { title: '강릉 국수 축제' }).system, /not the Wolhwa Street/);
  assert.match(rendered.userText, /경포해변/);
  assert.doesNotMatch(rendered.userText, /\{/);
  assert.match(rendered.system, /JSON, 코드 펜스/);
  assert.match(renderFestivalFirstAnswer('en', { title: '강릉 국수 축제' }).system, /Do not output JSON/);
  assert.doesNotMatch(rendered.userText, /경강로|입장료/);
});

test('prompts forbid an unlinked outside-channel closing', async () => {
  for (const bundle of [KO, EN]) {
    const joined = `${bundle.bookingRules}\n${bundle.mooniDestinationRules}\n${bundle.festivalAnswerRules}`;
    assert.doesNotMatch(joined, /Trip\.com 등 항공 전용 채널/);
    assert.doesNotMatch(joined, /flights via Trip\.com or flight channels/);
    assert.match(joined, /without a link|링크 없는/);
  }
  assert.match(KO.bookingRules, /GATEO 화면의 항공권 검색/);
  assert.match(EN.bookingRules, /on-screen flight search/);

  const hint = buildMooniBoundFestivalSystemHint(
    buildFestivalMooniContext(GANGNEUNG),
    'ko',
    NOW,
  );
  assert.match(hint, /오늘\(한국시간 KST\): 20261009/);
  assert.match(hint, /^- 날짜: 10\/15~18/m);
  assert.match(hint, /오늘 기준 상태: 시작 전/);
  assert.match(hint, /해요체만/);
  assert.doesNotMatch(hint, /시작까지 \d+일/);
  assert.doesNotMatch(hint, /^- 날짜:.*월/m);
  assert.match(hint, /장칼국수/);
  assert.doesNotMatch(hint, /확인하도록 안내/);
  assert.match(hint, /오신 것을 환영합니다[\s\S]{0,40}쓰지 않는다/);

  const system = renderMooniSystem({
    locale: 'ko',
    persona: 'PLANNER',
    locationName: '강릉 국수 축제',
    boundPlaceName: '강릉 국수 축제',
    isMooni: true,
    koreaFestivalHint: hint,
    showPlannerHeader: false,
    chipId: 'festival_sights',
  });
  assert.equal(JSON.stringify(KO), JSON.stringify(ServerKO));
  assert.equal(JSON.stringify(EN), JSON.stringify(ServerEN));
  assert.equal(countMooniPlannerHeaderGuidance(system), 0);
  assert.match(system, /링크 없는 Trip\.com/);
  assert.match(system, /환영 인사/);
  assert.match(system, /없는 URL을 지어내지/);
  assert.match(system, /오늘\(한국시간 KST\): 20261009/);
  assert.ok(system.lastIndexOf('해요체만 쓴다') > system.indexOf('맛집이 있습니다') || system.includes('[말투 — 모든 한국어 MOONi 답, 최우선]'));
  const concierge = renderMooniSystem({
    locale: 'ko',
    persona: 'CONCIERGE',
    isMooni: true,
    chipId: 'prep_flight',
    locationName: '서울',
  });
  const festivalChip = renderMooniSystem({
    locale: 'ko',
    persona: 'PLANNER',
    isMooni: true,
    chipId: 'festival_sights',
    koreaFestivalHint: hint,
  });
  assert.ok(concierge.lastIndexOf('[말투 — 모든 한국어 MOONi 답, 최우선]') > concierge.indexOf('맛집이 있습니다'));
  assert.ok(festivalChip.trimEnd().endsWith('이 규칙이 우선한다.'));
  assert.match(festivalChip, /합니다/);
  assert.match(festivalChip, /답니다/);
  assert.match(festivalChip, /랄니다/);
  assert.match(festivalChip, /냅니다/);
  assert.match(festivalChip, /플래너 링크/);
  assert.match(festivalChip, /축제 기간:/);
  assert.match(KO.festivalAnswerRules, /플래너 링크/);
  assert.match(KO.festivalAnswerRules, /답니다/);
  assert.match(KO.festivalAnswerRules, /축제 화면에는 플래너와 칩 섹션이 없다/);
  assert.match(KO.festivalPriorityLine, /칩 규칙의 플래너·섹션 안내보다 우선한다/);
  assert.match(KO.festivalPriorityLine, /#festival-lodging/);
  assert.match(EN.festivalAnswerRules, /no planner and no chip sections/);
  const visaSystem = renderMooniSystem({
    locale: 'ko',
    persona: 'PLANNER',
    isMooni: true,
    chipId: 'visa_docs',
    koreaFestivalHint: hint,
  });
  const chipMayMention = visaSystem.indexOf('플래너 비자 섹션을 언급할 수 있다');
  const festivalBan = visaSystem.indexOf('칩 규칙의 플래너·섹션 안내보다 우선한다');
  assert.ok(chipMayMention > 0 && festivalBan > chipMayMention);
  assert.match(renderFestivalFirstAnswer('ko', { title: '허심청브로이 옥토버페스트' }).system, /플래너와 칩 섹션이 없다/);
  const visaShown = polishFestivalModelReply(
    '여권 유효기간을 확인하세요. [출발 전 준비] 섹션 및 플래너에서 반드시 확인하세요.\n[플래너]\n대사관 공식 채널이나 섹션 및 플래너에서 반드시 확인하세요.',
    { contentId: '2855626', locale: 'ko', chipId: 'visa_docs', userText: '비자' },
  );
  assert.match(visaShown, /확인하세요/);
  assert.doesNotMatch(visaShown, /플래너|섹션|출발 전 준비/);
  const route = polishFestivalModelReply(
    '오전에는 월화거리를 걸어요. 더 자세한 하루 동선은 GATEO 플래너를 참고하세요.',
    { contentId: '2930716', locale: 'ko', chipId: 'festival_day', userText: '동선' },
  );
  assert.match(route, /월화거리/);
  assert.doesNotMatch(route, /플래너/);
  const labeled = polishFestivalModelReply(
    '월화거리 호텔이 편해요.\n숙소 확인: [숙소 카드](https://www.gateo.kr/korea/?festival=2855626#festival-lodging)',
    { contentId: '2855626', locale: 'ko', chipId: 'prep_hotel', userText: '숙소 추천' },
  );
  assert.match(labeled, /호텔이 편해요/);
  assert.match(labeled, /\[숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2855626#festival-lodging\)/);
  assert.doesNotMatch(labeled, /숙소 확인:/);
  const likedChip = polishFestivalModelReply(
    '분위기가 좋습니다. 공식 채널에서 확인하세요.',
    { contentId: '2855626', locale: 'ko', chipId: 'visa_docs', userText: '비자' },
  );
  assert.match(likedChip, /좋아요/);
  assert.match(likedChip, /확인하세요/);
  assert.doesNotMatch(likedChip, /좋습니다/);
  const nextAction = polishFestivalModelReply(getMooniModelMarkdownForRender([
    '월화거리 호텔이 편해요.',
    '다음 행동: 숙소 정보를 확인하세요.',
    '축제 기간: 10/15~18',
    '축제 상세 안내: [축제 상세 안내](https://www.gateo.kr/korea/?festival=2855626)',
    '* **강릉역 인근**: 호텔',
  ].join('\n')), {
    contentId: '2855626',
    locale: 'ko',
    chipId: 'prep_hotel',
    userText: '숙소 추천',
  });
  assert.match(nextAction, /숙소 정보를 확인하세요/);
  assert.match(nextAction, /\* \*\*강릉역 인근\*\*: 호텔/);
  assert.doesNotMatch(nextAction, /다음 행동:|축제 기간:|축제 상세 안내:|10\/15~18/);
  const historyChip = polishFestivalModelReply(
    '과거를 경험하는 장이랍니다. 이야기를 나누는 자리랍니다.',
    { contentId: '2855626', locale: 'ko', chipId: 'history', userText: '역사' },
  );
  assert.match(historyChip, /경험하는 장이에요/);
  assert.match(historyChip, /자리예요/);
  assert.doesNotMatch(historyChip, /답니다|장이랍니다|자리랍니다/);
  const visaDash = [
    '여권 유효기간을 확인하세요.',
    '- 왕복 항공권이 필요해요.',
    '- 숙소 예약 확인서를 준비하세요.',
  ].join('\n');
  const visaStar = visaDash.replace(/^- /gm, '* ');
  const visaOpts = { contentId: '2855626', locale: 'ko', chipId: 'visa_docs', userText: '비자' };
  const visaListShown = polishFestivalModelReply(getMooniModelMarkdownForRender(visaDash), visaOpts);
  const visaStarShown = polishFestivalModelReply(getMooniModelMarkdownForRender(visaStar), visaOpts);
  const renderMd = (markdown) => micromark(markdown, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  const visaHtml = renderMd(visaListShown);
  const visaStarHtml = renderMd(visaStarShown);
  assert.match(visaListShown, /\n\* 왕복 항공권이 필요해요/);
  assert.match(visaListShown, /\n\* 숙소 예약 확인서를 준비하세요/);
  assert.match(visaHtml, /<ul>/);
  assert.match(visaHtml, /<li>[^<]*왕복 항공권/);
  assert.match(visaHtml, /<li>[^<]*숙소 예약 확인서/);
  assert.doesNotMatch(visaHtml, /<p>[^<]*왕복 항공권[^<]*숙소 예약 확인서/);
  assert.equal(visaHtml, visaStarHtml);

  const lodging = await resolveMooniChatKoreaFestivalHint({
    userText: '숙소 추천해 주세요',
    festivalContext: buildFestivalMooniContext(GANGNEUNG),
    locale: 'ko',
    now: NOW,
  });
  assert.doesNotMatch(lodging.hint, /^- 오늘 기준 상태:/m);
  assert.doesNotMatch(lodging.hint, /^- 날짜:/m);
  assert.doesNotMatch(lodging.hint, /시작까지 6일/);
  assert.match(lodging.hint, /긴 날짜를 쓰지 않는다/);
  const stay = polishFestivalModelReply(
    '월화거리 호텔이 편해요. 현재 시작까지 5일 남았습니다. 2026년 10월 15일부터 2026년 10월 18일까지입니다. 세 곳을 추천해요.',
    { contentId: '2930716', locale: 'ko', chipId: 'prep_hotel', userText: '숙소 추천' },
  );
  assert.match(stay, /호텔/);
  assert.match(stay, /추천해요/);
  assert.doesNotMatch(stay, /남았습니다|2026년 10월/);
  const sights = polishFestivalModelReply(
    '강릉 국수 축제는 10월 15일부터 10월 18일까지 열리며, 현재 시작까지 5일 남았어요. 국수를 맛볼 수 있어요.',
    { contentId: '2930716', locale: 'ko', chipId: 'festival_sights', userText: '볼거리' },
  );
  assert.match(sights, /맛볼 수 있어요/);
  assert.doesNotMatch(sights, /시작까지|10월 15일부터|남았/);
  const typedStay = polishFestivalModelReply(
    '월화거리 호텔이 편해요. 2026년 10월 15일부터 2026년 10월 18일까지 열려요.',
    { contentId: '2930716', locale: 'ko', userText: '숙소 추천해 주세요' },
  );
  assert.match(typedStay, /호텔/);
  assert.doesNotMatch(typedStay, /10월 15일|2026년/);
  const listed = polishFestivalModelReply(
    '숙소예요. * **강릉역 인근**: 호텔 * **월화거리**: 게하. 현재 시작까지 5일 남았어요.',
    { contentId: '2930716', locale: 'ko', chipId: 'prep_hotel', userText: '숙소 추천' },
  );
  assert.match(listed, /\n\* \*\*강릉역 인근\*\*/);
  assert.match(listed, /\n\* \*\*월화거리\*\*/);
  assert.doesNotMatch(listed, /시작까지/);
  const broken = polishFestivalModelReply(
    '숙소예요.\n\n* **강릉역 인근**: 호텔\n* **월화거리**: 게하\n다음으로 숙소 카드에서 볼 수 있어요.',
    { contentId: '2930716', locale: 'ko', chipId: 'prep_hotel', userText: '숙소 추천' },
  );
  assert.match(broken, /숙소예요\.\n\n/);
  assert.match(broken, /게하\n\n다음으로/);
  const clientPrompts = readFileSync(join(root, 'src/pages/Home/lib/prompts.js'), 'utf8');
  assert.match(clientPrompts, /없는 URL을 지어내지/);
  assert.match(clientPrompts, /festivalPriorityLine/);
  assert.doesNotMatch(clientPrompts, /Trip\.com 등 항공 전용 채널/);
});

test('festival follow-up keeps facts, lodging areas, and the chat session', async () => {
  const fixture = JSON.parse(readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/2855626.json'), 'utf8'));
  assert.match(fixture.program, /트로트/);
  assert.doesNotMatch(fixture.overview, /트로트/);
  const facts = buildFestivalFirstAnswerFacts(buildFestivalMooniContext(fixture), { now: NOW });
  const corpus = [
    facts.overviewFacts,
    facts.programs,
    fixture.overview,
    fixture.program,
    facts.dateLine,
    facts.title,
  ].flat().join('\n');
  assert.deepEqual(unsupportedFestivalFactMentions('라이브 퍼포먼스가 있어요. 맥주 무제한이에요.', corpus), []);
  assert.deepEqual(unsupportedFestivalFactMentions('트로트 공연이 있어요.', corpus), []);
  assert.ok(unsupportedFestivalFactMentions('재즈 공연이 있어요.', corpus).some((token) => /재즈/.test(token)));
  assert.equal(
    acceptFestivalModelOpening('허심청브로이 옥토버페스트는 재즈 공연을 열어요. 10/15~17, 엿새 뒤 시작해요.', facts),
    '',
  );

  const stay = polishFestivalModelReply(
    '숙소를 찾으신다면 [이곳에서](https://www.gateo.kr/korea/?festival=2930716#festival-lodging) 확인해 보세요.',
    {
      contentId: '2930716',
      locale: 'ko',
      userText: '어디서 자요?',
      placeName: '강릉',
      venue: '강릉 월화거리 일원',
      stayAreas: ['강릉', '속초'],
    },
  );
  assert.match(stay, /월화거리/);
  assert.match(stay, /강릉/);
  assert.match(stay, /\[강릉 숙소 안내\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716#festival-lodging\)/);
  assert.doesNotMatch(stay, /이곳에서|이곳\]/);

  const stayEn = polishFestivalModelReply(
    'Check [here](https://www.gateo.kr/korea/?festival=2930716#festival-lodging).',
    {
      contentId: '2930716',
      locale: 'en',
      userText: 'where to stay',
      placeName: '강릉',
      venue: '강릉 월화거리 일원',
      stayAreas: ['강릉', '동해', '속초'],
    },
  );
  assert.match(stayEn, /Wolhwa Street \(월화거리\), downtown Gangneung \(강릉\), and Donghae \(동해\) are practical places to stay/);
  assert.match(stayEn, /\[Gangneung lodging guide\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716#festival-lodging\)/);
  assert.doesNotMatch(stayEn.replace(/\([^)]*\)/g, ''), /[가-힣]/);
  assert.doesNotMatch(stayEn, /속초/);

  const clock = polishFestivalModelReply('공연은 밤 21시까지예요. 특별한 순간을 경험해보세요.', {
    contentId: '2930716',
    locale: 'ko',
    chipId: 'festival_sights',
    userText: '공연',
  });
  assert.match(clock, /밤 9시/);
  assert.doesNotMatch(clock, /특별한 순간을 경험해/);

  assert.equal(festivalChatHeaderTitle({ title: '강릉 국수 축제' }, 'en'), 'Gangneung Noodle Festival');
  assert.equal(formatEnglishThenKorean('장칼국수'), 'spicy hand-cut noodles (장칼국수)');

  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  const firstCall = chat.indexOf('requestFestivalFirstAnswer(festivalMooniContext');
  const cachedRead = chat.lastIndexOf('readFestivalMooniSession', firstCall);
  assert.ok(cachedRead > 0 && cachedRead < firstCall);
  const lodgingHint = await resolveMooniChatKoreaFestivalHint({
    userText: '어디서 자요?',
    festivalContext: {
      title: '강릉 국수 축제',
      contentId: '2930716',
      hubLabel: '강릉',
      venue: '강릉 월화거리 일원',
      stayAreas: ['강릉', '속초'],
    },
    locale: 'ko',
  });
  assert.match(lodgingHint.hint, /숙소 권역/);
  assert.match(lodgingHint.hint, /강릉 숙소 안내/);
  assert.match(KO.festivalAnswerRules, /개요와 프로그램에 없는 공연/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '강릉 국수 축제' }).system, /없는 공연·프로그램 이름/);

  assert.equal(showFestivalOpeningInThread({ opening: '강릉 국수 축제는 열려요.', initialQuery: '' }), true);
  assert.equal(
    showFestivalOpeningInThread({ opening: '강릉 국수 축제는 열려요.', initialQuery: '어디서 자요?' }),
    false,
  );
  const openingBlock = chat.slice(chat.indexOf('data-testid="mooni-festival-opening"') - 700, chat.indexOf('data-testid="mooni-festival-opening"'));
  assert.match(openingBlock, /showFestivalOpeningInThread/);
  assert.doesNotMatch(openingBlock, /messages\.length === 0/);

  const koLodging = [
    { role: 'user', text: '어디서 자요?' },
    { role: 'model', text: '월화거리, 강릉, 속초에서 묵기 좋아요. [강릉 숙소 안내](https://www.gateo.kr/korea/?festival=2930716#festival-lodging)' },
  ];
  assert.equal(festivalTripMatchesLocale({ messages: koLodging }, 'ko'), true);
  assert.equal(festivalTripMatchesLocale({ messages: koLodging }, 'en'), false);
  assert.equal(festivalTripMatchesLocale({ mooniLocale: 'en', messages: koLodging }, 'en'), true);
  writeFestivalMooniSession('2930716', 'ko', { messages: koLodging, opening: '한국어 첫 답' });
  writeFestivalMooniSession('2930716', 'en', { opening: 'Gangneung Noodle Festival runs 10/15–18.' });
  assert.equal(readFestivalMooniSession('2930716', 'en').messages, undefined);
  assert.match(readFestivalMooniSession('2930716', 'ko').opening, /한국어/);
  const host = readFileSync(join(root, 'src/pages/Home/components/MooniBoundChatHost.jsx'), 'utf8');
  assert.match(host, /festivalTripMatchesLocale/);

  assert.equal(
    festivalResolutionLabel({ name: '강릉 국수 축제' }, { title: '강릉 국수 축제', hubLabel: '강릉' }, 'en'),
    'Gangneung Noodle Festival',
  );
  assert.equal(
    festivalResolutionLabel({ name: '강릉 국수 축제 · 강릉' }, { title: '강릉 국수 축제', hubLabel: '강릉' }, 'en'),
    'Gangneung Noodle Festival',
  );
  assert.equal(
    festivalResolutionLabel({ name: '강릉 국수 축제' }, { title: '강릉 국수 축제' }, 'ko'),
    '강릉 국수 축제',
  );

  const gangneung = JSON.parse(readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/2930716.json'), 'utf8'));
  const enFacts = buildFestivalFirstAnswerFacts(buildFestivalMooniContext(gangneung), { locale: 'en', now: NOW });
  const doubled = acceptFestivalModelOpening(
    'Gangneung Noodle Festival (강릉 국수 축제) The Gangneung Noodle Festival (강릉 국수 축제) runs 10/15–18 and starts in 6 days. You can taste spicy hand-cut noodles (장칼국수).',
    enFacts,
  );
  assert.equal((doubled.match(/Gangneung Noodle Festival/g) || []).length, 2);
  assert.match(doubled, /\[Gangneung Noodle Festival \(강릉 국수 축제\) page\]/);
  assert.match(doubled, /spicy hand-cut noodles \(장칼국수\)/);
});

test('festival food stays on the restaurant list and the closer does not repeat the title', async () => {
  const pageUrl = 'https://www.gateo.kr/korea/?festival=2930716';
  const closer = polishFestivalModelReply(
    `월화거리에서 국수를 먹어요. [강릉 국수 축제](${pageUrl}) 강릉 국수 축제 가는 법을 알아보세요.`,
    {
      contentId: '2930716',
      locale: 'ko',
      chipId: 'festival_access',
      userText: '가는 법',
      festivalTitle: '강릉 국수 축제',
    },
  );
  assert.match(closer, /\[강릉 국수 축제 페이지\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716\)/);
  assert.doesNotMatch(closer, /가는 법/);
  assert.equal((closer.match(/강릉 국수 축제/g) || []).length, 1);
  const prodEdgeCloser = polishFestivalModelReply(
    `월화거리에서 국수를 먹어요. [강릉 국수 축제 페이지](${pageUrl})에서 가는 법을 알아보세요.`,
    {
      contentId: '2930716',
      locale: 'ko',
      chipId: 'festival_access',
      userText: '가는 법',
      festivalTitle: '강릉 국수 축제',
    },
  );
  assert.match(prodEdgeCloser, /\[강릉 국수 축제 페이지\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716\)/);
  assert.doesNotMatch(prodEdgeCloser, /가는 법|알아보세요/);
  assert.match(KO.festivalAnswerRules, /«페이지에서 가는 법을 알아보세요»는 쓰지 않는다/);
  assert.match(ServerKO.festivalAnswerRules, /«페이지에서 가는 법을 알아보세요»는 쓰지 않는다/);
  assert.match(EN.festivalAnswerRules, /Do not frame that link as how to get there/);

  const spelled = polishFestivalModelReply('축제는 10/15~18이예요. 집이예요. 자리에요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '일정',
  });
  assert.match(spelled, /10\/15~18이에요/);
  assert.match(spelled, /집이에요/);
  assert.match(spelled, /자리예요/);
  assert.doesNotMatch(spelled, /이예요|10\/15~18예요/);

  const food = polishFestivalModelReply(
    '임당생활문화센터와 노암터널에서 먹을 수 있어요.',
    {
      contentId: '2930716',
      locale: 'ko',
      chipId: 'festival_nearby',
      userText: '근처 먹을 곳?',
      nearbyRestaurants: ['강릉 오금집', '이쉐프의돈까스', '임당생활문화센터'],
    },
  );
  assert.match(food, /강릉 오금집/);
  assert.match(food, /이쉐프의돈까스/);
  assert.match(food, /돈가스/);
  assert.match(food, /search\.naver\.com\/search\.naver\?query=/);
  assert.doesNotMatch(food, /임당생활문화센터|노암터널/);

  const foodCloser = polishFestivalModelReply(
    '중앙시장에서 국수를 먹어요. 숙소 정보도 함께 알아보세요. [강릉 숙소 안내](https://www.gateo.kr/korea/?festival=2930716#festival-lodging)',
    {
      contentId: '2930716',
      locale: 'ko',
      chipId: 'festival_nearby',
      userText: '근처 먹을 곳?',
      nearbyRestaurants: ['중앙시장'],
    },
  );
  assert.match(foodCloser, /중앙시장/);
  assert.doesNotMatch(foodCloser, /숙소|festival-lodging/);

  const sheetNames = ['100년임당방앗간', '만동제과', '월화엔'];
  const deflected = '다음 행동으로 주변의 맛집을 찾아보세요. 숙소 정보도 함께 알아보세요. [강릉 숙소 안내](https://www.gateo.kr/korea/?festival=2930716#festival-lodging)';
  for (const ask of [
    { userText: '근처 먹을 곳?' },
    { chipId: 'festival_nearby', userText: '근처 먹을 곳?' },
  ]) {
    const named = polishFestivalModelReply(deflected, {
      contentId: '2930716',
      locale: 'ko',
      nearbyRestaurants: sheetNames,
      ...ask,
    });
    for (const name of sheetNames) assert.match(named, new RegExp(name));
    assert.doesNotMatch(named, /찾아보세요|다음 행동|숙소|festival-lodging/);
  }
  const foodHint = await resolveMooniChatKoreaFestivalHint({
    userText: '근처 먹을 곳?',
    festivalContext: {
      title: '강릉 국수 축제',
      contentId: '2930716',
      nearbyRestaurants: sheetNames,
    },
    locale: 'ko',
  });
  assert.match(foodHint.hint, /100년임당방앗간\]\(https:\/\/search\.naver\.com\/search\.naver\?query=[^)]+\)\(방앗간\)/);
  assert.match(foodHint.hint, /만동제과\]\(https:\/\/search\.naver\.com\/search\.naver\?query=[^)]+\)\(제과\)/);
  assert.match(foodHint.hint, /월화엔\]\(https:\/\/search\.naver\.com\/search\.naver\?query=/);
  assert.match(foodHint.hint, /바로 찾아갈 거예요/);
  const chipHint = await resolveMooniChatKoreaFestivalHint({
    userText: '먹을 곳',
    chipId: 'festival_nearby',
    festivalContext: {
      title: '강릉 국수 축제',
      contentId: '2930716',
      nearbyRestaurants: sheetNames,
    },
    locale: 'ko',
  });
  assert.match(chipHint.hint, /이번 질문은 근처 먹을 곳이다/);
  const openSpot = {
    name: '강릉 국수 축제',
    lat: 37.75,
    lng: 128.89,
    festivalContext: { title: '강릉 국수 축제', nearbyRestaurants: [], nearbyPlaces: ['강릉향교'] },
  };
  const withFood = patchFestivalBoundSpot(openSpot, {
    festivalContext: { nearbyRestaurants: sheetNames, nearbyPlaces: ['강릉향교'] },
  });
  assert.deepEqual(withFood.festivalContext.nearbyRestaurants, sheetNames);
  assert.equal(withFood.name, openSpot.name);
  assert.equal(patchFestivalBoundSpot(withFood, {
    festivalContext: { nearbyRestaurants: sheetNames, nearbyPlaces: ['강릉향교'] },
  }), withFood);

  const stayCloser = polishFestivalModelReply('교동에서 묵어요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '어디서 자요?',
    placeName: '강릉',
    stayAreas: ['교동', '월화거리'],
  });
  assert.match(stayCloser, /#festival-lodging/);

  const hint = await resolveMooniChatKoreaFestivalHint({
    userText: '근처 먹을 곳?',
    festivalContext: {
      title: '강릉 국수 축제',
      contentId: '2930716',
      nearbyPlaces: ['임당생활문화센터', '노암터널', '강릉향교'],
      nearbyRestaurants: ['강릉 오금집', '이쉐프의돈까스'],
    },
    locale: 'ko',
  });
  assert.match(hint.hint, /주변 맛집\(GATEO\): \[강릉 오금집\]\(https:\/\/search\.naver\.com\/search\.naver\?query=/);
  assert.match(hint.hint, /이쉐프의돈까스\]\(https:\/\/search\.naver\.com\/search\.naver\?query=[^)]+\)\(돈가스\)/);
  assert.match(hint.hint, /바로 찾아갈 거예요/);
  assert.match(hint.hint, /근처\(GATEO\): 강릉향교/);
  assert.doesNotMatch(hint.hint, /임당생활문화센터|노암터널/);
  assert.match(KO.festivalAnswerRules, /바로 찾아갈 거예요/);
  assert.match(KO.festivalAnswerRules, /10\/15~18이에요/);
  assert.match(KO.chips.festival_nearby.rules.join('\n'), /바로 찾아갈 거예요/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '강릉 국수 축제' }).system, /터널/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '강릉 국수 축제' }).system, /이예요/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '강릉 국수 축제' }).system, /10\/15~18이에요/);
});

test('festival follow-up keeps a correct copula, nearby stays, local food, and drops a repeated date', () => {
  const josa = polishFestivalModelReply(
    '18이에요. 15예요. 19예요. 10/15~18이예요. 축제이예요. 강릉이예요. 15이에요.',
    { contentId: '2930716', locale: 'ko', userText: '일정' },
  );
  assert.match(josa, /18이에요/);
  assert.match(josa, /15예요/);
  assert.match(josa, /19예요/);
  assert.match(josa, /10\/15~18이에요/);
  assert.match(josa, /축제예요/);
  assert.match(josa, /강릉이에요/);
  assert.match(josa, /15이에요/);
  assert.doesNotMatch(josa, /이예요|18예요/);

  const pageUrl = 'https://www.gateo.kr/korea/?festival=2930716';
  const lodging = polishFestivalModelReply(
    `속초에서 묵어요. 편안한 휴식을 위해 바다가 보여요. [강릉 국수 축제](${pageUrl}) 강릉 국수 축제 가는 법.`,
    {
      contentId: '2930716',
      locale: 'ko',
      userText: '어디서 자요?',
      placeName: '강릉',
      stayAreas: ['속초', '교동', '월화거리', '안목'],
      lat: 37.755777,
      lng: 128.897602,
      festivalTitle: '강릉 국수 축제',
    },
  );
  assert.match(lodging, /교동/);
  assert.match(lodging, /월화거리/);
  assert.match(lodging, /안목|강릉/);
  assert.doesNotMatch(lodging, /속초/);
  assert.doesNotMatch(lodging, /편안한 휴식을 위해/);
  assert.match(lodging, /#festival-lodging/);
  assert.doesNotMatch(lodging, /에서 가는 법을 알아보세요/);

  const gangneung = JSON.parse(readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/2930716.json'), 'utf8'));
  const ctx = buildFestivalMooniContext({
    ...gangneung,
    stayAreas: [
      { name: '속초', hubId: 'sokcho' },
      { name: '강릉', hubId: 'gangneung' },
      { name: '교동' },
      { name: '월화거리' },
    ],
    nearbyRestaurants: ['맥도날드', '중앙시장', '강릉 오금집', '롯데리아', '교동식당', '경포횟집', '안목커피', '강문포차', '버거킹'],
  });
  assert.deepEqual(ctx.stayAreas, ['강릉', '교동', '월화거리']);
  assert.equal(ctx.nearbyRestaurants[0].name, '중앙시장');
  assert.equal(ctx.nearbyRestaurants.some((row) => row.name === '맥도날드'), false);
  assert.equal(ctx.nearbyRestaurants.some((row) => row.name === '버거킹'), false);
  assert.deepEqual(
    rankFestivalRestaurants(['맥도날드', '중앙시장', '강릉 오금집']),
    ['중앙시장', '강릉 오금집', '맥도날드'],
  );
  assert.deepEqual(
    filterFestivalStayAreaNames(['속초', '교동', '강릉'], 37.755777, 128.897602),
    ['교동', '강릉'],
  );
  for (const name of ['맥도날드', '롯데리아', '버거킹', '맘스터치', '스타벅스', '파리바게뜨', '배스킨라빈스']) {
    assert.match(name, FESTIVAL_CHAIN_RE);
  }

  const food = polishFestivalModelReply('맥도날드가 가까워요.', {
    contentId: '2930716',
    locale: 'ko',
    chipId: 'festival_nearby',
    userText: '근처 먹을 곳?',
    nearbyRestaurants: ['맥도날드', '중앙시장', '강릉 오금집'],
  });
  assert.match(food, /중앙시장/);
  assert.match(food, /강릉 오금집/);
  assert.doesNotMatch(food, /맥도날드/);

  const follow = polishFestivalModelReply(
    '교동 중앙시장에서 국수를 먹어요. 강릉 국수 축제는 10/15~18예요.',
    {
      contentId: '2930716',
      locale: 'ko',
      chipId: 'festival_nearby',
      userText: '근처 먹을 곳?',
      nearbyRestaurants: ['중앙시장'],
    },
  );
  assert.match(follow, /중앙시장/);
  assert.doesNotMatch(follow, /10\/15~18/);

  const facts = buildFestivalFirstAnswerFacts(buildFestivalMooniContext(gangneung), { now: NOW });
  assert.match(facts.dateLine, /10\/15~18/);
  const opening = acceptFestivalModelOpening(
    [
      '강릉 국수 축제는 10/15~18, 엿새 뒤 시작해요.',
      '장칼국수와 막국수를 맛볼 수 있는 자리예요.',
      facts.closing,
    ].join(' '),
    facts,
    [ctx.address, ctx.timeText, ctx.feeText],
  );
  assert.match(opening, /10\/15~18/);
  assert.match(KO.festivalAnswerRules, /약 20km/);
  assert.match(KO.festivalAnswerRules, /바로 찾아갈 거예요/);
  assert.match(KO.festivalPriorityLine, /행사 기간을 반복하지 않는다/);
  assert.match(KO.festivalAnswerRules, /3~4곳/);
  assert.match(KO.festivalAnswerRules, /공식 홈페이지나 문의처/);
  assert.match(KO.festivalAnswerRules, /안내해 드릴까요/);
  assert.match(KO.festivalAnswerRules, /이름이 3곳이면 첫 답에 3곳/);
  assert.match(EN.festivalAnswerRules, /3 or 4 restaurants/);
  assert.match(EN.festivalAnswerRules, /only when it is a markdown link/);
  assert.match(KO.chips.festival_nearby.rules.join('\n'), /이름, 종류, 거리, 링크/);
  assert.match(KO.chips.festival_access.rules.join('\n'), /축제 페이지에서 확인/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '강릉 국수 축제' }).system, /이름이 3곳이면 3곳을 말한다/);
  assert.match(renderMooniSystem({ locale: 'ko', persona: 'PLANNER', isMooni: true, locationName: '강릉' }), /바로 찾아갈 거예요/);
  assert.match(KO.festivalAnswerRules, /다양한 숙소가 자리하고 있어요/);
  assert.match(KO.festivalAnswerRules, /축제 페이지에서 살펴보세요/);
  assert.match(KO.festivalAnswerRules, /찾아볼 수 있어요/);
  assert.match(KO.festivalAnswerRules, /장소 이름 안의 «주차장»만으로는 주차 정보가 아니다/);
  assert.match(EN.festivalAnswerRules, /see or find parking on the festival page/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '서귀포칠십리축제' }).system, /과거와 현재/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '서귀포칠십리축제' }).system, /N일 뒤 시작해요/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '서귀포칠십리축제' }).system, /경연프로그램 : 청소년 페스타/);
  assert.match(KO.festivalAnswerRules, /숙소 카드에 이름과 거리/);
  assert.match(EN.festivalAnswerRules, /keeps them from a wasted trip/);
  assert.match(renderMooniSystem({ locale: 'ko', persona: 'PLANNER', isMooni: true, locationName: '강릉' }), /축제 페이지에서 살펴보세요/);
  assert.match(ServerKO.festivalAnswerRules, /다양한 숙소가 자리하고 있어요/);
  assert.match(EN.festivalAnswerRules, /a variety of stays/);
  assert.match(renderMooniSystem({ locale: 'ko', persona: 'PLANNER', isMooni: true, locationName: '강릉' }), /다양한 숙소가 자리하고 있어요/);
});

test('food wait, tagged places, parking, closers, and three nearby names', async () => {
  resetFestivalRestaurantLoad();
  let triggered = 0;
  const ready = await waitForFestivalRestaurantNames('2930716', {
    names: [{ name: '만동제과', distKm: 0.2 }],
    trigger: async () => {
      triggered += 1;
      return { spots: [] };
    },
  });
  assert.equal(triggered, 0);
  assert.equal(ready[0].name, '만동제과');
  assert.equal(ready[0].distKm, 0.2);

  beginFestivalRestaurantLoad('2930716', new Promise((resolve) => {
    setTimeout(() => resolve({ spots: [{ name: '월화엔', distKm: 0.24 }] }), 20);
  }));
  const waited = await waitForFestivalRestaurantNames('2930716', { timeoutMs: 200 });
  assert.equal(waited[0].name, '월화엔');
  assert.equal(waited[0].distKm, 0.24);

  resetFestivalRestaurantLoad('2930716');
  beginFestivalRestaurantLoad('2930716', new Promise((resolve) => {
    setTimeout(() => resolve({ spots: [{ name: '늦은집', distKm: 1 }] }), 150);
  }));
  const timedOut = await waitForFestivalRestaurantNames('2930716', { timeoutMs: 40 });
  assert.deepEqual(timedOut, []);
  resetFestivalRestaurantLoad();

  resetFestivalLodgingStays('2930716');
  const stayWait = waitForFestivalLodgingStays('2930716', { timeoutMs: 400 });
  publishFestivalLodgingStays('2930716', [
    { itemName: '강릉 씨사이드', lat: 37.756, lng: 128.898 },
  ], { lat: 37.755777, lng: 128.897602 });
  const stayed = await stayWait;
  assert.equal(stayed[0].name, '강릉 씨사이드');
  assert.ok(stayed[0].distKm > 0);
  resetFestivalLodgingStays('2930716');
  const stayMiss = await waitForFestivalLodgingStays('2930716', { timeoutMs: 30 });
  assert.deepEqual(stayMiss, []);

  publishFestivalLodgingStays('2930716', [
    { itemName: '강릉 세인트존스호텔', lat: 37.7562, lng: 128.8765, categoryName: '호텔' },
    { itemName: '신라모노그램', lat: 37.7701, lng: 128.9512 },
    { itemName: '강릉 스카이베이', lat: 37.78, lng: 128.9 },
    { itemName: '먼 호텔', lat: 37.9, lng: 129.3 },
  ], { lat: 37.755777, lng: 128.897602 });
  const lodgingCtx = await loadFestivalLodgingForAsk({
    title: '강릉 국수 축제',
    contentId: '2930716',
    lat: 37.755777,
    lng: 128.897602,
  }, { userText: '어디서 자요?' });
  assert.equal(lodgingCtx.nearbyStays.length, 3);
  assert.equal(lodgingCtx.nearbyStays[0].name, '강릉 세인트존스호텔');
  assert.equal(lodgingCtx.nearbyStays[0].type, '호텔');
  assert.ok(lodgingCtx.nearbyStays.every((row) => row.distKm > 0));
  const lodgingPayload = await resolveMooniChatKoreaFestivalHint({
    userText: '어디서 자요?',
    locale: 'ko',
    festivalContext: lodgingCtx,
  });
  assert.match(lodgingPayload.hint, /강릉 세인트존스호텔/);
  assert.match(lodgingPayload.hint, /신라모노그램/);
  assert.match(lodgingPayload.hint, /강릉 스카이베이/);
  assert.match(lodgingPayload.hint, /호텔/);
  assert.match(lodgingPayload.hint, /\[숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716#festival-lodging\)/);
  assert.doesNotMatch(lodgingPayload.hint, /먼 호텔/);
  resetFestivalLodgingStays('506616');
  const seogwipoStay = loadFestivalLodgingForAsk({
    title: '서귀포칠십리축제',
    contentId: '506616',
    lat: 33.247,
    lng: 126.56,
  }, { userText: '숙소', timeoutMs: 400 });
  publishFestivalLodgingStays('506616', [
    { itemName: '신화관 제주신화월드', lat: 33.306, lng: 126.317 },
  ], { lat: 33.247, lng: 126.56 });
  const seogwipoCtx = await seogwipoStay;
  assert.equal(seogwipoCtx.nearbyStays[0].name, '신화관 제주신화월드');
  assert.ok(seogwipoCtx.nearbyStays[0].distKm > 0);
  publishFestivalLodgingStays('129000', [
    { itemName: '스톤델리아' },
    { itemName: '해밀펜션' },
  ]);
  const nameOnly = await loadFestivalLodgingForAsk({
    title: '함평 나비축제',
    contentId: '129000',
  }, { userText: '숙소' });
  assert.deepEqual(nameOnly.nearbyStays.map((row) => row.name), ['스톤델리아', '해밀펜션']);
  const namePayload = await resolveMooniChatKoreaFestivalHint({
    userText: '숙소',
    locale: 'ko',
    festivalContext: nameOnly,
  });
  assert.doesNotMatch(namePayload.hint, /스톤델리아|해밀펜션/);
  const nameLodgingLine = namePayload.hint.split('\n').find((line) => line.includes('숙소 답:')) || '';
  assert.match(nameLodgingLine, /축제장 근처 숙소는 \[숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=129000#festival-lodging\)에서 볼 수 있어요/);
  assert.match(nameLodgingLine, /숙소 이름은 쓰지 않는다/);
  assert.doesNotMatch(nameLodgingLine.split('숙소 이름은')[0], /가까운 숙소로|권역에서 숙소를 찾을 수 있어요/);
  assert.doesNotMatch(nameLodgingLine, /\d+(?:\.\d+)?\s*km/);
  const nameAnswer = polishFestivalModelReply(
    '가까운 숙소로 스톤델리아, 해밀펜션이 있어요.',
    {
      contentId: '129000',
      locale: 'ko',
      userText: '숙소',
      nearbyStays: nameOnly.nearbyStays,
    },
  );
  assert.match(nameAnswer, /축제장 근처 숙소는 \[숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=129000#festival-lodging\)에서 볼 수 있어요/);
  assert.doesNotMatch(nameAnswer, /스톤델리아|해밀펜션|가까운|권역에서 숙소를 찾을 수 있어요/);
  const farCard = polishFestivalModelReply(
    '가까운 숙소로 더 베스트 제주 성산, 신화관 제주신화월드, 해밀펜션이 있어요.',
    {
      contentId: '506616',
      locale: 'ko',
      userText: '숙소',
      lat: 33.247,
      lng: 126.56,
      nearbyStays: [
        { name: '더 베스트 제주 성산' },
        { name: '신화관 제주신화월드' },
        { name: '해밀펜션' },
      ],
    },
  );
  assert.match(farCard, /축제장 근처 숙소는 \[숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=506616#festival-lodging\)에서 볼 수 있어요/);
  assert.doesNotMatch(farCard, /성산|신화월드|해밀펜션|가까운|권역에서 숙소를 찾을 수 있어요/);
  const areaCard = polishFestivalModelReply(
    '가까운 숙소로 더 베스트 제주 성산, 신화관 제주신화월드가 있어요.',
    {
      contentId: '506616',
      locale: 'ko',
      userText: '숙소',
      placeName: '서귀포시',
      venue: '천지연 주차장 (일대)',
      address: '제주특별자치도 서귀포시 이중섭거리',
      nearbyStays: [
        { name: '더 베스트 제주 성산', distKm: 35 },
        { name: '신화관 제주신화월드', lat: 33.306, lng: 126.317 },
        { name: '서귀포 호텔', distKm: 1.4 },
        { name: '이중섭 펜션', distKm: 4 },
        { name: '올레 호텔', distKm: 21 },
      ],
    },
  );
  assert.match(areaCard, /가까운 숙소로 서귀포 호텔\(1\.4km\), 이중섭 펜션\(4km\)이 있어요/);
  assert.doesNotMatch(areaCard, /성산|신화월드|올레 호텔|권역에서 숙소를 찾을 수 있어요/);
  const areaOnly = polishFestivalModelReply(
    '가까운 숙소로 더 베스트 제주 성산, 신화관 제주신화월드가 있어요.',
    {
      contentId: '506616',
      locale: 'ko',
      userText: '숙소',
      placeName: '서귀포시',
      venue: '천지연 주차장 (일대)',
      address: '제주특별자치도 서귀포시 이중섭거리',
      lat: 33.247,
      lng: 126.56,
      nearbyStays: [
        { name: '더 베스트 제주 성산' },
        { name: '신화관 제주신화월드' },
      ],
    },
  );
  assert.match(areaOnly, /축제장이 있는 서귀포 시내\(천지연·이중섭거리 일대\)에 잡으면 걸어서 다니기 좋아요/);
  assert.match(areaOnly, /\[서귀포 숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=506616#festival-lodging\)/);
  assert.doesNotMatch(areaOnly, /성산|신화월드|권역에서 숙소를 찾을 수 있어요|주차장/);
  const enNameless = polishFestivalModelReply('Closest stays: Shinhwa World.', {
    contentId: '506616',
    locale: 'en',
    userText: 'where to stay',
    nearbyStays: [
      { name: '신화관 제주신화월드' },
      { name: '더 베스트 제주 성산' },
    ],
  });
  assert.match(enNameless, /Stays near the venue are on \[lodging card\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=506616#festival-lodging\)/);
  assert.doesNotMatch(enNameless, /신화|성산|Shinhwa|Closest/);
  const areaHint = await resolveMooniChatKoreaFestivalHint({
    userText: '숙소',
    locale: 'ko',
    festivalContext: {
      title: '서귀포칠십리축제',
      contentId: '506616',
      hubLabel: '서귀포시',
      venue: '천지연 주차장 (일대)',
      address: '제주특별자치도 서귀포시 이중섭거리',
      nearbyStays: [
        { name: '더 베스트 제주 성산' },
        { name: '신화관 제주신화월드' },
      ],
    },
  });
  const areaLine = areaHint.hint.split('\n').find((line) => line.includes('숙소 답:')) || '';
  assert.match(areaLine, /축제장이 있는 서귀포 시내\(천지연·이중섭거리 일대\)에 잡으면 걸어서 다니기 좋아요/);
  assert.match(areaLine, /\[서귀포 숙소 카드\]/);
  assert.doesNotMatch(areaLine.split('숙소 이름은')[0], /성산|신화월드|가까운 숙소로|권역에서 숙소를 찾을 수 있어요/);
  resetFestivalLodgingStays('2930716');
  let releaseTopsTen;
  const topsTenLoad = new Promise((resolve) => {
    releaseTopsTen = resolve;
  });
  beginFestivalLodgingLoad('2930716', topsTenLoad);
  publishFestivalLodgingStays('2930716', [{ itemName: '이름만호텔' }]);
  const topsTenAsk = loadFestivalLodgingForAsk({
    title: '강릉 국수 축제',
    contentId: '2930716',
    lat: 37.755777,
    lng: 128.897602,
  }, { userText: '숙소', timeoutMs: 400 });
  releaseTopsTen([
    { itemName: '호텔 탑스텐 강릉', lat: 37.766, lng: 128.9 },
  ]);
  const topsTenCtx = await topsTenAsk;
  assert.equal(topsTenCtx.nearbyStays[0].name, '호텔 탑스텐 강릉');
  assert.ok(topsTenCtx.nearbyStays[0].distKm > 0);
  assert.ok(topsTenCtx.nearbyStays[0].distKm < 2);
  const topsTenHint = await resolveMooniChatKoreaFestivalHint({
    userText: '숙소',
    locale: 'ko',
    festivalContext: topsTenCtx,
  });
  assert.match(topsTenHint.hint, /호텔 탑스텐 강릉\(\d+(?:\.\d+)?km\)/);
  assert.match(topsTenHint.hint, /거리와 함께/);
  assert.doesNotMatch(topsTenHint.hint, /이름만호텔/);
  resetFestivalLodgingStays('506616');
  publishFestivalLodgingStays('506616', [
    { itemName: '신화관 제주신화월드', lat: 33.306, lng: 126.317 },
    { itemName: '랜딩관 제주신화월드', lat: 33.307, lng: 126.318 },
    { itemName: '서머셋 제주신화월드', lat: 33.308, lng: 126.319 },
    { itemName: '롯데호텔 제주', lat: 33.248, lng: 126.41 },
  ], { lat: 33.247, lng: 126.56 });
  const deduped = await loadFestivalLodgingForAsk({
    title: '서귀포칠십리축제',
    contentId: '506616',
    lat: 33.247,
    lng: 126.56,
  }, { userText: '숙소' });
  const dedupedNames = deduped.nearbyStays.map((row) => row.name);
  assert.equal(dedupedNames.filter((name) => name.includes('제주신화월드')).length, 1);
  assert.ok(dedupedNames.includes('롯데호텔 제주'));
  resetFestivalLodgingStays('2930716');
  resetFestivalLodgingStays('506616');
  resetFestivalLodgingStays('129000');

  const tagged = polishFestivalModelReply(
    '강릉 중앙시장과 지역 특색을 살린 식당이 많아요. 다양한 맛집이 있어요. 미식 여행을 즐겨보세요. 주변의 소문난 지역 식당이에요. 가는 법을 알아보세요.',
    {
      contentId: '2930716',
      locale: 'ko',
      userText: '근처 먹을 곳?',
      nearbyRestaurants: [
        { name: '만동제과', distKm: 0.1 },
        { name: '이쉐프의돈까스', distKm: 0.2 },
        { name: '100년임당방앗간', distKm: 0.3 },
        { name: '월화엔', distKm: 0.24 },
        { name: '배니닭강정', distKm: 0.5 },
      ],
    },
  );
  assert.match(tagged, /\[만동제과\]\(https:\/\/search\.naver\.com\/search\.naver\?query=/);
  assert.match(tagged, /제과 · 도보 1분/);
  assert.match(tagged, /이쉐프의돈까스/);
  assert.match(tagged, /돈가스 · 도보 3분/);
  assert.match(tagged, /100년임당방앗간/);
  assert.match(tagged, /방앗간 · 도보 4분/);
  assert.match(tagged, /월화엔/);
  assert.match(tagged, /도보 3분/);
  assert.doesNotMatch(tagged, /배니닭강정|다양한 맛집|미식|소문난|중앙시장|가는 법/);
  const swappedFood = polishFestivalModelReply('주변의 맛집을 찾아보세요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '근처 먹을 곳?',
    nearbyRestaurants: [
      { name: '만동제과', distKm: 0.4 },
      { name: '거리없는국수집', distKm: null },
      { name: '월화엔', distKm: 0.5 },
      { name: '100년임당방앗간', distKm: 0.8 },
      { name: '가까운집', distKm: 0.15 },
    ],
  });
  assert.match(swappedFood, /가까운집/);
  assert.match(swappedFood, /만동제과/);
  assert.match(swappedFood, /제과/);
  assert.match(swappedFood, /search\.naver\.com\/search\.naver\?query=/);
  assert.doesNotMatch(swappedFood, /거리없는국수집/);

  const page = 'https://visitgangneung.net/pub/gnfestival/4748.do';
  const parking = polishFestivalModelReply('주차는 축제 페이지에서 확인해요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '주차',
    homepage: page,
    tel: '033-640-4531',
  });
  assert.equal(parking, '주차 안내는 [공식 홈페이지](https://visitgangneung.net/pub/gnfestival/4748.do)에 있어요. 문의 033-640-4531');
  assert.doesNotMatch(parking, /확인|살펴|문의처를 통해|축제 페이지/);

  const homeOnly = polishFestivalModelReply('주차는 축제 페이지에서 확인해요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '주차는요?',
    homepage: page,
  });
  assert.equal(homeOnly, '주차 안내는 [공식 홈페이지](https://visitgangneung.net/pub/gnfestival/4748.do)에 있어요.');
  assert.doesNotMatch(homeOnly, /문의|확인|축제 페이지/);

  const shuttle = polishFestivalModelReply(
    '셔틀은 [축제 페이지](https://www.gateo.kr/korea/?festival=2930716)에서 확인해요.',
    { contentId: '2930716', locale: 'ko', userText: '셔틀', tel: '033-640-4531' },
  );
  assert.match(shuttle, /문의처 033-640-4531에서 확인해요/);
  assert.doesNotMatch(shuttle, /gateo\.kr/);

  const keptParking = polishFestivalModelReply('주차는 축제 페이지에서 확인해요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '주차',
    overview: '주차는 월화거리 공영주차장을 이용해요.',
    homepage: page,
  });
  assert.match(keptParking, /축제 페이지에서 확인/);
  assert.doesNotMatch(keptParking, /공식 홈페이지/);

  const access = polishFestivalModelReply(
    '[축제 페이지](https://www.gateo.kr/korea/?festival=2930716)에서 가는 법을 확인해요.',
    { contentId: '2930716', locale: 'ko', userText: '가는 법', homepage: page, tel: '033-640-4531' },
  );
  assert.match(access, /gateo\.kr/);
  assert.doesNotMatch(access, /공식 홈페이지/);

  const bareParking = polishFestivalModelReply('주차 안내는 아직 없어요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '주차?',
  });
  assert.equal(bareParking, '주차 안내는 공식 홈페이지에 있어요.');
  assert.doesNotMatch(bareParking, /확인|문의처|축제 페이지/);

  const parkedHome = polishFestivalModelReply(
    `강릉 국수 축제 주차 정보는 공식 홈페이지(${page})에서 확인할 수 있어요.`,
    { contentId: '2930716', locale: 'ko', userText: '주차', homepage: page, tel: '033-640-4531' },
  );
  assert.equal(parkedHome, `주차 안내는 [공식 홈페이지](${page})에 있어요. 문의 033-640-4531`);
  assert.doesNotMatch(parkedHome, /확인|살펴|공식 홈페이지\(\)|  /);

  const parkedOther = polishFestivalModelReply(
    '강릉 국수 축제 주차 정보는 공식 홈페이지(https://example.com/not-official)에서 확인할 수 있어요.',
    { contentId: '2930716', locale: 'ko', userText: '주차', homepage: page, tel: '033-640-4531' },
  );
  assert.equal(parkedOther, `주차 안내는 [공식 홈페이지](${page})에 있어요. 문의 033-640-4531`);
  assert.doesNotMatch(parkedOther, /example\.com|확인|살펴|축제 페이지|  /);
  const noisyParking = polishFestivalModelReply(
    '주차는 [축제 페이지](https://www.gateo.kr/korea/?festival=2930716)에서 살펴보세요. 문의처를 통해 확인할 수 있어요.',
    { contentId: '2930716', locale: 'ko', userText: '주차 정보', homepage: page, tel: '033-640-4531' },
  );
  assert.equal(noisyParking, `주차 안내는 [공식 홈페이지](${page})에 있어요. 문의 033-640-4531`);
  const telOnly = polishFestivalModelReply('주차는 축제 페이지에서 살펴보세요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '주차',
    tel: '033-640-4531',
  });
  assert.equal(telOnly, '주차 안내는 문의 033-640-4531에 있어요.');
  assert.doesNotMatch(telOnly, /문의처를 통해|축제 페이지|확인/);

  const seogwipoParking = {
    contentId: '506616',
    locale: 'ko',
    userText: '주차',
    homepage: 'https://www.seogwipo.go.kr/festival/506616',
    tel: '064-760-3030',
    venue: '천지연 주차장',
    overview: '천지연폭포와 천지연 주차장 일원에서 열립니다. 과거와 현재, 미래가 만나는 무대입니다.',
    program: '경연프로그램 : 청소년 페스타',
  };
  assert.equal(hasFestivalParkingData(seogwipoParking), false);
  assert.equal(hasFestivalParkingData({
    overview: '주차는 월화거리 공영주차장을 이용해요.',
  }), true);
  assert.equal(hasFestivalParkingData({
    overview: '주차 가능. 주차요금 2,000원. 주차 대수 200대.',
  }), true);
  assert.equal(hasFestivalParkingData({
    parking: '월화거리 공영주차장',
  }), true);
  assert.equal(hasFestivalParkingData({
    info: [{ infoname: '주차시설', infotext: '주차요금 1,000원' }],
  }), true);
  assert.equal(hasFestivalParkingData({
    info: [{ infoname: '행사장소', infotext: '천지연 주차장' }],
    venue: '천지연 주차장',
  }), false);
  const pagePointers = [
    '[강릉 국수 축제 페이지](https://www.gateo.kr/korea/?festival=2930716)에서도 관련 정보를 찾아볼 수 있어요.',
    '[축제 페이지](https://www.gateo.kr/korea/?festival=506616)에서 살펴볼 수 있어요.',
    '주차는 [서귀포칠십리축제 페이지](https://www.gateo.kr/korea/?festival=506616)에서 알아볼 수 있어요.',
    '[서귀포칠십리축제 페이지](https://www.gateo.kr/korea/?festival=506616)에서 볼 수 있어요.',
    'You can find parking on the [festival page](https://www.gateo.kr/korea/?festival=506616).',
    'See the festival page for parking.',
  ];
  for (const line of pagePointers) {
    assert.equal(stripFestivalPageParkingPointers(line), '');
  }
  const guide = '주차 안내는 [공식 홈페이지](https://www.seogwipo.go.kr/festival/506616)에 있어요. 문의 064-760-3030';
  for (const line of pagePointers.slice(0, 4)) {
    const polished = polishFestivalModelReply(line, seogwipoParking);
    assert.equal(polished, guide);
    assert.doesNotMatch(polished, /축제 페이지|찾아볼|살펴볼|알아볼|볼 수 있어요/);
  }
  const enParking = polishFestivalModelReply(pagePointers[4], {
    ...seogwipoParking,
    locale: 'en',
    userText: 'parking',
  });
  assert.equal(enParking, 'Parking is on the [official site](https://www.seogwipo.go.kr/festival/506616). Call 064-760-3030.');
  assert.doesNotMatch(enParking, /festival page|\bfind\b|\bsee\b/i);
  const lotHint = buildMooniBoundFestivalSystemHint({
    title: '서귀포칠십리축제',
    contentId: '506616',
    venue: '천지연 주차장',
    sceneOverview: seogwipoParking.overview,
    homepage: seogwipoParking.homepage,
    tel: seogwipoParking.tel,
  }, 'ko');
  assert.match(lotHint, /주차 정보가 이 데이터에 없다/);
  assert.match(lotHint, /찾아볼 수 있어요/);
  assert.doesNotMatch(lotHint, /- 주차:/);

  const seogwipo = buildFestivalMooniContext({
    item: {
      contentId: '506616',
      title: '서귀포칠십리축제',
      eventStartDate: '20261020',
      eventEndDate: '20261022',
    },
    intro: { eventplace: '천지연 주차장' },
    overview: '천지연폭포와 천지연 주차장 일원에서 열립니다. 과거와 현재, 미래가 만나는 무대입니다.',
    program: '경연프로그램 : 청소년 페스타',
    info: [{ infoname: '행사장소', infotext: '천지연 주차장' }],
  });
  assert.equal(seogwipo.parking, '');
  const seogwipoKo = buildFestivalMooniSentenceAnswer(seogwipo, { locale: 'ko', now: NOW });
  assert.match(seogwipoKo, /서귀포칠십리축제는 10\/20~22, 11일 뒤 시작해요/);
  assert.match(seogwipoKo, /청소년 페스타 경연이 있어요/);
  assert.doesNotMatch(seogwipoKo, /과거와 현재|미래가 만나|프로그램\s*[:：]/);
  const lotVenue = buildFestivalMooniContext({
    item: {
      contentId: '506616',
      title: '서귀포칠십리축제',
      eventStartDate: '20261020',
      eventEndDate: '20261022',
      addr1: '제주특별자치도 서귀포시 중정로 1',
    },
    intro: { eventplace: '천지연 주차장 (일대)', playtime: '10:00~21:00' },
    location: { name: '서귀포' },
    overview: '천지연 주차장 일원에서 열립니다.',
  });
  const lotKo = buildFestivalMooniSentenceAnswer(lotVenue, { locale: 'ko', now: NOW });
  assert.match(lotKo, /천지연 일대에서 열려요/);
  assert.match(lotKo, /축제 분위기가 저녁까지 이어져요/);
  assert.ok(lotKo.indexOf('축제 분위기가 저녁까지') < (lotKo.indexOf('근처에서는') === -1 ? lotKo.length : lotKo.indexOf('근처에서는')));
  assert.doesNotMatch(lotKo, /주차장/);
  assert.equal(hasFestivalParkingData(lotVenue), false);
  const lotSpoken = buildMooniBoundFestivalSystemHint(lotVenue, 'ko');
  assert.match(lotSpoken, /장소: 천지연 일대/);
  assert.match(lotSpoken, /«주차장»은 붙이지 않는다/);
  assert.doesNotMatch(lotSpoken, /천지연 주차장/);
  const lotSentence = polishFestivalModelReply(
    '서귀포칠십리축제는 천지연폭포 주차장과 서귀포 원도심 일대에서 열려요.',
    {
      contentId: '506616',
      locale: 'ko',
      venue: '천지연 주차장 (일대)',
      address: '제주특별자치도 서귀포시 남성중로 23',
    },
  );
  assert.match(lotSentence, /천지연과 서귀포 원도심 일대에서/);
  assert.doesNotMatch(lotSentence, /주차장|일대 일대|천지연 일대와/);
  const lotAnd = polishFestivalModelReply(
    '천지연폭포 주차장 및 서귀포 원도심 일대에서 열려요.',
    {
      contentId: '506616',
      locale: 'ko',
      venue: '천지연 주차장 일대',
      address: '제주특별자치도 서귀포시 서홍동',
    },
  );
  assert.match(lotAnd, /천지연과 서귀포 원도심 일대에서/);
  assert.doesNotMatch(lotAnd, /주차장|일대 및|천지연 일대와/);
  const lotParen = polishFestivalModelReply(
    '천지연 주차장 (일대)에서 저녁까지 이어져요.',
    {
      contentId: '506616',
      locale: 'ko',
      userText: '볼거리',
      venue: '천지연폭포 주차장',
    },
  );
  assert.match(lotParen, /천지연 일대에서 저녁까지 이어져요/);
  assert.doesNotMatch(lotParen, /주차장|일대 일대/);
  const lotParking = polishFestivalModelReply(
    '주차는 천지연폭포 주차장을 이용해요.',
    {
      contentId: '506616',
      locale: 'ko',
      userText: '주차',
      venue: '천지연 주차장 (일대)',
      parking: '천지연폭포 주차장',
      overview: '주차는 천지연폭포 주차장을 이용해요.',
    },
  );
  assert.match(lotParking, /천지연폭포 주차장/);
  assert.doesNotMatch(lotParking, /천지연 일대/);
  const venueNearby = buildFestivalMooniContext({
    item: {
      contentId: '506616',
      title: '서귀포칠십리축제',
      addr1: '제주특별자치도 서귀포시 남성중로 23',
    },
    intro: { eventplace: '천지연 주차장 (일대)' },
    nearbyPlaces: [
      { name: '천지연폭포', distKm: 0.12 },
      '이중섭거리',
      '서귀포매일올레시장',
      { name: '천지연계곡', distKm: 0.2 },
      { name: '정방폭포', distKm: 2 },
    ],
  });
  assert.deepEqual(venueNearby.nearbyPlaces, ['이중섭거리', '서귀포매일올레시장', '정방폭포']);
  const farStem = buildFestivalMooniContext({
    item: { contentId: '506616', title: '서귀포칠십리축제' },
    intro: { eventplace: '천지연 주차장 (일대)' },
    nearbyPlaces: [{ name: '천지연계곡', distKm: 1.5 }, '이중섭거리'],
  });
  assert.deepEqual(farStem.nearbyPlaces, ['천지연계곡', '이중섭거리']);
  const venueNearbyFacts = buildFestivalFirstAnswerFacts(venueNearby, { locale: 'ko', now: NOW });
  assert.equal(venueNearbyFacts.nearby[0], '이중섭거리');
  assert.ok(!venueNearbyFacts.nearby.some((name) => /천지연/.test(name)));
  const venueNearbyHint = buildMooniBoundFestivalSystemHint(venueNearby, 'ko');
  assert.match(venueNearbyHint, /근처\(GATEO\): 이중섭거리, 서귀포매일올레시장, 정방폭포/);
  assert.doesNotMatch(venueNearbyHint, /천지연폭포|천지연계곡/);
  assert.match(venueNearbyHint, /이름 줄기가 같은 명소는 근처로 다시 말하지 않는다/);
  assert.match(venueNearbyHint, /«A와 B, C»/);
  const nearbyStrip = polishFestivalModelReply(
    '서귀포칠십리축제는 천지연 일대에서 저녁까지 이어져요. 근처에서는 천지연폭포, 이중섭거리, 서귀포매일올레시장을 둘러볼 수 있어요.',
    {
      contentId: '506616',
      locale: 'ko',
      venue: '천지연 주차장 (일대)',
      address: '제주특별자치도 서귀포시 남성중로 23',
      nearbyPlaces: ['이중섭거리', '서귀포매일올레시장', '정방폭포'],
    },
  );
  assert.match(nearbyStrip, /천지연 일대에서 저녁까지 이어져요/);
  assert.match(nearbyStrip, /근처에서는 이중섭거리, 서귀포매일올레시장, 정방폭포를 둘러볼 수 있어요/);
  assert.doesNotMatch(nearbyStrip, /천지연폭포|주차장/);
  const nearbyOnly = polishFestivalModelReply(
    '근처에서는 천지연폭포를 둘러볼 수 있어요.',
    {
      contentId: '506616',
      locale: 'ko',
      venue: '천지연 주차장 (일대)',
      nearbyPlaces: ['이중섭거리', '정방폭포'],
    },
  );
  assert.match(nearbyOnly, /근처에서는 이중섭거리, 정방폭포를 둘러볼 수 있어요/);
  assert.doesNotMatch(nearbyOnly, /천지연/);
  const nearbyCopied = polishFestivalModelReply(
    '서귀포칠십리축제는 천지연 일대에서 저녁까지 이어져요. 황우지해안열두굴, 천지연폭포, 이중섭 거주지가 근처에 있어요.',
    {
      contentId: '506616',
      locale: 'ko',
      venue: '천지연 주차장 일대',
      nearbyPlaces: ['황우지해안열두굴', '이중섭 거주지', '새섬공원'],
    },
  );
  assert.match(nearbyCopied, /천지연 일대에서 저녁까지 이어져요/);
  assert.match(nearbyCopied, /황우지해안열두굴, 이중섭 거주지, 새섬공원이 근처에 있어요/);
  assert.doesNotMatch(nearbyCopied, /천지연폭포/);
  const geurigo = polishFestivalModelReply(
    '서귀포칠십리축제는 천지연 일대와 서귀포 원도심 일대 그리고 이중섭거리에서 열려요.',
    { contentId: '506616', locale: 'ko', venue: '천지연 주차장 (일대)' },
  );
  assert.match(geurigo, /천지연과 서귀포 원도심 일대, 이중섭거리에서 열려요/);
  assert.doesNotMatch(geurigo, /그리고|천지연 일대와/);
  const geurigoClause = polishFestivalModelReply(
    '축제가 열리고 그리고 저녁에는 불이 켜져요.',
    { contentId: '506616', locale: 'ko', venue: '천지연 주차장 (일대)' },
  );
  assert.match(geurigoClause, /열리고 그리고 저녁에는 불이 켜져요/);
  const geurigoComma = polishFestivalModelReply(
    '이중섭거리와 올레시장, 그리고 정방폭포를 둘러볼 수 있어요.',
    { contentId: '2930716', locale: 'ko' },
  );
  assert.match(geurigoComma, /올레시장, 그리고 정방폭포를 둘러볼 수 있어요/);
  assert.match(KO.festivalAnswerRules, /이름 줄기가 같은 근처 장소는 다시 말하지 않는다/);
  assert.match(KO.festivalAnswerRules, /«A와 B, C»/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '서귀포칠십리축제' }).system, /«A와 B, C»/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '서귀포칠십리축제' }).system, /축제 분위기가 저녁까지 이어져요/);
  assert.match(renderFestivalFirstAnswer('ko', { title: '서귀포칠십리축제' }).system, /문장 순서는 dateLine/);
  assert.match(KO.festivalAnswerRules, /분위기 문장을 이름 목록으로 바꾸지 않는다|볼거리와 분위기 문장을 이름 목록으로 바꾸지 않는다/);
  const paradeOverview = '보통 천지연폭포 주차장 및 서귀포 원도심(구 시가지) 일대에서 진행되며, 거리 전체가 무대가 되는 거리 퍼레이드, 다양한 장르의 공연·버스킹, 지역 예술인 참여 무대, 먹거리·플리마켓 등으로 축제 분위기를 더한다. 특히 퍼레이드는 시민과 단체가 함께 참여해 서귀포의 정체성과 활기를 보여주는 핵심 프로그램으로, 축제 기간 원도심 일대를 걸으며 볼거리와 즐길 거리를 동시에 체험할 수 있다는 점이 특징이다.';
  const paradeCtx = buildFestivalMooniContext({
    item: {
      contentId: '506616',
      title: '서귀포칠십리축제',
      eventStartDate: '20261023',
      eventEndDate: '20261025',
      addr1: '제주특별자치도 서귀포시 서홍동',
    },
    intro: { eventplace: '천지연 주차장 일대', playtime: '10:00~22:00' },
    overview: paradeOverview,
    program: '길거리 퍼레이드\n개막식\n경연프로그램 : 청소년 페스타',
    nearbyPlaces: [
      { name: '천지연폭포', distKm: 0.1 },
      '황우지해안열두굴',
      '이중섭 거주지',
      '새섬공원',
    ],
  });
  const paradeKo = buildFestivalMooniSentenceAnswer(paradeCtx, {
    locale: 'ko',
    now: new Date('2026-10-12T03:00:00Z'),
  });
  assert.match(paradeKo, /10\/23~25, 11일 뒤 시작해요/);
  assert.match(paradeKo, /천지연과 서귀포 원도심 일대에서 길거리 퍼레이드와 개막식, 청소년 페스타 경연이 열려요/);
  assert.doesNotMatch(paradeKo, /서귀포의/);
  const ofDowntown = buildFestivalMooniSentenceAnswer(buildFestivalMooniContext({
    item: {
      contentId: '506616',
      title: '서귀포칠십리축제',
      eventStartDate: '20261023',
      eventEndDate: '20261025',
      addr1: '제주특별자치도 서귀포시 서홍동',
    },
    intro: { eventplace: '천지연 주차장 일대', playtime: '10:00~22:00' },
    overview: paradeOverview.replace('서귀포 원도심', '서귀포의 원도심'),
    program: '길거리 퍼레이드\n개막식\n경연프로그램 : 청소년 페스타',
    nearbyPlaces: ['황우지해안열두굴', '이중섭 거주지', '새섬공원'],
  }), { locale: 'ko', now: new Date('2026-10-12T03:00:00Z') });
  assert.match(ofDowntown, /천지연과 서귀포 원도심 일대에서/);
  assert.doesNotMatch(ofDowntown, /서귀포의/);
  assert.match(paradeKo, /시민과 단체가 함께 걷는 퍼레이드로 활기가 넘치고, 축제 분위기가 저녁까지 이어져요/);
  assert.match(paradeKo, /근처에서는 황우지해안열두굴, 이중섭 거주지, 새섬공원을 둘러볼 수 있어요/);
  assert.ok(paradeKo.indexOf('길거리 퍼레이드와 개막식') < paradeKo.indexOf('시민과 단체'));
  assert.ok(paradeKo.indexOf('축제 분위기가 저녁까지') < paradeKo.indexOf('근처에서는'));
  assert.ok(paradeKo.indexOf('근처에서는') < paradeKo.indexOf('페이지'));
  assert.equal(countFestivalCardSentences(paradeKo), 5);
  assert.doesNotMatch(paradeKo, /주차장|천지연폭포/);
  const paradeFacts = buildFestivalFirstAnswerFacts(paradeCtx, {
    locale: 'ko',
    now: new Date('2026-10-12T03:00:00Z'),
  });
  assert.match(paradeFacts.atmosphere.join(' '), /시민과 단체가 함께 걷는 퍼레이드/);
  const paradeModel = [
    '서귀포칠십리축제는 10/23~25, 11일 뒤 시작해요.',
    '천지연폭포 주차장과 서귀포 원도심 일대에서 거리 퍼레이드를 즐기고 지역 예술인의 버스킹과 공연을 보며 먹거리와 플리마켓을 구경해요.',
    '시민과 단체가 함께하는 길거리 퍼레이드와 개막식 그리고 청소년 페스타 경연이 저녁까지 이어져 활기찬 분위기를 만들어요.',
    '근처에는 황우지해안열두굴, 이중섭 거주지, 새섬공원이 있어요.',
    paradeFacts.closing,
  ].join(' ');
  const paradePolished = polishFestivalModelReply(paradeModel, {
    contentId: '506616',
    locale: 'ko',
    venue: paradeCtx.venue,
    address: paradeCtx.address,
    nearbyPlaces: paradeCtx.nearbyPlaces,
  });
  assert.equal(countFestivalCardSentences(paradePolished), countFestivalCardSentences(paradeModel));
  assert.match(paradePolished, /시민과 단체/);
  assert.match(paradePolished, /활기/);
  assert.match(paradePolished, /천지연과 서귀포 원도심 일대에서/);
  assert.doesNotMatch(paradePolished, /주차장|천지연 일대와/);
  const paradeAccepted = acceptFestivalModelOpening(paradePolished, paradeFacts);
  assert.match(paradeAccepted, /시민과 단체/);
  assert.match(paradeAccepted, /활기/);
  assert.ok(paradeAccepted.indexOf('활기') < paradeAccepted.indexOf('근처에는'));
  const jaguri = acceptFestivalModelOpening(
    `서귀포칠십리축제는 10/23~25, 11일 뒤 시작해요. 서귀포 자구리공원 일대에서 퍼레이드와 시민 참여 프로그램이 열려요. 축제 분위기가 활기차요. 근처에서는 황우지해안열두굴, 이중섭 거주지, 새섬공원을 둘러볼 수 있어요. ${paradeFacts.closing}`,
    paradeFacts,
  );
  assert.equal(jaguri, '');
  const listOnly = acceptFestivalModelOpening(
    `서귀포칠십리축제는 10/23~25, 11일 뒤 시작해요. 길거리 퍼레이드, 개막식, 청소년 페스타 경연이 있어요. 근처에서는 황우지해안열두굴, 이중섭 거주지, 새섬공원을 둘러볼 수 있어요. ${paradeFacts.closing}`,
    paradeFacts,
  );
  assert.equal(listOnly, '');
  const eveningAfter = acceptFestivalModelOpening(
    `서귀포칠십리축제는 10/23~25, 11일 뒤 시작해요. 근처에서는 황우지해안열두굴, 이중섭 거주지, 새섬공원을 둘러볼 수 있어요. 천지연 일대에서 저녁까지 이어져요. 시민과 단체가 함께 걷는 퍼레이드로 활기가 넘쳐요. ${paradeFacts.closing}`,
    paradeFacts,
  );
  assert.match(eveningAfter, /축제 분위기가 저녁까지 이어져요/);
  assert.ok(eveningAfter.indexOf('축제 분위기가 저녁까지') < eveningAfter.indexOf('근처에서는'));
  assert.ok(eveningAfter.indexOf('시민과 단체') < eveningAfter.indexOf('근처에서는'));
  const droppedNearby = polishFestivalModelReply(
    '시민과 단체가 함께 걷는 퍼레이드로 활기가 넘쳐요. 근처에서는 천지연폭포를 둘러볼 수 있어요.',
    { contentId: '506616', locale: 'ko', venue: '천지연 주차장 일대', nearbyPlaces: [] },
  );
  assert.equal(countFestivalCardSentences(droppedNearby), 2);
  assert.match(droppedNearby, /시민과 단체가 함께 걷는 퍼레이드/);
  assert.match(droppedNearby, /근처에서는/);
  const seogwipoFacts = buildFestivalFirstAnswerFacts(seogwipo, { locale: 'ko', now: NOW });
  assert.match(seogwipoFacts.dateLine, /10\/20~22, 11일 뒤 시작해요/);
  assert.deepEqual(seogwipoFacts.programs, ['청소년 페스타 경연']);
  assert.equal(acceptFestivalModelOpening(
    '서귀포칠십리축제는 11일 뒤 시작해요. 과거와 현재, 미래가 만나는 무대예요. 경연프로그램 : 청소년 페스타가 있어요.',
    seogwipoFacts,
  ), '');
  const datedCountdown = acceptFestivalModelOpening(
    `서귀포칠십리축제는 11일 뒤 시작해요. 청소년 페스타 경연이 있어요. 자세한 내용은 [서귀포칠십리축제 페이지](${seogwipo.gateoUrl})에서 볼 수 있어요.`,
    seogwipoFacts,
  );
  assert.match(datedCountdown, /10\/20~22, 11일 뒤 시작해요/);
  assert.match(datedCountdown, /청소년 페스타 경연이 있어요/);
  assert.doesNotMatch(datedCountdown, /과거와 현재/);
  const withFee = buildFestivalMooniContext({
    item: { contentId: '506616', title: '서귀포칠십리축제' },
    intro: { eventplace: '천지연 주차장' },
    overview: '천지연 주차장 일원에서 열립니다.',
    info: [{ infoname: '주차시설', infotext: '주차 가능. 주차요금 2,000원. 주차 대수 200대' }],
  });
  assert.match(withFee.parking, /주차요금/);
  assert.equal(hasFestivalParkingData(withFee), true);
  assert.match(
    stripDisallowedFestivalLinks('안내 [https://example.com/bracket] 끝', { homepage: page }),
    /^안내 끝$/,
  );
  assert.match(
    stripDisallowedFestivalLinks(`공식 홈페이지（https://example.com/wide）에서`, { homepage: page }),
    /^공식 홈페이지에서$/,
  );
  assert.match(
    stripDisallowedFestivalLinks(`공식 홈페이지(${page}/)에서`, { homepage: page }),
    /\[공식 홈페이지\]\(https:\/\/visitgangneung\.net\/pub\/gnfestival\/4748\.do\)에서/,
  );
  assert.match(
    stripDisallowedFestivalLinks(
      '[공식 홈페이지](https://www.gateo.kr/korea/?festival=2930716)에서 주차를 확인하세요.',
      { homepage: page },
    ),
    /\[공식 홈페이지\]\(https:\/\/visitgangneung\.net/,
  );
  const accessFooter = appendFestivalAccessBookingLinks('대구에서 KTX로 가요.', 'ko');
  assert.match(accessFooter, /bustago\.or\.kr/);
  assert.match(accessFooter, /letskorail\.com/);
  assert.match(accessFooter, /kobus\.co\.kr/);
  assert.match(accessFooter, /txbus\.t-money\.co\.kr/);
  const modelFooterDup = polishFestivalModelReply(
    [
      '동대구역에서 KTX로 마산역에 도착해요.',
      '',
      '열차·버스 시각은 [코레일](https://www.letskorail.com/), [고속버스](https://www.kobus.co.kr/), [시외버스](https://txbus.t-money.co.kr/)에서 확인할 수 있어요.',
      '',
      '열차·버스 시각은 [코레일](https://www.letskorail.com/), [고속버스](https://www.kobus.co.kr/), [시외버스](https://txbus.t-money.co.kr/)에서 편하게 확인할 수 있어요.',
    ].join('\n'),
    {
      contentId: '637693',
      chipId: 'festival_access',
      locale: 'ko',
      userText: buildFestivalAccessAskText('daegu', 'ko'),
      eventStartDate: '20261031',
      eventEndDate: '20261108',
    },
  );
  assert.equal((modelFooterDup.match(/열차·버스 시각은/g) || []).length, 1);
  const accessSteps = ensureFestivalAccessStepLineBreaks(
    '용산역에서 ITX-새마을로 함평역까지 가요. KTX는 광주송정에서 내린 뒤 ITX로 이어요. 함평역에서 택시로 함평엑스포공원까지 가면 돼요.',
  );
  assert.ok(accessSteps.includes('\n\n'));
  assert.match(accessSteps, /KTX는 광주송정/);
  const accessFooterPartial = appendFestivalAccessBookingLinks(
    '대구에서 KTX로 가요. [코레일](https://www.letskorail.com/)',
    'ko',
  );
  assert.doesNotMatch(accessFooterPartial, /\[코레일\].*\[코레일\]/);
  assert.match(accessFooterPartial, /버스타고/);
  assert.match(accessFooterPartial, /고속버스/);
  const accessFooterFull = appendFestivalAccessBookingLinks(
    `[코레일](https://www.letskorail.com/) [버스타고](https://www.bustago.or.kr/) [고속버스](https://www.kobus.co.kr/)`,
    'ko',
  );
  assert.equal(accessFooterFull, '[코레일](https://www.letskorail.com/) [버스타고](https://www.bustago.or.kr/) [고속버스](https://www.kobus.co.kr/)');
  const typedRouteFooter = polishFestivalModelReply('서울에서 열차로 갑니다.', {
    locale: 'ko',
    userText: '서울에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘',
  });
  assert.doesNotMatch(typedRouteFooter, /버스타고/);
  const typedRouteBound = polishFestivalModelReply('서울에서 열차로 갑니다.', {
    locale: 'ko',
    contentId: '2930716',
    userText: '서울에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
  });
  assert.match(typedRouteBound, /버스타고/);
  assert.match(typedRouteBound, /행사 기간은 10\/15~18/);
  const accessPolished = polishFestivalModelReply('서울에서 열차로 갑니다.', {
    chipId: 'festival_access',
    contentId: '2930716',
    locale: 'ko',
    userText: '서울에서 가는 법',
    eventStartDate: '20261015',
    eventEndDate: '20261018',
  });
  assert.match(accessPolished, /버스타고/);

  const oneStay = polishFestivalModelReply(
    '강릉 월화거리에서 묵어요. 다양한 숙소가 자리하고 있어요. 강릉의 매력을 느끼며 쉬어요.',
    {
      contentId: '2930716',
      locale: 'ko',
      userText: '어디서 자요?',
      placeName: '강릉',
      stayAreas: ['월화거리'],
      lat: 37.755777,
      lng: 128.897602,
      festivalTitle: '강릉 국수 축제',
    },
  );
  assert.match(oneStay, /월화거리/);
  assert.match(oneStay, /#festival-lodging/);
  assert.doesNotMatch(oneStay, /다양한 숙소가 자리|매력을 느끼며/);
  const stayHint = await resolveMooniChatKoreaFestivalHint({
    userText: '어디서 자요?',
    locale: 'ko',
    festivalContext: {
      title: '강릉 국수 축제',
      contentId: '2930716',
      hubLabel: '강릉',
      stayAreas: ['월화거리'],
      lat: 37.755777,
      lng: 128.897602,
      homepage: page,
      tel: '033-640-4531',
    },
  });
  assert.match(stayHint.hint, /다양한 숙소가 자리하고 있어요/);
  assert.match(stayHint.hint, /\[공식 홈페이지\]\(https:\/\/visitgangneung\.net\/pub\/gnfestival\/4748\.do\)/);
  assert.match(stayHint.hint, /033-640-4531/);
  const namedStays = polishFestivalModelReply(
    '월화거리 인근으로 교동 권역에서 숙소를 찾을 수 있어요. 다양한 숙소가 자리하고 있어요.',
    {
      contentId: '2930716',
      locale: 'ko',
      userText: '어디서 자요?',
      placeName: '강릉',
      stayAreas: ['월화거리', '교동', '안목'],
      lat: 37.755777,
      lng: 128.897602,
      nearbyStays: [
        { name: '강릉 씨사이드', distKm: 0.35 },
        { name: '교동 스테이', distKm: 1.2 },
        { name: '경포 호텔', distKm: 8 },
        { name: '먼 호텔', distKm: 12 },
      ],
    },
  );
  assert.match(namedStays, /강릉 씨사이드\(350m\)/);
  assert.match(namedStays, /교동 스테이\(1\.2km\)/);
  assert.match(namedStays, /경포 호텔\(8km\)/);
  assert.doesNotMatch(namedStays, /먼 호텔|인근으로|숙소가 자리|다양한 숙소|월화거리/);
  assert.match(namedStays, /\[숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716#festival-lodging\)/);
  assert.match(namedStays, /가까운 숙소로 .*경포 호텔\(8km\)이 있어요/);
  assert.doesNotMatch(namedStays, /예요|이에요/);
  assert.equal((namedStays.match(/#festival-lodging/g) || []).length, 1);
  const batchimLead = polishFestivalModelReply('숙소예요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '어디서 자요?',
    lat: 37.755777,
    lng: 128.897602,
    nearbyStays: [
      { name: '호텔 탑스텐 강릉', distKm: 1.2 },
      { name: '다온한옥펜션', distKm: 2 },
      { name: '서머셋 제주신화월드', distKm: 3.4 },
    ],
  });
  assert.match(batchimLead, /가까운 숙소로 호텔 탑스텐 강릉\(1\.2km\), 다온한옥펜션\(2km\), 서머셋 제주신화월드\(3\.4km\)가 있어요/);
  assert.doesNotMatch(batchimLead, /강릉예요|펜션예요|월드예요|예요|이에요/);
  const gangneungOnly = polishFestivalModelReply('숙소예요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '숙소',
    nearbyStays: [{ name: '호텔 탑스텐 강릉', distKm: 1.2 }],
  });
  assert.match(gangneungOnly, /호텔 탑스텐 강릉\(1\.2km\)이 있어요/);
  const pensionOnly = polishFestivalModelReply('숙소예요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '숙소',
    nearbyStays: [{ name: '다온한옥펜션', distKm: 2 }],
  });
  assert.match(pensionOnly, /다온한옥펜션\(2km\)이 있어요/);
  const worldOnly = polishFestivalModelReply('숙소예요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '숙소',
    nearbyStays: [{ name: '서머셋 제주신화월드', distKm: 3.4 }],
  });
  assert.match(worldOnly, /서머셋 제주신화월드\(3\.4km\)가 있어요/);
  const noBatchimLead = polishFestivalModelReply('숙소예요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '숙소',
    nearbyStays: [{ name: '강릉 스카이베이', distKm: 1 }],
  });
  assert.match(noBatchimLead, /가까운 숙소로 강릉 스카이베이\(1km\)가 있어요/);
  const inventedKm = polishFestivalModelReply(
    '호텔 탑스텐 강릉은 1.2km이고 신라모노그램은 99km예요.',
    {
      contentId: '2930716',
      locale: 'ko',
      userText: '숙소',
      lat: 37.755777,
      lng: 128.897602,
      nearbyStays: [
        { name: '호텔 탑스텐 강릉', lat: 37.766, lng: 128.9 },
        { name: '신라모노그램' },
      ],
    },
  );
  assert.match(inventedKm, /호텔 탑스텐 강릉\(\d+(?:\.\d+)?km\)/);
  assert.doesNotMatch(inventedKm, /신라모노그램|99\s*km/);
  const mixedHint = await resolveMooniChatKoreaFestivalHint({
    userText: '숙소',
    locale: 'ko',
    festivalContext: {
      title: '강릉 국수 축제',
      contentId: '2930716',
      lat: 37.755777,
      lng: 128.897602,
      nearbyStays: [
        { name: '호텔 탑스텐 강릉', lat: 37.766, lng: 128.9 },
        { name: '신라모노그램' },
      ],
    },
  });
  const mixedLine = mixedHint.hint.split('\n').find((line) => line.includes('숙소 답:')) || '';
  assert.match(mixedLine, /호텔 탑스텐 강릉\(\d+(?:\.\d+)?km\)/);
  assert.doesNotMatch(mixedLine, /신라모노그램/);
  assert.doesNotMatch(mixedLine, /거리와 함께 말한다/);
  const bareKm = polishFestivalModelReply(
    '호텔 탑스텐 강릉까지 4km예요. [강릉 숙소 안내](https://www.gateo.kr/korea/?festival=2930716#festival-lodging)',
    {
      contentId: '2930716',
      locale: 'ko',
      userText: '숙소',
    },
  );
  assert.doesNotMatch(bareKm, /4\s*km/);
  assert.match(bareKm, /#festival-lodging/);
  const areaSearch = polishFestivalModelReply(
    '교동 권역에서 숙소를 찾을 수 있어요. [강릉 숙소 안내](https://www.gateo.kr/korea/?festival=2930716#festival-lodging)',
    {
      contentId: '2930716',
      locale: 'ko',
      userText: '어디서 자요?',
      placeName: '강릉',
    },
  );
  assert.doesNotMatch(areaSearch, /권역에서 숙소를 찾을 수 있어요/);
  assert.match(areaSearch, /#festival-lodging/);
  const namedHint = await resolveMooniChatKoreaFestivalHint({
    userText: '어디서 자요?',
    locale: 'ko',
    festivalContext: {
      title: '강릉 국수 축제',
      contentId: '2930716',
      nearbyStays: [
        { name: '강릉 씨사이드', distKm: 0.35 },
        { name: '교동 스테이', distKm: 1.2 },
      ],
    },
  });
  assert.match(namedHint.hint, /강릉 씨사이드\(350m\)/);
  assert.match(namedHint.hint, /\[숙소 카드\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716#festival-lodging\)/);

  const fromIntro = buildFestivalMooniContext({
    item: { title: '강릉 국수 축제', contentId: '2930716' },
    intro: {
      sponsor1tel: '033-640-4531',
      eventhomepage: page,
      parking: '월화거리 공영주차장',
    },
  });
  assert.equal(fromIntro.tel, '033-640-4531');
  assert.equal(fromIntro.homepage, page);
  assert.match(fromIntro.parking, /월화거리 공영주차장/);

  const unlinked = polishFestivalModelReply('월화거리에서 국수를 먹어요. 가는 법을 알아보세요.', {
    contentId: '2930716',
    locale: 'ko',
    userText: '일정',
  });
  assert.doesNotMatch(unlinked, /가는 법/);
  const nudge = polishFestivalModelReply('국수를 먹어요. 다음에는 숙소를 안내해 드릴까요?', {
    contentId: '2930716',
    locale: 'ko',
    userText: '일정',
  });
  assert.doesNotMatch(nudge, /안내해 드릴까요|다음에는/);

  const gangneung = JSON.parse(readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/2930716.json'), 'utf8'));
  const threeCtx = buildFestivalMooniContext({
    ...gangneung,
    nearbyPlaces: ['기린사우나', '강릉시 행정복지센터', '경포해변', '오죽헌', '강릉향교'],
  });
  const threeFacts = buildFestivalFirstAnswerFacts(threeCtx, { now: NOW });
  assert.deepEqual(threeFacts.nearby, ['경포해변', '오죽헌', '강릉향교']);
  const thin = acceptFestivalModelOpening(
    '강릉 국수 축제는 10/15~18, 엿새 뒤 시작해요. 장칼국수를 맛볼 수 있는 자리예요. 근처에서는 경포해변을 둘러볼 수 있어요.',
    threeFacts,
    [threeCtx.address, threeCtx.timeText, threeCtx.feeText],
  );
  assert.match(thin, /경포해변/);
  assert.match(thin, /오죽헌/);
  assert.match(thin, /강릉향교/);

  const many = buildFestivalMooniContext({
    item: { title: '테스트 축제', contentId: '1' },
    nearbyPlaces: Array.from({ length: 8 }, (_, index) => `장소${index}`),
  });
  assert.equal(many.nearbyPlaces.length, 8);

  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.equal((chat.match(/loadFestivalAskContext/g) || []).length >= 3, true);
  assert.match(chat, /buildFestivalMooniPolishOptions/);
  assert.match(chat, /loadFestivalRestaurantsForAsk/);
  assert.match(chat, /loadFestivalLodgingForAsk/);
  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  assert.match(sheet, /beginFestivalRestaurantLoad/);
  const stayStrip = readFileSync(join(root, 'src/pages/WorldEvents/EventStayStrip.jsx'), 'utf8');
  assert.match(stayStrip, /beginFestivalLodgingLoad/);
  assert.match(stayStrip, /publishFestivalLodgingStays/);
});

test('festival page link appears once and the closing link stays', () => {
  const pageUrl = 'https://www.gateo.kr/korea/?festival=2930716';
  const bare = 'https://gateo.kr/korea/?festival=2930716';
  const doubled = `[강릉 국수 축제 페이지](${pageUrl}) 자세한 내용은 [축제 페이지](${pageUrl})에서 볼 수 있어요.`;
  const gukhyangDup = '[국향대전](https://www.gateo.kr/korea/?festival=638576)과, [국향대전](https://www.gateo.kr/korea/?festival=638576) 확인';
  assert.equal(
    cleanOrphanLinkConjunctions(dedupeFestivalPageLinks(gukhyangDup)),
    '[국향대전](https://www.gateo.kr/korea/?festival=638576) 확인',
  );
  assert.match(rewriteFestivalFormalEndings('열차에 탑승하십시오.'), /탑승해요/);
  const srtStrip = stripDisallowedFestivalLinks(
    '[코레일](https://www.letskorail.com/)이나 [SRT](https://example.com/srt)에서 확인하세요',
  );
  assert.match(srtStrip, /letskorail\.com/);
  assert.doesNotMatch(srtStrip, /이나\s+에서/);
  assert.match(srtStrip, /SRT에서 확인하세요|에서 확인하세요/);
  const fillerOnly = polishFestivalModelReply('허심청브로이 옥토버페스트까지 가는 길을 안내해 드릴게요.', {
    chipId: 'festival_access',
    locale: 'ko',
  });
  assert.doesNotMatch(fillerOnly, /가는 길을/);
  assert.doesNotMatch(fillerOnly, /안내해\s*드릴게요/);
  const fillerAnnye = polishFestivalModelReply('대구에서 마산역까지 경로를 안내할게요.', {
    chipId: 'festival_access',
    locale: 'ko',
    contentId: '637693',
  });
  assert.doesNotMatch(fillerAnnye, /안내할게요/);
  const chipLeak = polishFestivalModelReply(
    '동대구역에서 KTX로 마산역에 도착해요. 교통 · 티켓 출발 전 준비',
    {
      contentId: '637693',
      locale: 'ko',
      chipId: null,
      userText: buildFestivalAccessAskText('daegu', 'ko'),
      eventStartDate: '20261031',
      eventEndDate: '20261108',
    },
  );
  assert.match(chipLeak, /마산역/);
  assert.doesNotMatch(chipLeak, /교통\s*·\s*티켓|출발 전 준비/);
  const accessPeriod = polishFestivalModelReply('서울역에서 KTX로 출발해요.', {
    chipId: 'festival_access',
    contentId: '2930716',
    locale: 'ko',
    eventStartDate: '20261010',
    eventEndDate: '20261012',
  });
  assert.match(accessPeriod, /행사 기간은 10\/10~12이에요/);
  const once = dedupeFestivalPageLinks(doubled);
  assert.equal((once.match(/festival=2930716/g) || []).length, 1);
  assert.match(once, /^자세한 내용은 \[축제 페이지\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716\)에서 볼 수 있어요\.$/);

  const withStay = `${doubled} [강릉 숙소 안내](${pageUrl}#festival-lodging)`;
  const stayed = dedupeFestivalPageLinks(withStay);
  assert.equal((stayed.match(/festival=2930716\)/g) || []).length, 1);
  assert.match(stayed, /#festival-lodging/);

  const polished = polishFestivalModelReply(
    `월화거리에서 국수를 먹어요. [강릉 국수 축제 페이지](${bare}) 자세한 내용은 [축제 페이지](${pageUrl})에서 볼 수 있어요.`,
    { contentId: '2930716', locale: 'ko', userText: '일정' },
  );
  assert.equal((polished.match(/festival=2930716/g) || []).length, 1);
  assert.match(polished, /자세한 내용은 \[축제 페이지\]/);
  assert.doesNotMatch(polished, /강릉 국수 축제 페이지\]/);

  const gangneung = JSON.parse(readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/2930716.json'), 'utf8'));
  const facts = buildFestivalFirstAnswerFacts(buildFestivalMooniContext(gangneung), { now: NOW });
  const opening = acceptFestivalModelOpening(
    `강릉 국수 축제는 10/15~18, 엿새 뒤 시작해요. 장칼국수를 맛볼 수 있는 자리예요. [강릉 국수 축제 페이지](${pageUrl}) 자세한 내용은 [축제 페이지](${pageUrl})에서 볼 수 있어요.`,
    facts,
    [],
  );
  assert.equal((opening.match(/festival=2930716/g) || []).length, 1);
  assert.match(opening, /자세한 내용은 \[축제 페이지\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716\)에서 볼 수 있어요/);
  assert.doesNotMatch(opening, /강릉 국수 축제 페이지\]/);
});

test('gukhyang access polish guards dongdaegu–gwangju songjeong direct rail and glues fares', () => {
  const misleading = polishFestivalModelReply(
    '동대구에서 KTX나 SRT를 타고 광주송정으로 가요. 요금은 2,600원에서 4,800원이에요.',
    {
      contentId: '638576',
      chipId: 'festival_access',
      locale: 'ko',
      userText: buildFestivalAccessAskText('daegu', 'ko'),
      eventStartDate: '20261023',
      eventEndDate: '20261108',
    },
  );
  assert.doesNotMatch(misleading, /동대구에서\s+KTX나\s+SRT를\s+타고\s+광주송정/);
  assert.match(misleading, /직통 열차는 없어요/);
  assert.match(misleading, /광주\(유·스퀘어\)/);
  assert.match(misleading, /함평행 버스/);
  assert.match(misleading, /2,\u2060600원에서 4,\u2060800원/);
  const seoulWindow = polishFestivalModelReply(
    '용산→함평은 ITX로 16:29~19:29 사이에 바로 갈 수 있고 요금은 36,300원이에요.',
    {
      contentId: '638576',
      chipId: 'festival_access',
      locale: 'ko',
      userText: buildFestivalAccessAskText('seoul', 'ko'),
      eventStartDate: '20261023',
      eventEndDate: '20261108',
    },
  );
  assert.match(seoulWindow, /조회한 시간대\(16:\u206029\u2060~\u206019:\u206029\)에 운행하는 출발편 예시로 바로 갈 수/);
  assert.doesNotMatch(seoulWindow, /사이에 바로/);
  assert.doesNotMatch(seoulWindow, /출발편 기준/);
  const gangneungVague = polishFestivalModelReply(
    '열차를 이용할 때는 동대구역에서 출발해 환승 경로를 거쳐 강릉역으로 이동할 수 있어요.',
    {
      contentId: '2930716',
      chipId: 'festival_access',
      locale: 'ko',
      userText: buildFestivalAccessAskText('daegu', 'ko'),
      eventStartDate: '20261015',
      eventEndDate: '20261018',
    },
  );
  assert.doesNotMatch(gangneungVague, /환승\s*경로를\s*거쳐/);
  assert.match(gangneungVague, /대구고속버스터미널|동대구/);
  const markdown = readFileSync(join(root, 'src/components/chat/MooniChatMarkdown.jsx'), 'utf8');
  assert.match(markdown, /word-break:keep-all/);
});

test('round 9 strips standalone 교통편 검색 after domestic 12Go CTA removal', () => {
  const remnant = [
    '허심청브로이 옥토버페스트까지 버스로 갈 수 있어요.',
    '교통편 검색(12Go)',
    '교통편 검색',
  ].join('\n');
  assert.equal(stripDomesticTwelveGoMention(remnant), '허심청브로이 옥토버페스트까지 버스로 갈 수 있어요.');
  const polished = polishFestivalModelReply(remnant, {
    contentId: '2855626',
    locale: 'ko',
    userText: '부산에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘',
  });
  assert.match(polished, /옥토버페스트/);
  assert.doesNotMatch(polished, /교통편\s*검색|12\s*Go/i);
});

test('round 8 polish drops redundant booking link lines and chip labels', () => {
  const korail = 'https://www.letskorail.com/';
  const kobus = 'https://www.kobus.co.kr/';
  const daeguBody = [
    `동대구역에서 KTX로 마산역에 도착해요. 시각은 [코레일](${korail})에서 확인하세요.`,
    '',
    `[코레일](${korail})`,
    `[고속버스](${kobus})`,
  ].join('\n');
  const daeguPolished = polishFestivalModelReply(daeguBody, {
    contentId: '637693',
    chipId: 'festival_access',
    locale: 'ko',
    userText: buildFestivalAccessAskText('daegu', 'ko'),
    eventStartDate: '20261031',
    eventEndDate: '20261108',
  });
  assert.match(daeguPolished, /동대구역에서 KTX로 마산역에 도착해요\.\s*시각은 \[코레일\]/);
  assert.doesNotMatch(daeguPolished, /\n\[코레일\]\(/);
  assert.doesNotMatch(daeguPolished, /\n\[고속버스\]\(/);
  assert.equal(
    stripRedundantBookingLinkOnlyLines(daeguBody),
    `동대구역에서 KTX로 마산역에 도착해요. 시각은 [코레일](${korail})에서 확인하세요.`,
  );

  const cheonanBody = [
    '천안에서 출발해 마산역까지 KTX로 갈 수 있어요.',
    '',
    '* **교통 · 티켓**',
    '* **출발 전 준비**',
  ].join('\n');
  const cheonanPolished = polishFestivalModelReply(cheonanBody, {
    contentId: '637693',
    chipId: 'festival_access',
    locale: 'ko',
    userText: buildFestivalAccessAskText('chungnam', 'ko'),
    eventStartDate: '20261031',
    eventEndDate: '20261108',
  });
  assert.match(cheonanPolished, /^천안에서 출발해 마산역까지 KTX로 갈 수 있어요\./);
  assert.doesNotMatch(cheonanPolished, /교통\s*·\s*티켓|출발 전 준비/);
  assert.match(cheonanPolished, /행사 기간은 10\/31~11\/8이에요/);
  assert.equal(stripInlineChipLabelPhrases('* **교통 · 티켓**'), '');
  assert.equal(stripInlineChipLabelPhrases('답. 교통 · 티켓 출발 전 준비'), '답.');

  const dated = polishFestivalModelReply('마산역까지 KTX로 가요. 행사는 10/31~11/8이에요.', {
    contentId: '637693',
    chipId: 'festival_access',
    locale: 'ko',
    userText: buildFestivalAccessAskText('daegu', 'ko'),
    eventStartDate: '20261031',
    eventEndDate: '20261108',
  });
  assert.doesNotMatch(dated, /행사 기간은 10\/31~11\/8이에요\.\s*\n\n행사 기간은/);
  assert.equal((dated.match(/행사 기간은/g) || []).length, 0);
  assert.match(dated, /10\/31~11\/8/);
});

test('festival access polish path adds 행사 기간 from real mooni context', () => {
  const busanFixture = JSON.parse(
    readFileSync(join(root, 'scripts/staging/fixtures/festival-opening/2855626.json'), 'utf8'),
  );
  const cases = [
    buildFestivalMooniContext({
      item: {
        contentId: '637693',
        title: '마산가고파국화축제',
        eventStartDate: '2026-10-26',
        eventEndDate: '2026-11-03',
      },
      intro: { eventplace: '3·15해양누리공원' },
    }),
    buildFestivalMooniContext({
      item: {
        contentId: '638576',
        title: '국향대전',
        eventStartDate: '20261023',
        eventEndDate: '20261108',
        addr1: '전라남도 함평군 함평읍 수호리',
      },
      intro: { eventplace: '함평엑스포공원' },
    }),
    buildFestivalMooniContext(busanFixture),
  ];
  for (const ctx of cases) {
    const prepared = prepareFestivalMooniChatPayload({
      festivalContext: true,
      userText: buildFestivalAccessAskText('daegu', 'ko'),
      chipId: null,
      destinationName: ctx.title,
    });
    const polishOpts = buildFestivalMooniPolishOptions(ctx, {
      locale: 'ko',
      chipId: prepared.chipFacts?.chipId ?? null,
      userText: prepared.modelUserText,
    });
    assert.ok(polishOpts.eventStartDate, `start date for ${ctx.contentId}`);
    const polished = polishFestivalModelReply('대중교통으로 갈 수 있어요.', polishOpts);
    assert.match(
      polished,
      /행사 기간은 \d{1,2}\/\d{1,2}/,
      `행사 기간 line missing for ${ctx.contentId}: ${polished}`,
    );
  }
});

test('desktop and mobile place entry open bound MOONi', () => {
  const home = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
  const openIdx = home.indexOf('onOpenChat={(p) => {');
  assert.ok(openIdx >= 0);
  assert.match(home.slice(openIdx, openIdx + 280), /openMooniFromPlace\(p\)/);
  const fabIdx = home.indexOf('onOpenChat={(payload) => {');
  assert.match(home.slice(fabIdx, fabIdx + 360), /openMooniFromPlace\(payload\)/);
});
