import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GYG_ACTIVITIES_INITIAL_DESKTOP,
  GYG_ACTIVITIES_INITIAL_MOBILE,
  GYG_ACTIVITIES_MAX_DESKTOP,
  GYG_ACTIVITIES_MAX_MOBILE,
  GYG_ACTIVITIES_STEP_DESKTOP,
  GYG_ACTIVITIES_STEP_MOBILE,
  GYG_CURRENCY,
  GYG_LOCALE,
  GYG_PARTNER_ID,
  buildGygPlannerCmp,
} from '../../../../../utils/affiliate';
import { buildGygActivitiesSearchQuery } from '../locationRules';

const LG_MQ = '(min-width: 1024px)';

function useIsLg() {
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(LG_MQ).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(LG_MQ);
    const sync = () => setIsLg(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return isLg;
}

const GetYourGuideActivitiesWidget = ({ location, query: queryProp, className = '' }) => {
  const isLg = useIsLg();
  const [copied, setCopied] = useState(false);
  const query = useMemo(
    () => (queryProp != null ? queryProp : buildGygActivitiesSearchQuery(location)),
    [
      queryProp,
      location?.slug,
      location?.name,
      location?.name_en,
      location?.curation_data?.locationEn,
    ]
  );
  const cmp = useMemo(() => buildGygPlannerCmp(location), [location?.slug]);
  const placeKey = location?.slug || query || 'gyg-activities';

  const initial = isLg ? GYG_ACTIVITIES_INITIAL_DESKTOP : GYG_ACTIVITIES_INITIAL_MOBILE;
  const step = isLg ? GYG_ACTIVITIES_STEP_DESKTOP : GYG_ACTIVITIES_STEP_MOBILE;
  const max = isLg ? GYG_ACTIVITIES_MAX_DESKTOP : GYG_ACTIVITIES_MAX_MOBILE;
  const [visibleCount, setVisibleCount] = useState(initial);

  useEffect(() => {
    setVisibleCount(initial);
  }, [initial, placeKey]);

  const copyQuery = useCallback(async () => {
    if (!query) return;
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.warn('[GetYourGuideActivitiesWidget] 검색어 복사 실패', err);
    }
  }, [query]);

  const canLoadMore = visibleCount < max;
  const nextStep = Math.min(step, max - visibleCount);

  if (!query) return null;

  return (
    <div className={`mt-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3 ${className}`.trim()}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-orange-600">
          Sponsored · GetYourGuide
        </div>
        <button
          type="button"
          onClick={copyQuery}
          title="위젯 검색어 복사 (투어 카드 본문은 제휴 iframe이라 선택이 안 됩니다)"
          className="max-w-full truncate rounded-md border border-orange-200/80 bg-white/70 px-2 py-0.5 text-[10px] font-medium text-orange-800 select-text hover:bg-white"
        >
          {copied ? '복사됨' : `검색어 · ${query}`}
        </button>
      </div>
      <div
        key={`${placeKey}-${visibleCount}`}
        data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
        data-gyg-widget="activities"
        data-gyg-partner-id={GYG_PARTNER_ID}
        data-gyg-locale-code={GYG_LOCALE}
        data-gyg-currency={GYG_CURRENCY}
        data-gyg-number-of-items={String(visibleCount)}
        data-gyg-q={query}
        data-gyg-cmp={cmp}
      />
      {canLoadMore ? (
        <button
          type="button"
          onClick={() => setVisibleCount((prev) => Math.min(prev + step, max))}
          className="mt-2 w-full rounded-lg border border-orange-200/90 bg-white/80 px-3 py-2 text-xs font-bold text-orange-800 transition-colors hover:bg-white"
        >
          {nextStep}개 더보기
        </button>
      ) : null}
    </div>
  );
};

export default GetYourGuideActivitiesWidget;
