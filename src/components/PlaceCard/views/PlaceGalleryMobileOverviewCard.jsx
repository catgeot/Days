import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import PlaceOverviewProse from '../common/PlaceOverviewProse';
import {
  hasGalleryOverviewBody,
  resolveGalleryOverviewLocaleNotices,
} from '../common/galleryOverviewLocaleNotices.js';
import PlaceGalleryLocaleNoticeChips from './PlaceGalleryLocaleNoticeChips';

/**
 * Gallery scroll overview (@media below lg). Desktop uses GalleryInfoOverviewScrollContent.
 */
export default function PlaceGalleryMobileOverviewCard({
  location,
  locale,
  overviewQuery,
  curationOverview,
  fixedOverview,
  showDescriptionInKoreanLabel = false,
}) {
  const { t } = useTranslation();
  const notices = resolveGalleryOverviewLocaleNotices({
    locale,
    location,
    showDescriptionInKoreanLabel,
  });
  const hasOverviewBody = hasGalleryOverviewBody({
    overviewQuery,
    curationOverview,
    fixedOverview,
  });
  const noticeOnly = notices.showAnyLocaleNotice && !hasOverviewBody;

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md shadow-inner space-y-3.5 ${
        noticeOnly ? 'px-4 py-3' : 'px-4 py-4'
      }`}
    >
      <PlaceGalleryLocaleNoticeChips
        showDescriptionInKoreanLabel={notices.showDescriptionInKoreanLabel}
        showKoreanGuideNotice={notices.showKoreanGuideNotice}
      />
      {(overviewQuery || curationOverview) && (
        <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-3">
          {overviewQuery && (
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-violet-200/95 tracking-wide">
              <Sparkles size={12} className="shrink-0 text-violet-300" aria-hidden />
              <span className="min-w-0 line-clamp-2 break-keep">
                {t('place.overview.fromQuery', { query: overviewQuery })}
              </span>
            </p>
          )}
          {curationOverview && <PlaceOverviewProse text={curationOverview} variant="curation" />}
        </div>
      )}
      {fixedOverview ? <PlaceOverviewProse text={fixedOverview} variant="mobile" /> : null}
    </div>
  );
}