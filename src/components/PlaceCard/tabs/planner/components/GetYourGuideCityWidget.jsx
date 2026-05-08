import React, { useMemo } from 'react';
import { getGygLocationIdByLocation } from '../locationRules';

const GYG_PARTNER_ID = 'LRKVVU4';
const GYG_LOCALE = 'ko-KR';

const GetYourGuideCityWidget = ({ location }) => {
  const locationId = useMemo(
    () => getGygLocationIdByLocation(location),
    [location?.slug, location?.name, location?.name_en, location?.curation_data?.locationEn]
  );

  if (!locationId) return null;

  return (
    <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-orange-600">
        Sponsored · GetYourGuide
      </div>
      <div
        data-gyg-href="https://widget.getyourguide.com/default/city.frame"
        data-gyg-location-id={locationId}
        data-gyg-locale-code={GYG_LOCALE}
        data-gyg-widget="city"
        data-gyg-partner-id={GYG_PARTNER_ID}
      />
    </div>
  );
};

export default GetYourGuideCityWidget;
