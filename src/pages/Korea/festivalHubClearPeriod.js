import { defaultFestivalHubTimeTab } from './festivalHubDefaultTimeTab.js';

/** «기간 풀기» — restore the hub default window (flag-on 30-day / thisMonth), not «지금». */
export function festivalHubTimeTabAfterClearPeriod() {
  return defaultFestivalHubTimeTab();
}