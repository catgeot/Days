import { useEffect, useMemo, useState } from 'react';
import {
  resolveGalleryOverviewFixed,
  shouldFetchGalleryOverviewHydration,
  splitPlaceOverview,
} from '../common/placeOverviewText';
import { isGateoPlaceGalleryOverviewFallbackEnabled } from '../../../shared/gateoFeatureFlags.js';
import {
  hydratePlaceGalleryOverview,
  onPlaceChatIntroSaved,
} from '../../../pages/Home/lib/hydratePlaceGalleryOverview.js';
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
  const [introSavedTick, setIntroSavedTick] = useState(0);

  useEffect(() => {
    setHydratedFixed('');
  }, [locationOverviewKey(location), locale]);

  useEffect(() => {
    if (!flagOn || !location) return undefined;
    return onPlaceChatIntroSaved((savedLoc) => {
      const left = [
        String(location?.slug || '').trim().toLowerCase(),
        String(location?.name || '').trim(),
        String(location?.id || '').trim(),
      ].join('|');
      const right = [
        String(savedLoc?.slug || '').trim().toLowerCase(),
        String(savedLoc?.name || '').trim(),
        String(savedLoc?.id || '').trim(),
      ].join('|');
      if (left === right) setIntroSavedTick((n) => n + 1);
    });
  }, [flagOn, location]);

  useEffect(() => {
    if (!flagOn) return undefined;
    if (
      !shouldFetchGalleryOverviewHydration({
        locale,
        baseFixed: base.fixed,
        curation: base.curation,
        location,
        flagOn,
      })
    ) {
      return undefined;
    }

    let cancelled = false;
    hydratePlaceGalleryOverview(location, { lng: locale })
      .then((summary) => {
        if (!cancelled && summary) setHydratedFixed(summary);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [flagOn, location, locale, base.fixed, base.curation, introSavedTick]);

  const fixed = resolveGalleryOverviewFixed({
    baseFixed: base.fixed,
    hydratedFixed,
    locale,
    flagOn,
  });

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
