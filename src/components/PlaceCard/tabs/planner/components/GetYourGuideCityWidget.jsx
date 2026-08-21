import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GYG_CURRENCY,
  GYG_PARTNER_ID,
  buildGygPlannerCmp,
  resolveGygLocale,
} from '../../../../../utils/affiliate';
import { getGygLocationIdByLocation } from '../locationRules';

const GetYourGuideCityWidget = ({ location }) => {
  const { i18n } = useTranslation();
  const gygLocale = resolveGygLocale(i18n.language);
  const locationId = useMemo(
    () => getGygLocationIdByLocation(location),
    [location?.slug, location?.name, location?.name_en, location?.curation_data?.locationEn]
  );
  const cmp = useMemo(() => buildGygPlannerCmp(location), [location?.slug]);
  const remountKey = `${locationId || 'gyg-city'}|${cmp}|${gygLocale}`;

  if (!locationId) return null;

  return (
    <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-orange-600">
        Sponsored · GetYourGuide
      </div>
      <div
        key={remountKey}
        data-gyg-href="https://widget.getyourguide.com/default/city.frame"
        data-gyg-location-id={locationId}
        data-gyg-locale-code={gygLocale}
        data-gyg-currency={GYG_CURRENCY}
        data-gyg-widget="city"
        data-gyg-partner-id={GYG_PARTNER_ID}
        data-gyg-cmp={cmp}
      />
    </div>
  );
};

export default GetYourGuideCityWidget;
