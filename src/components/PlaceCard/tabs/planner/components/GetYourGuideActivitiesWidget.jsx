import React, { useCallback, useMemo, useState } from 'react';
import {
  GYG_ACTIVITIES_ITEM_COUNT,
  GYG_LOCALE,
  GYG_PARTNER_ID,
  buildGygPlannerCmp,
} from '../../../../../utils/affiliate';
import { buildGygActivitiesSearchQuery } from '../locationRules';

const GetYourGuideActivitiesWidget = ({ location, query: queryProp }) => {
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

  return (
    <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3">
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
        key={remountKey}
        data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
        data-gyg-widget="activities"
        data-gyg-partner-id={GYG_PARTNER_ID}
        data-gyg-locale-code={GYG_LOCALE}
        data-gyg-number-of-items={GYG_ACTIVITIES_ITEM_COUNT}
        data-gyg-q={query}
        data-gyg-cmp={cmp}
      />
    </div>
  );
};

export default GetYourGuideActivitiesWidget;
