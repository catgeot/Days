import {
  isPlaceDescKoreanOnly,
  overviewTextIsKoreanOnly,
} from '../../../pages/Home/lib/placeSeoText.js';

export function galleryDisplaysEnglishOverview({
  locale,
  curationOverview = '',
  fixedOverview = '',
}) {
  if (locale !== 'en') return false;
  for (const raw of [curationOverview, fixedOverview]) {
    const text = String(raw || '').trim();
    if (text && !overviewTextIsKoreanOnly(text)) return true;
  }
  return false;
}

/** Desktop GalleryInfoView + mobile PlaceGalleryView — same EN notice gates */
export function resolveGalleryOverviewLocaleNotices({
  locale,
  location,
  showDescriptionInKoreanLabel = false,
  curationOverview = '',
  fixedOverview = '',
}) {
  const koreanGuideEligible = locale === 'en' && isPlaceDescKoreanOnly(location);
  const showDescriptionChip = Boolean(showDescriptionInKoreanLabel);
  const hasEnglishOverviewBody = galleryDisplaysEnglishOverview({
    locale,
    curationOverview,
    fixedOverview,
  });
  const showKoreanGuideNotice = koreanGuideEligible
    && !showDescriptionChip
    && !hasEnglishOverviewBody;
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