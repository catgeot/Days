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
} from '../../src/pages/Korea/lib/festivalMooniContext.js';
import { buildMooniBoundFestivalSystemHint } from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
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
  overview: '장칼국수와 막국수를 맛보는 자리입니다.',
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
  assert.match(ko, /경포해변, 오죽헌/);
  assert.match(ko, /2026년 10월 15일부터 2026년 10월 18일까지/);
  assert.match(ko, /https:\/\/www\.gateo\.kr\/korea\/\?festival=2930716/);
  assert.match(ko, /다음으로 가는 법/);
  assert.doesNotMatch(ko, /오신 것을 환영합니다/);
  assert.doesNotMatch(ko, /단순히 국수를 먹는/);
  assert.doesNotMatch(ko, /공식 홈페이지에서 확인/);
  assert.doesNotMatch(ko, /^[-•*]\s/m);
  assert.doesNotMatch(ko, /오후 2시/);

  assert.match(en, /Gangneung|강릉 국수 축제 is held at/);
  assert.match(en, /starts in 6 days/);
  assert.match(en, /from ICN/);
  assert.match(en, /festival=2930716/);
  assert.doesNotMatch(en, /welcome/i);
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
