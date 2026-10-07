import assert from 'node:assert/strict';
import { test } from 'node:test';
import { KO } from '../../src/i18n/mooniPromptBundleData.js';
import {
  buildMooniBoundFestivalSystemHint,
  resolveMooniChatKoreaFestivalHint,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import {
  applyMooniDestinationRulesPlannerVisibility,
  countMooniPlannerHeaderGuidance,
  mooniChatShowsPlannerHeaderButton,
  shouldIncludeMooniCtaPlannerHeaderLine,
} from '../../src/shared/mooni/mooniChatPlannerHeaderPrompt.js';

const FESTIVAL_CTX_790124 = {
  contentId: '790124',
  title: '홍천 인삼한우 명품축제',
  eventStartDate: '20261008',
  eventEndDate: '20261011',
  homepage: 'https://example.org/festival',
};

/** getChatCtaPromptHint none_quiet 분기와 동일 조립 (Node에서 i18n 체인 없이 검증) */
function buildClientQuietCtaHint(showPlannerHeader) {
  const cta = KO.cta;
  const lines = ['', cta.header, cta.noTicketSearch, cta.noBookingShow];
  if (shouldIncludeMooniCtaPlannerHeaderLine('plannerHeaderOnly', showPlannerHeader)) {
    lines.push(cta.plannerHeaderOnly);
  }
  lines.push(cta.noPhantomButtons);
  return lines.join('\n');
}

function buildClientMooniPromptSlice({ showPlannerHeader, koreaFestivalHint = '' }) {
  const rules = applyMooniDestinationRulesPlannerVisibility(
    KO.mooniDestinationRules,
    showPlannerHeader,
  );
  const ctaHint = buildClientQuietCtaHint(showPlannerHeader);
  return `${rules}\n${koreaFestivalHint}\n${ctaHint}`;
}

test('mooniChatShowsPlannerHeaderButton — catalog slug와 ChatModal 헤더 동일', () => {
  assert.equal(mooniChatShowsPlannerHeaderButton(null), false);
  assert.equal(mooniChatShowsPlannerHeaderButton(''), false);
  assert.equal(mooniChatShowsPlannerHeaderButton('ishigaki'), true);
});

test('festival 세션(showPlannerHeader false) — 클라이언트 조립 프롬프트에 플래너 헤더 안내 0건', async () => {
  const { hint } = await resolveMooniChatKoreaFestivalHint({
    userText: '주차는?',
    festivalContext: FESTIVAL_CTX_790124,
    locale: 'ko',
  });
  const assembled = buildClientMooniPromptSlice({
    showPlannerHeader: false,
    koreaFestivalHint: hint,
  });
  assert.equal(countMooniPlannerHeaderGuidance(assembled), 0);
});

test('place-linked 세션(showPlannerHeader true) — 클라이언트 CTA에 플래너 헤더 안내 포함', () => {
  const assembled = buildClientMooniPromptSlice({ showPlannerHeader: true });
  assert.ok(countMooniPlannerHeaderGuidance(assembled) > 0);
  assert.ok(assembled.includes(KO.cta.plannerHeaderOnly));
});

test('buildMooniBoundFestivalSystemHint — 목록 밖 시설 단정 금지 지시', () => {
  const hint = buildMooniBoundFestivalSystemHint(FESTIVAL_CTX_790124, 'ko');
  assert.ok(
    hint.includes('목록에 없는') && hint.includes('단정하지'),
    'no-unlisted-facility-assertion instruction',
  );
  assert.ok(hint.includes('공식 홈페이지') || hint.includes('문의처'));
});
