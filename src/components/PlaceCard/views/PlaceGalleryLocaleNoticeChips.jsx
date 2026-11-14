import React from 'react';
import { useTranslation } from 'react-i18next';

export default function PlaceGalleryLocaleNoticeChips({
  showDescriptionInKoreanLabel = false,
  showKoreanGuideNotice = false,
}) {
  const { t } = useTranslation();

  if (showDescriptionInKoreanLabel) {
    const label = t('place.localeNotice.descriptionInKorean');
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300"
        aria-label={label}
      >
        {label}
      </span>
    );
  }

  if (showKoreanGuideNotice) {
    const label = t('place.localeNotice.koreanGuide');
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300"
        aria-label={label}
      >
        ℹ️ {label}
      </span>
    );
  }

  return null;
}