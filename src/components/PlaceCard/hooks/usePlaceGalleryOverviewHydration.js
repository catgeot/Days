import { useEffect, useMemo, useState } from 'react';
import { splitPlaceOverview } from '../common/placeOverviewText';
import { isGateoPlaceGalleryOverviewFallbackEnabled } from '../../../shared/gateoFeatureFlags.js';
import { needsPlaceChatIntroHydration } from '../../../pages/Home/lib/placeDescText.js';
import { hydratePlaceGalleryOverview } from '../../../pages/Home/lib/hydratePlaceGalleryOverview.js';

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
 * splitPlaceOverview + 클라이언트 hydrate (TourAPI · place_chat_intro).
 */
export function usePlaceGalleryOverviewHydration(location, locale) {
  const base = useMemo(() => splitPlaceOverview(location, locale), [location, locale]);
  const [hydratedFixed, setHydratedFixed] = useState('');

  useEffect(() => {
    setHydratedFixed('');
  }, [locationOverviewKey(location), locale]);

  useEffect(() => {
    if (!isGateoPlaceGalleryOverviewFallbackEnabled()) return undefined;
    if (!location || !needsPlaceChatIntroHydration(location)) return undefined;
    if (base.fixed || base.curation) return undefined;

    let cancelled = false;
    hydratePlaceGalleryOverview(location, { lng: locale, generateIfMissing: true })
      .then((summary) => {
        if (!cancelled && summary) setHydratedFixed(summary);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [location, locale, base.fixed, base.curation]);

  return useMemo(
    () => ({
      curation: base.curation,
      fixed: base.fixed || hydratedFixed,
      originalQuery: base.originalQuery,
    }),
    [base.curation, base.fixed, base.originalQuery, hydratedFixed],
  );
}
