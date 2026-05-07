import React, { useMemo } from 'react';

const GYG_PARTNER_ID = 'LRKVVU4';
const GYG_LOCALE = 'ko-KR';

// 위젯 적용 + location-id 매핑을 한 곳에서 관리.
const GYG_CITY_CONFIGS = [
  { locationId: '2008', keys: ['mount-everest', '에베레스트', 'everest'] },
  { locationId: '168995', keys: ['costa-rica', '코스타리카', 'costa rica'] },
  { locationId: '204933', keys: ['galapagos', 'galápagos', '갈라파고스'] },
  { locationId: '2794', keys: ['patagonia', '파타고니아'] },
  { locationId: '2859', keys: ['arequipa', '아레키파'] },
];

const GetYourGuideCityWidget = ({ location }) => {
  const locationId = useMemo(() => {
    const slug = (location?.slug || '').toLowerCase();
    const nameKo = (location?.name || '').toLowerCase();
    const nameEn = (location?.name_en || location?.curation_data?.locationEn || '').toLowerCase();

    const matchedConfig = GYG_CITY_CONFIGS.find((config) =>
      config.keys.some((key) =>
        slug.includes(key) || nameKo.includes(key) || nameEn.includes(key)
      )
    );

    return matchedConfig?.locationId || null;
  }, [location?.slug, location?.name, location?.name_en, location?.curation_data?.locationEn]);

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
