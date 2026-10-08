import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderMooniSystem } from '../../supabase/functions/_shared/gemini/templates.js';
import { buildMooniBoundFestivalSystemHint } from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import { countMooniPlannerHeaderGuidance } from '../../supabase/functions/_shared/gemini/mooniChatPlannerHeaderPrompt.js';

const FESTIVAL_CTX_790124 = {
  contentId: '790124',
  title: '홍천 인삼한우 명품축제',
  eventStartDate: '20261008',
  eventEndDate: '20261011',
};

test('Edge renderMooniSystem — showPlannerHeader false 시 플래너 헤더 안내 0건', () => {
  const hint = buildMooniBoundFestivalSystemHint(FESTIVAL_CTX_790124, 'ko');
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
  const urlAt = system.indexOf('없는 URL을 지어내지');
  const hintAt = system.indexOf('목록에 없는');
  const priority = '힌트에 없는 시설은 단정하지 말고 공식 홈페이지·문의처를 안내한다.';
  const priorityAt = system.lastIndexOf(priority);
  assert.ok(urlAt >= 0, 'no-invented-url rule');
  assert.ok(hintAt > urlAt, 'festival hint follows the URL rule');
  assert.ok(system.includes('공식 홈페이지'), 'official site instruction kept');
  assert.ok(priorityAt > hintAt, 'festival priority is after the hint');
  assert.ok(system.trim().endsWith(priority), 'festival official-site instruction is last');
});

test('Edge renderMooniSystem — showPlannerHeader true 시 플래너 헤더 안내 포함', () => {
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
});
