import { useEffect, useMemo, useState } from 'react';
import { splitPlaceOverview } from '../common/placeOverviewText';
import { isGateoPlaceGalleryOverviewFallbackEnabled } from '../../../shared/gateoFeatureFlags.js';
import { needsPlaceChatIntroHydration } from '../../../pages/Home/lib/placeDescText.js';
import { hydratePlaceGalleryOverview } from '../../../pages/Home/lib/hydratePlaceGalleryOverview.js';
import { overviewTextIsKoreanOnly } from '../../../pages/Home/lib/placeSeoText.js';

function locationOverviewKey(location) {
  if (!location) return '';
  return [
    location.id,
    location.slug,
    location.name,
    location.desc,
    location.placeChatIntroApplied,
    location.curationSummary,
  ]
    .map((v) => String(v ?? ''))
    .join('|');
}

/**
 * splitPlaceOverview + 읽기 전용 hydrate (Tour · place_chat_intro 캐시).
 */
export function usePlaceGalleryOverviewHydration(location, locale) {
  const flagOn = isGateoPlaceGalleryOverviewFallbackEnabled();
  const base = useMemo(() => splitPlaceOverview(location, locale), [location, locale]);
  const [hydratedFixed, setHydratedFixed] = useState('');

  useEffect(() => {
    setHydratedFixed('');
  }, [locationOverviewKey(location), locale]);

  useEffect(() => {
    if (!flagOn) return undefined;
    if (!location || !needsPlaceChatIntroHydration(location)) return undefined;
    if (base.fixed || base.curation) return undefined;

    let cancelled = false;
    hydratePlaceGalleryOverview(location, { lng: locale })
      .then((summary) => {
        if (!cancelled && summary) setHydratedFixed(summary);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [flagOn, location, locale, base.fixed, base.curation]);

  const fixed = base.fixed || (flagOn ? hydratedFixed : '');

  return useMemo(
    () => ({
      curation: base.curation,
      fixed,
      originalQuery: base.originalQuery,
      showDescriptionInKoreanLabel:
        flagOn && locale === 'en' && overviewTextIsKoreanOnly(fixed),
    }),
    [base.curation, base.originalQuery, fixed, flagOn, locale],
  );
}
