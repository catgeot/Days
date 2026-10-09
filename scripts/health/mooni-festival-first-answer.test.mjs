import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { KO, EN } from '../../src/i18n/mooniPromptBundleData.js';
import { KO as ServerKO, EN as ServerEN } from '../../supabase/functions/_shared/gemini/mooniPromptBundleData.js';
import koLocale from '../../src/i18n/locales/ko.json' with { type: 'json' };
import enLocale from '../../src/i18n/locales/en.json' with { type: 'json' };
import {
  buildFestivalMooniContext,
  buildFestivalMooniSentenceAnswer,
  countFestivalCardSentences,
} from '../../src/pages/Korea/lib/festivalMooniContext.js';
import {
  appendFestivalLodgingNextStep,
  buildMooniBoundFestivalSystemHint,
  gateoKoreaFestivalLodgingUrl,
  isFestivalLodgingAsk,
  resolveMooniChatKoreaFestivalHint,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import { renderMooniSystem } from '../../supabase/functions/_shared/gemini/templates.js';
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
  nearbyPlaces: ['경포해변', '오죽헌'],
  homepage: 'https://visitgangneung.net/pub/gnfestival/4748.do',
};

test('festival opening is sentences with dates, link, and no filler', () => {
  const ctx = buildFestivalMooniContext(GANGNEUNG);
  const ko = buildFestivalMooniSentenceAnswer(ctx, { locale: 'ko', now: NOW });
  const en = buildFestivalMooniSentenceAnswer(ctx, { locale: 'en', now: NOW });

  assert.match(ko, /강릉 국수 축제는 강릉 월화거리 일원/);
  assert.match(ko, /장칼국수와 막국수/);
  assert.match(ko, /먹거리존, 누들 경연대회/);
  assert.match(ko, /12:00~21:00/);
  assert.match(ko, /시작까지 6일/);
  assert.match(ko, /확인된 근처 장소는 경포해변 하나예요/);
  assert.doesNotMatch(ko, /오죽헌/);
  assert.match(ko, /2026년 10월 15일부터 2026년 10월 18일까지/);
  assert.match(ko, /https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716/);
  assert.match(ko, /다음으로 가는 법을 정할 수 있어요\.$/);
  assert.ok(countFestivalCardSentences(ko) <= 7, `sentences ${countFestivalCardSentences(ko)}: ${ko}`);
  assert.ok(countFestivalCardSentences(ko) >= 4);
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

  assert.match(en, /Gangneung Noodle Festival \(강릉 국수 축제\) is held at/);
  assert.match(en, /starts in 6 days/);
  assert.match(en, /from ICN/);
  assert.match(en, /festival=2930716/);
  assert.doesNotMatch(en, /welcome/i);
  assert.doesNotMatch(en, /장칼국수/);
  assert.doesNotMatch(en, /사랑을 받/);
  let enOutsideNames = en;
  for (let i = 0; i < 6; i += 1) enOutsideNames = enOutsideNames.replace(/\([^()]*\)/g, '');
  assert.doesNotMatch(enOutsideNames, /[가-힣]/);
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
  assert.match(ko, /‘섬夜시즌’은 제주시 탑동광장/);
  assert.match(ko, /나이트워크, 섬夜 콘서트, 부대 행사, 섬夜 불꽃놀이예요/);
  assert.doesNotMatch(ko, /프로그램\s*:/);
  assert.doesNotMatch(ko, /개최/);
  assert.doesNotMatch(ko, /관광협회/);
  assert.doesNotMatch(ko, /정취/);
  assert.doesNotMatch(ko, /내려놓/);
  assert.doesNotMatch(ko, /열린다/);
  assert.doesNotMatch(ko, /펼쳐질/);
  assert.doesNotMatch(ko, /또한 양일간/);
  assert.match(ko, /\?festival=3554702/);
  assert.match(ko, /다음으로 가는 법을 정할 수 있어요\.$/);
  assert.ok(countFestivalCardSentences(ko) <= 7);

  const enCtx = { ...ctx, feeText: 'Free' };
  const en = buildFestivalMooniSentenceAnswer(enCtx, { locale: 'en', now: NOW });
  assert.match(en, /Night festival \(2026 원도심 야간여행 ‘섬夜시즌’\)/);
  assert.match(en, /admission is free/i);
  assert.match(en, /from ICN/);
  let enOutsideNames = en;
  for (let i = 0; i < 6; i += 1) enOutsideNames = enOutsideNames.replace(/\([^()]*\)/g, '');
  assert.doesNotMatch(enOutsideNames, /[가-힣]/);
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
  assert.match(lodgingHint.hint, /no other stay URL/);

  const otherHint = await resolveMooniChatKoreaFestivalHint({
    userText: 'what can I see',
    festivalContext: { title: '강릉 국수 축제', contentId: '2930716' },
    locale: 'en',
  });
  assert.doesNotMatch(otherHint.hint, /festival-lodging/);

  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  assert.match(chat, /appendFestivalLodgingNextStep/);
  assert.match(sheet, /id=\{FESTIVAL_LODGING_SECTION_ID\}/);
  assert.match(sheet, /FESTIVAL_LODGING_EVENT/);
});

test('prompts forbid an unlinked outside-channel closing', () => {
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
  assert.match(hint, /시작 전, 시작까지 6일/);
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
  const clientPrompts = readFileSync(join(root, 'src/pages/Home/lib/prompts.js'), 'utf8');
  assert.match(clientPrompts, /없는 URL을 지어내지/);
  assert.match(clientPrompts, /festivalPriorityLine/);
  assert.doesNotMatch(clientPrompts, /Trip\.com 등 항공 전용 채널/);
});

test('desktop and mobile place entry open bound MOONi', () => {
  const home = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
  const openIdx = home.indexOf('onOpenChat={(p) => {');
  assert.ok(openIdx >= 0);
  assert.match(home.slice(openIdx, openIdx + 280), /openMooniFromPlace\(p\)/);
  const fabIdx = home.indexOf('onOpenChat={(payload) => {');
  assert.match(home.slice(fabIdx, fabIdx + 360), /openMooniFromPlace\(payload\)/);
});
