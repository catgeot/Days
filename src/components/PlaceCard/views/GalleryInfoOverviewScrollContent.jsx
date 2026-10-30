import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import GalleryAttributionLink from '../common/GalleryAttributionLink';
import PlaceOverviewProse from '../common/PlaceOverviewProse';
import PlaceScenicGateway from '../common/PlaceScenicGateway';
import PlaceCrossLinksSection from '../common/PlaceCrossLinksSection';
import PlaceGalleryFactsAndStories from '../common/PlaceGalleryFactsAndStories';

export default function GalleryInfoOverviewScrollContent({
  selectedPlace,
  isPhotoMode,
  description,
  photoAttribution,
  selectedImg,
  showKoreanGuideNotice,
  showDescriptionInKoreanLabel = false,
  overviewQuery,
  curationOverview,
  fixedOverview,
  overviewKeywords,
  includeLeftLocalInfo,
}) {
  const { t } = useTranslation();

  if (isPhotoMode) {
    return (
      <div className="animate-fade-in space-y-4">
        <p className="text-[16px] text-gray-200 leading-relaxed font-normal opacity-90 tracking-tight">
          {description}
        </p>
        {photoAttribution && (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
            <p className="text-[13px] leading-relaxed text-gray-300">
              Photo by{' '}
              <GalleryAttributionLink
                href={photoAttribution.photographerHref || photoAttribution.href}
                location={selectedPlace}
                image={selectedImg}
                context="gallery"
                className="font-semibold text-blue-200/95 underline decoration-blue-300/40 underline-offset-2 transition-colors hover:text-blue-100 hover:decoration-blue-200/70"
                title={photoAttribution.title}
              >
                {photoAttribution.authorName}
              </GalleryAttributionLink>
              {' on '}
              <GalleryAttributionLink
                href={photoAttribution.providerHref}
                location={selectedPlace}
                image={selectedImg}
                context="gallery"
                className="font-semibold text-blue-200/95 underline decoration-blue-300/40 underline-offset-2 transition-colors hover:text-blue-100 hover:decoration-blue-200/70"
              >
                {photoAttribution.providerName}
              </GalleryAttributionLink>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="space-y-4">
        {showDescriptionInKoreanLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300">
            {t('place.localeNotice.descriptionInKorean')}
          </span>
        ) : showKoreanGuideNotice ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300">
            ℹ️ {t('place.localeNotice.koreanGuide')}
          </span>
        ) : null}
        {(overviewQuery || curationOverview) && (
          <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3.5 py-3.5">
            {overviewQuery && (
              <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-violet-200/90 tracking-wide">
                <Sparkles size={12} className="shrink-0 text-violet-300" aria-hidden />
                <span className="min-w-0 line-clamp-2 break-keep">
                  {t('place.overview.fromQuery', { query: overviewQuery })}
                </span>
              </p>
            )}
            {curationOverview && (
              <PlaceOverviewProse text={curationOverview} variant="curation" />
            )}
          </div>
        )}
        {(fixedOverview || !curationOverview) && (
          <PlaceOverviewProse
            text={fixedOverview}
            variant="body"
            fallback={t('place.fallback.infoUpdating')}
          />
        )}
      </div>

      <PlaceScenicGateway location={selectedPlace} variant="dark" />

      <PlaceCrossLinksSection
        location={selectedPlace}
        variant="dark"
        bucketFilter="festivalsCollections"
      />

      {overviewKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
          {overviewKeywords.map((tag, idx) => (
            <span
              key={`tag-${idx}`}
              className="px-2 py-0.5 rounded border transition-all duration-300 cursor-default font-medium text-[11px] bg-white/5 border-white/10 text-gray-400 hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-400/5"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {includeLeftLocalInfo ? (
        <PlaceGalleryFactsAndStories
          location={selectedPlace}
          wrapperClassName="border-t border-white/5 pt-2 mt-2 space-y-2"
          sectionClassName="!mb-0 scroll-mt-2"
          storiesLoadingShellInLeftOverview
        />
      ) : null}
    </div>
  );
}
