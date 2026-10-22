import { useEffect, useState } from 'react';
import { msUntilNextSeoulMidnight, seoulTodayYmd } from './festivalDateFilter.js';

/**
 * Seoul calendar clock. The Date stays stable through the day and updates after midnight
 * (and when a backgrounded tab becomes visible on a new Seoul day).
 * @returns {Date}
 */
export function useSeoulCalendarNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer = 0;
    const refreshIfDayChanged = () => {
      const current = new Date();
      setNow((prev) => (seoulTodayYmd(prev) === seoulTodayYmd(current) ? prev : current));
    };
    const arm = () => {
      refreshIfDayChanged();
      timer = window.setTimeout(arm, msUntilNextSeoulMidnight(new Date()));
    };
    timer = window.setTimeout(arm, msUntilNextSeoulMidnight(new Date()));
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshIfDayChanged();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return now;
}
