/**
 * 요약 카드가 렌더될 때만 본문 무니 버튼이 DOM에 붙는다. mooni만으로 카드가 열리는 경우도 포함.
 * @param {{
 *   dateText?: string,
 *   timeText?: string,
 *   feeText?: string | null,
 *   placeText?: string,
 *   hasBooking?: boolean,
 *   showOfficialHomepage?: boolean,
 *   mooniEnabled?: boolean,
 * }} fields
 */
export function festivalDetailSummaryWillRender(fields = {}) {
  const mooniEnabled = Boolean(fields.mooniEnabled);
  const showOfficial = Boolean(fields.showOfficialHomepage);
  return Boolean(
    fields.dateText ||
      fields.timeText ||
      fields.feeText ||
      fields.placeText ||
      fields.hasBooking ||
      showOfficial ||
      mooniEnabled,
  );
}

/**
 * @param {{
 *   enabled?: boolean,
 *   inlineAnchorExpected?: boolean,
 *   inlineMounted?: boolean,
 *   inlineVisible?: boolean,
 * }} state
 */
export function shouldShowFestivalMooniFab(state = {}) {
  const enabled = Boolean(state.enabled);
  if (!enabled) return false;

  const inlineAnchorExpected = Boolean(state.inlineAnchorExpected);
  if (!inlineAnchorExpected) return true;

  const inlineMounted = Boolean(state.inlineMounted);
  if (!inlineMounted) return false;

  return !Boolean(state.inlineVisible);
}
