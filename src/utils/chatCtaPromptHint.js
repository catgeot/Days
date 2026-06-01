import { resolveChatBookingActions } from './chatBookingResolver.js';
import {
  resolvePlannerFocusFromUserText,
  PLANNER_FOCUS_ID,
} from './placePlannerFocus.js';

const TRANSPORT_PROVIDERS = new Set([
  'trip_com',
  'twelve_go',
  'direct',
  'direct_ferries',
  'klook_ferry',
]);

const PREP_PROVIDERS = new Set(['klook', 'official', 'pre_travel']);

/**
 * Gemini system prompt — 이번 턴에 실제로 렌더되는 CTA만 언급하도록 제한.
 *
 * @param {{
 *   userText: string,
 *   slug?: string | null,
 *   destinationName?: string,
 *   chatHistory?: Array<{ role?: string, text?: string }>,
 *   essentialGuide?: object | null,
 * }} params
 */
export function getChatCtaPromptHint({
  userText,
  slug = null,
  destinationName = '',
  chatHistory = [],
  essentialGuide = null,
}) {
  const booking = resolveChatBookingActions({
    userText,
    destinationName,
    slug,
    chatHistory,
    essentialGuide,
    aiReplyText: '',
  });

  const lines = [
    '',
    '[이번 답변 아래 UI — 실제로 보이는 것만 안내]',
    '- 「예약 · 티켓 검색」이라는 이름의 버튼·섹션은 없다. 절대 쓰지 않는다.',
  ];

  if (!booking.show) {
    if (/현지\s*교통|렌터카|픽업|공항\s*픽/.test(userText)) {
      const place = String(destinationName ?? '').trim() || '여행지';
      lines.push(
        `- 「플래너에서 ${place} 공항→목적지 이동 보기」(cyan) · 「플래너에서 ${place} 교통·패스 안내 보기」(회색) — 각각 해당 플래너 카드로 스크롤`,
        '- 전체 플래너: 헤더 「📋 플래너 보기」'
      );
    } else {
      lines.push(
        '- 예약·준비 링크 버튼 섹션이 없을 수 있다.',
        '- 채팅 헤더 「📋 플래너 보기」만 안내한다.',
        '- 존재하지 않는 버튼을 언급하지 않는다.'
      );
    }
    return lines.join('\n');
  }

  const hasTransport = booking.actions.some((a) =>
    TRANSPORT_PROVIDERS.has(a.provider)
  );
  const hasPrep = booking.actions.some((a) => PREP_PROVIDERS.has(a.provider));

  if (hasPrep) {
    lines.push('- 「출발 전 준비」(amber 박스) 안의 버튼 — 비자·공식·입국 준비 링크');
  }
  if (hasTransport) {
    lines.push(
      '- 「교통 · 티켓」 섹션 — 항공·페리 등 예약 버튼(항공은 **검색 위젯**으로 열림, Trip.com 직접 이동 아님)'
    );
    if (booking.actions.some((a) => a.provider === 'trip_com')) {
      const place = String(destinationName ?? '').trim() || '여행지';
      lines.push(
        `- 항공 버튼 아래 「플래너에서 ${place} 항공권 안내 보기」(cyan) — 플래너 「항공권」 카드(경로·팁 요약)로 스크롤`
      );
    }
  }
  if (!hasTransport) {
    lines.push('- 이번 턴에는 「교통 · 티켓」 섹션이 없다. 항공권 예약 버튼을 언급하지 않는다.');
  }
  if (hasPrep && !hasTransport) {
    const focus = resolvePlannerFocusFromUserText(userText, { essentialGuide });
    if (focus === PLANNER_FOCUS_ID.ARRIVAL_TRANSFER || focus === PLANNER_FOCUS_ID.LOCAL_TRANSPORT || focus === PLANNER_FOCUS_ID.RENTAL_PICKUP) {
      const place = String(destinationName ?? '').trim() || '여행지';
      lines.push(
        `- 「플래너에서 ${place} 공항→목적지 이동 보기」(cyan) · 「플래너에서 ${place} 교통·패스 안내 보기」(회색) — 각각 해당 플래너 카드로 스크롤`
      );
    } else {
      const plannerScrollTarget =
        focus === PLANNER_FOCUS_ID.PRE_TRAVEL_CHECKLIST
          ? '플래너 상단 「출발 전 필수 준비사항」 체크리스트(항공·숙소·픽업)'
          : focus === PLANNER_FOCUS_ID.PREP_ACCOMMODATION
            ? '플래너 「숙박 지역 추천」 카드'
            : focus === PLANNER_FOCUS_ID.PREP_FLIGHT
              ? '플래너 「항공권」 카드'
              : focus === PLANNER_FOCUS_ID.PREP_SAFETY
                ? '플래너 「안전 및 보험」 카드'
                : '플래너 「비자 및 서류」·「출발 전 필수 준비」 섹션';
      lines.push(
        `- 「플래너에서 입국·증빙·준비 확인」 버튼(전폭, cyan) — ${plannerScrollTarget}로 스크롤`
      );
    }
  }
  lines.push(
    '- 전체 일정·항공·숙소 예약: 헤더 「📋 플래너 보기」',
    '- 「GATEO 플래너」는 위 플래너 버튼·헤더를 가리킨다. 본문에 가짜 [버튼] 문구를 쓰지 않는다.'
  );
  if (hasTransport || (hasPrep && hasTransport)) {
    lines.push('- 추가 옵션: 「플래너에서 더 많은 예약 옵션 보기」(답변 맨 아래 작은 링크)');
  }

  return lines.join('\n');
}
