import { isPlaceDescKoreanOnly } from '../../../pages/Home/lib/placeSeoText.js';

/** Desktop GalleryInfoView + mobile PlaceGalleryView — same EN notice gates */
export function resolveGalleryOverviewLocaleNotices({
  locale,
  location,
  showDescriptionInKoreanLabel = false,
}) {
  const koreanGuideEligible = locale === 'en' && isPlaceDescKoreanOnly(location);
  const showDescriptionChip = Boolean(showDescriptionInKoreanLabel);
  const showKoreanGuideNotice = koreanGuideEligible && !showDescriptionChip;
  return {
    showKoreanGuideNotice,
    showDescriptionInKoreanLabel: showDescriptionChip,
    showAnyLocaleNotice: showDescriptionChip || showKoreanGuideNotice,
  };
}

export function hasGalleryOverviewBody({ curationOverview, fixedOverview, overviewQuery }) {
  return Boolean(
    String(overviewQuery || '').trim() ||
      String(curationOverview || '').trim() ||
      String(fixedOverview || '').trim(),
  );
}

export function shouldShowMobileGalleryOverviewSection({
  curationOverview,
  fixedOverview,
  overviewQuery,
  localeNotices,
}) {
  return hasGalleryOverviewBody({ curationOverview, fixedOverview, overviewQuery }) || localeNotices.showAnyLocaleNotice;
}