import React, { useCallback, useMemo, useState } from 'react';
import {
  GYG_ACTIVITIES_ITEM_COUNT,
  GYG_CURRENCY,
  GYG_LOCALE,
  GYG_PARTNER_ID,
  buildGygPlannerCmp,
} from '../../../../../utils/affiliate';
import { buildGygActivitiesSearchQuery } from '../locationRules';

/**
 * @param {'boxed'|'open'} [variant]
 * boxed — 플래너 map_poi: Sponsored 박스 유지 · 고정 높이 내부 스크롤
 * open — 스케치 좌측·써머리 모달: 박스 없이 패널 스크롤
 */
const GetYourGuideActivitiesWidget = ({
  location,
  query: queryProp,
  variant = 'boxed',
  className = '',
}) => {
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
  const remountKey = location?.slug || query || 'gyg-activities';
  const isBoxed = variant !== 'open';

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

  if (!query) return null;

  const chrome = (
    <div className={`mb-2 flex flex-wrap items-center justify-between gap-2 ${isBoxed ? '' : 'px-0.5'}`}>
      <div
        className={`text-[10px] font-bold uppercase tracking-wide ${
          isBoxed ? 'text-orange-600' : 'text-orange-300/90'
        }`}
      >
        Sponsored · GetYourGuide
      </div>
      <button
        type="button"
        onClick={copyQuery}
        title="위젯 검색어 복사 (투어 카드 본문은 제휴 iframe이라 선택이 안 됩니다)"
        className={`max-w-full truncate rounded-md border px-2 py-0.5 text-[10px] font-medium select-text ${
          isBoxed
            ? 'border-orange-200/80 bg-white/70 text-orange-800 hover:bg-white'
            : 'border-white/15 bg-white/10 text-orange-100/90 hover:bg-white/15'
        }`}
      >
        {copied ? '복사됨' : `검색어 · ${query}`}
      </button>
    </div>
  );

  const frame = (
    <div
      key={remountKey}
      data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
      data-gyg-widget="activities"
      data-gyg-partner-id={GYG_PARTNER_ID}
      data-gyg-locale-code={GYG_LOCALE}
      data-gyg-currency={GYG_CURRENCY}
      data-gyg-number-of-items={String(GYG_ACTIVITIES_ITEM_COUNT)}
      data-gyg-q={query}
      data-gyg-cmp={cmp}
    />
  );

  if (!isBoxed) {
    return (
      <div className={`mt-0 ${className}`.trim()}>
        {chrome}
        {frame}
      </div>
    );
  }

  return (
    <div className={`mt-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3 ${className}`.trim()}>
      {chrome}
      <div className="max-h-[240px] overflow-y-auto overscroll-contain pr-0.5 custom-scrollbar">
        {frame}
      </div>
    </div>
  );
};

export default GetYourGuideActivitiesWidget;
