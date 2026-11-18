import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatGateoReviewerBadge } from '../utils/placeReviewEditorial';
import { collectUniqueEditorialReviewImageCredits } from '../utils/editorialReviewImageCredit';
import { EditorialStockPhotoCreditLine } from '../components/PlaceCard/common/StockPhotoCreditLine';
import { formatLogbookDisplayDate } from '../utils/logbookDisplayDate';
import { resolveLogbookReviewPlaceDisplayName } from './logbookReviewPlaceLabel.js';
import { pickEditorialReviewHubThumbPair } from './editorialReviewHubThumb.js';
import { LogbookOfficialReviewHubCardMedia } from './LogbookOfficialReviewHubCardMedia.jsx';

function HeroImageCredits({ images }) {
  const credits = collectUniqueEditorialReviewImageCredits(images);
  if (credits.length === 0) return null;

  return (
    <p
      className="mt-1.5 text-[10px] text-gray-400 leading-snug"
      data-testid="logbook-editorial-review-detail-hero-credit"
      translate="no"
    >
      {credits.map((credit, index) => (
        <React.Fragment key={`${credit.type}-${index}`}>
          {index > 0 ? <span className="text-gray-300"> · </span> : null}
          {credit.type === 'plain' ? (
            credit.text
          ) : (
            <EditorialStockPhotoCreditLine credit={credit} allowAuthorWrap />
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
      <div className="w-full md:max-w-[min(44%,320px)]">
        {onImageClick && thumb?.src ? (
          <button type="button" className="block w-full text-left" onClick={openHero}>
            {photoFrame}
          </button>
        ) : (
          photoFrame
        )}
        {heroImage ? <HeroImageCredits images={[heroImage]} /> : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
            {badgeLabel}
          </span>
          {dateLabel ? <span className="text-xs text-gray-400">{dateLabel}</span> : null}
        </div>
      </div>
    </div>
  );
}