/** Hub «전체 기간»: no YMD slice on the loaded rolling-12-month catalog (same pool as search). */
export const FESTIVAL_HUB_FULL_PERIOD_TAB = 'fullPeriod';

export function isFestivalHubFullPeriodTab(timeTab) {
  return String(timeTab || '') === FESTIVAL_HUB_FULL_PERIOD_TAB;
}

/** «기간 풀기» — release period filter, not «지금» or the 30-day default. */
export function festivalHubTimeTabAfterClearPeriod() {
  return FESTIVAL_HUB_FULL_PERIOD_TAB;
}