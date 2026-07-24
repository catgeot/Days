import React, { useMemo } from 'react';
import {
  GYG_ACTIVITIES_ITEM_COUNT,
  GYG_LOCALE,
  GYG_PARTNER_ID,
  buildGygPlannerCmp,
} from '../../../../../utils/affiliate';
import { buildGygActivitiesSearchQuery } from '../locationRules';

const GetYourGuideActivitiesWidget = ({ location, query: queryProp }) => {
  const query = useMemo(
    () => (queryProp != null ? queryProp : buildGygActivitiesSearchQuery(location)),
    [
      queryProp,
      location?.slug,
      location?.name,
      location?.name_en,
      location?.country,
      location?.country_en,
      location?.curation_data?.locationEn,
      location?.curation_data?.country_en,
    ]
  );
  const cmp = useMemo(() => buildGygPlannerCmp(location), [location?.slug]);
  const remountKey = location?.slug || query || 'gyg-activities';

  if (!query) return null;

  return (
    <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-orange-600">
        Sponsored · GetYourGuide
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
