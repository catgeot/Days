import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatGateoReviewerBadge, placeReviewVisitStoryDisplayTitle } from '../utils/placeReviewEditorial';
import { getCollapsedPreviewText } from '../utils/placeReviewContentBlocks.js';
import { stripReviewInlineMarkdown } from '../utils/reviewInlineMarkdown.js';
import { collectUniqueEditorialReviewImageCredits } from '../utils/editorialReviewImageCredit';
import { formatLogbookDisplayDate } from '../utils/logbookDisplayDate';
import { resolveLogbookReviewPlaceDisplayName } from './logbookReviewPlaceLabel.js';
import { pickEditorialReviewHubThumbPair } from './editorialReviewHubThumb.js';
import { LogbookOfficialReviewHubCardMedia } from './LogbookOfficialReviewHubCardMedia.jsx';

const DETAIL_SUMMARY_MAX = 140;

function editorialReviewDetailSummary(review) {
  const titled = placeReviewVisitStoryDisplayTitle(review, DETAIL_SUMMARY_MAX);
  if (titled) return titled;
  const raw = stripReviewInlineMarkdown(getCollapsedPreviewText(review))
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return '';
  return raw.length <= DETAIL_SUMMARY_MAX ? raw : `${raw.slice(0, DETAIL_SUMMARY_MAX).trim()}…`;
}

function HeroImageCredits({ images }) {
  const credits = collectUniqueEditorialReviewImageCredits(images);
  if (credits.length === 0) return null;

  return (
    <p
      className="mt-1.5 text-[10px] text-gray-400 leading-snug"
      data-testid="logbook-editorial-review-detail-hero-credit"
    >
      {credits.map((credit, index) => (
        <React.Fragment key={`${credit.type}-${index}`}>
          {index > 0 ? <span className="text-gray-300"> · </span> : null}
          {credit.type === 'plain' ? (
            credit.text
          ) : (
            <>
              Photo by{' '}
              {credit.photographerHref ? (
                <a
                  href={credit.photographerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-gray-300 underline-offset-2 hover:text-gray-600"
                >
                  {credit.photographerName}
                </a>
              ) : (
                credit.photographerName
              )}
              {' on '}
              <a
                href={credit.unsplashHref}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-gray-300 underline-offset-2 hover:text-gray-600"
              >
                Unsplash
              </a>
            </>
          )}
        </React.Fragment>
      ))}
    </p>
  );
}

export default function LogbookEditorialReviewDetailHero({ review, onImageClick }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'ko';
  const thumbPair = pickEditorialReviewHubThumbPair(review);
  const thumb = thumbPair?.thumb ?? null;
  const heroImage = thumbPair?.img;
  const cityLabel = resolveLogbookReviewPlaceDisplayName(review, lang);
  const badgeLabel = formatGateoReviewerBadge(review.persona_label);
  const dateLabel = formatLogbookDisplayDate(review.created_at, {
    locale: lang === 'en' ? 'en' : 'ko',
  });
  const summary = editorialReviewDetailSummary(review);
  const preparingLabel = t('logbook.officialReviewHub.imagePreparing');
  const photoAlt = t('logbook.officialReviewHub.photoAlt', {
    city: cityLabel,
    reviewer: badgeLabel,
  });

  const openHero = () => {
    if (!heroImage || !onImageClick) return;
    const images = review.images || [];
    const idx = images.indexOf(heroImage);
    onImageClick(images, idx >= 0 ? idx : 0);
  };

  const photoFrame = (
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
      <LogbookOfficialReviewHubCardMedia
        thumb={thumb}
        alt={photoAlt}
        cityLabel={cityLabel}
        personaLabel={review.persona_label}
        preparingLabel={preparingLabel}
        preferEager
        photoTestId="logbook-editorial-review-detail-hero-photo"
        fallbackTestId="logbook-editorial-review-detail-hero-fallback"
      />
    </div>
  );

  return (
    <div className="mb-4" data-testid="logbook-editorial-review-detail-hero">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        <div className="min-w-0 w-full md:max-w-[min(44%,320px)] md:shrink-0">
          {onImageClick && thumb?.src ? (
            <button type="button" className="block w-full text-left" onClick={openHero}>
              {photoFrame}
            </button>
          ) : (
            photoFrame
          )}
          {heroImage ? <HeroImageCredits images={[heroImage]} /> : null}
        </div>
        <div className="min-w-0 flex-1 md:pt-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
              {badgeLabel}
            </span>
            {dateLabel ? <span className="text-xs text-gray-400">{dateLabel}</span> : null}
          </div>
          {summary ? (
            <p className="mt-2 text-sm font-medium text-gray-800 leading-snug line-clamp-3 md:line-clamp-4 break-keep">
              {summary}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}