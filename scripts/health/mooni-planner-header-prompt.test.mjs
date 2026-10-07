import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderMooniSystem } from '../../supabase/functions/_shared/gemini/templates.js';
import {
  buildMooniBoundFestivalSystemHint,
  resolveMooniChatKoreaFestivalHint,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import {
  countMooniPlannerHeaderGuidance,
  mooniChatShowsPlannerHeaderButton,
} from '../../src/shared/mooni/mooniChatPlannerHeaderPrompt.js';

const FESTIVAL_CTX_790124 = {
  contentId: '790124',
  title: '홍천 인삼한우 명품축제',
  eventStartDate: '20261008',
  eventEndDate: '20261011',
  homepage: 'https://example.org/festival',
};

test('mooniChatShowsPlannerHeaderButton — catalog slug와 ChatModal 헤더 동일', () => {
  assert.equal(mooniChatShowsPlannerHeaderButton(null), false);
  assert.equal(mooniChatShowsPlannerHeaderButton(''), false);
  assert.equal(mooniChatShowsPlannerHeaderButton('ishigaki'), true);
});

test('festival 세션(showPlannerHeader false) — system prompt에 플래너 헤더 안내 0건', async () => {
  const { hint } = await resolveMooniChatKoreaFestivalHint({
    userText: '주차는?',
    festivalContext: FESTIVAL_CTX_790124,
    locale: 'ko',
  });
  const system = renderMooniSystem({
    locale: 'ko',
    persona: 'GENERAL',
    locationName: FESTIVAL_CTX_790124.title,
    boundPlaceName: FESTIVAL_CTX_790124.title,
    isMooni: true,
    cta: 'none_quiet',
    ctaPlace: FESTIVAL_CTX_790124.title,
    koreaFestivalHint: hint,
    showPlannerHeader: false,
  });
  assert.equal(countMooniPlannerHeaderGuidance(system), 0);
});

test('place-linked 세션(showPlannerHeader true) — CTA에 플래너 헤더 안내 포함', () => {
  const system = renderMooniSystem({
    locale: 'ko',
    persona: 'PLANNER',
    locationName: '이시가키',
    boundPlaceName: '이시가키',
    isMooni: true,
    cta: 'none_quiet',
    ctaPlace: '이시가키',
    showPlannerHeader: true,
  });
  assert.ok(countMooniPlannerHeaderGuidance(system) > 0);
  assert.ok(system.includes('플래너 보기'));
});

test('buildMooniBoundFestivalSystemHint — 목록 밖 시설 단정 금지 지시', () => {
  const hint = buildMooniBoundFestivalSystemHint(FESTIVAL_CTX_790124, 'ko');
  assert.ok(
    hint.includes('목록에 없는') && hint.includes('단정하지'),
    'no-unlisted-facility-assertion instruction',
  );
  assert.ok(hint.includes('공식 홈페이지') || hint.includes('문의처'));
});
