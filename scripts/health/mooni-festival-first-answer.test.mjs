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
  appendFestivalLodgingNextStep,
  buildMooniBoundFestivalSystemHint,
  gateoKoreaFestivalLodgingUrl,
  isFestivalLodgingAsk,
  linkifyBareGateoFestivalUrls,
  polishFestivalModelReply,
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
  stripDisallowedFestivalLinks,
  stripDomesticEntryDocLines,
  stripMooniUiChipLabels,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import {
  invokeMooniChatToleratingChip,
  LEGACY_MOONI_CHIP_IDS,
  MOONI_CHIP_EDGE_FALLBACK,
} from '../../src/pages/Home/lib/mooniChipEdgeFallback.js';
import { GeminiProxyError } from '../../src/pages/Home/lib/geminiProxyError.js';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';
import { renderFestivalFirstAnswer, renderMooniSystem } from '../../supabase/functions/_shared/gemini/templates.js';
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

test('festival opening is sentences with dates, link, and no filler', () => {
  const ctx = buildFestivalMooniContext(GANGNEUNG);
  const ko = buildFestivalMooniSentenceAnswer(ctx, { locale: 'ko', now: NOW });
  const en = buildFestivalMooniSentenceAnswer(ctx, { locale: 'en', now: NOW });

  assert.match(ko, /강릉 국수 축제는 10\/15~18, 엿새 뒤 시작해요/);
  assert.match(ko, /장칼국수와 막국수를 맛보는 자리예요/);
  assert.match(ko, /먹거리존과 누들 경연대회도 있어요/);
  assert.match(ko, /월화거리에서 저녁까지 이어지고/);
  assert.match(ko, /근처에서는 경포해변, 오죽헌을 둘러볼 수 있어요/);
  assert.doesNotMatch(ko, /하나예요|합니다|입니다|기준|경강로|12:00|입장료|사우나|복지|노인회|주민센터/);
  assert.match(ko, /\[축제 페이지\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716\)/);
  assert.match(ko, /다음으로 가는 법을 정할 수 있어요\.$/);
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
  assert.match(en, /from ICN/);
  assert.match(en, /\[the festival page\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716\)/);
  assert.match(en, /Details are on \[the festival page\]/);
  assert.doesNotMatch(en, /welcome/i);
  assert.doesNotMatch(en, /사랑을 받/);
  assert.ok(countFestivalCardSentences(en) <= 5, en);
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
  assert.match(enProse, /Details are on the festival page|\[the festival page\]/);
  assert.equal(
    acceptFestivalModelOpening('강릉 국수 축제 runs 10/15–18. Nearby, 경포해변.', enFacts),
    '',
  );
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
  assert.equal((kept.match(/강릉 국수 축제/g) || []).length, 1);
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
  assert.equal((kept.match(/허심청브로이 옥토버페스트/g) || []).length, 1);
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
  assert.match(ko, /다음으로 가는 법을 정할 수 있어요\.$/);
  assert.ok(countFestivalCardSentences(ko) <= 5);

  const enCtx = { ...ctx, feeText: 'Free' };
  const en = buildFestivalMooniSentenceAnswer(enCtx, { locale: 'en', now: NOW });
  assert.match(en, /Night festival \(2026 원도심 야간여행 ‘섬夜시즌’\)/);
  assert.match(en, /Night Walk \(나이트워크\)/);
  assert.match(en, /starts in 8 days/);
  assert.match(en, /Tapdong Plaza \(탑동광장\)/);
  assert.doesNotMatch(en, /admission is free|is held at|Gungjung/i);
  assert.match(en, /from ICN/);
});

test('festival chips: four answers plus overseas group, English puts overseas first', () => {
  const replies = readFileSync(join(root, 'src/pages/Home/lib/mooniQuickReplies.js'), 'utf8');
  const chips = readFileSync(join(root, 'src/components/chat/MooniQuickReplyChips.jsx'), 'utf8');
  assert.match(replies, /en \? \[FESTIVAL_OVERSEAS_L1, \.\.\.FESTIVAL_CORE_L1\]/);
  assert.match(replies, /id: 'festival_sights'/);
  assert.match(replies, /id: 'festival_access', drillDown: true/);
  assert.match(replies, /id: 'festival_overseas', drillDown: true/);
  assert.match(replies, /축제장까지 대중교통과 차로 가는 법/);
  assert.match(replies, /to this festival by public transit and by car/);
  assert.match(replies, /iata: 'ICN', ko: '서울', en: 'ICN'/);
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
  assert.equal(stripDisallowedFestivalLinks('[이동](https://www.gateo.kr/)'), '');
  assert.match(
    stripDisallowedFestivalLinks('[숙소 카드](https://www.gateo.kr/korea/?festival=2930716#festival-lodging)'),
    /festival-lodging/,
  );
  assert.equal(stripMooniUiChipLabels('끝 [출발 전 준비] [교통 · 티켓]'), '끝');
  assert.equal(stripMooniUiChipLabels('--- ### 교통 · 티켓 ### 출발 전 준비'), '');
  assert.equal(stripMooniUiChipLabels('### 교통 · 티켓 - ### 출발 전 준비 -'), '');
  assert.equal(stripMooniUiChipLabels('교통 · 티켓 출발 전 준비'), '');
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
  assert.equal((doubled.match(/Gangneung Noodle Festival/g) || []).length, 1);
  assert.match(doubled, /spicy hand-cut noodles \(장칼국수\)/);
});

test('desktop and mobile place entry open bound MOONi', () => {
  const home = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
  const openIdx = home.indexOf('onOpenChat={(p) => {');
  assert.ok(openIdx >= 0);
  assert.match(home.slice(openIdx, openIdx + 280), /openMooniFromPlace\(p\)/);
  const fabIdx = home.indexOf('onOpenChat={(payload) => {');
  assert.match(home.slice(fabIdx, fabIdx + 360), /openMooniFromPlace\(payload\)/);
});
