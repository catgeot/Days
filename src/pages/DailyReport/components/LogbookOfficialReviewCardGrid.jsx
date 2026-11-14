import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatLogbookDisplayDate } from '../../../utils/logbookDisplayDate';
import {
  formatGateoReviewerBadge,
  placeReviewVisitStoryDisplayTitle,
} from '../../../utils/placeReviewEditorial';
import { getCollapsedPreviewText } from '../../../utils/placeReviewContentBlocks.js';
import { stripReviewInlineMarkdown } from '../../../utils/reviewInlineMarkdown.js';
import { buildPlaceReviewsHref } from '../../../utils/placeReviewFocus.js';
import { resolveLogbookReviewPlaceDisplayName } from '../../../logbookOfficialReviews/logbookReviewPlaceLabel.js';
import { pickEditorialReviewHubThumb } from '../../../logbookOfficialReviews/editorialReviewHubThumb.js';
import { LogbookOfficialReviewHubCardMedia } from '../../../logbookOfficialReviews/LogbookOfficialReviewHubCardMedia.jsx';

const CARD_LINE_MAX = 96;

function editorialReviewCardLine(review) {
  const titled = placeReviewVisitStoryDisplayTitle(review, CARD_LINE_MAX);
  if (titled) return titled;
  const raw = stripReviewInlineMarkdown(getCollapsedPreviewText(review))
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return '';
  return raw.length <= CARD_LINE_MAX ? raw : `${raw.slice(0, CARD_LINE_MAX).trim()}…`;
}

export default function LogbookOfficialReviewCardGrid({
  reviews,
  hubLinkState,
  onHubReviewNavigate,
}) {
  const { t, i18n } = useTranslation();
  const preparingLabel = t('logbook.officialReviewHub.imagePreparing');
  const lang = i18n.language?.startsWith('en') ? 'en' : 'ko';

  return (
    <ul
      className="grid grid-cols-2 gap-3 xl:grid-cols-3 xl:gap-4"
      data-testid="logbook-official-review-hub-card-grid"
    >
      {reviews.map((review, index) => {
        const slug = String(review.place_slug || '').trim();
        const placePath = slug ? `/place/${slug}` : '';
        const href = placePath ? buildPlaceReviewsHref(placePath, review.id) : '#';
        const thumb = pickEditorialReviewHubThumb(review);
        const thumbSrc = thumb?.src ?? null;
        const line = editorialReviewCardLine(review);
        const cityLabel = resolveLogbookReviewPlaceDisplayName(review, lang);
        const dateLabel = formatLogbookDisplayDate(review.created_at, {
          locale: lang === 'en' ? 'en' : 'ko',
        });
        const badgeLabel = formatGateoReviewerBadge(review.persona_label);
        const photoAlt = t('logbook.officialReviewHub.photoAlt', {
          city: cityLabel,
          reviewer: badgeLabel,
        });

        return (
          <li key={review.id} className="min-w-0">
            <Link
              to={href}
              state={hubLinkState}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                onHubReviewNavigate?.();
              }}
              onClick={() => onHubReviewNavigate?.()}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-colors hover:border-indigo-100 hover:bg-gray-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              data-testid="logbook-official-review-hub-item"
              data-hub-place-slug={slug || undefined}
              data-review-id={review.id}
              data-hub-has-thumb={thumbSrc ? 'true' : 'false'}
              data-hub-thumb-src={thumbSrc || undefined}
              data-hub-persona-badge={badgeLabel}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <LogbookOfficialReviewHubCardMedia
                  thumb={thumb}
                  alt={photoAlt}
                  cityLabel={cityLabel}
                  personaLabel={review.persona_label}
                  preparingLabel={preparingLabel}
                  preferEager={index < 3}
                />
                <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                  {badgeLabel}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 px-2.5 py-2.5">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  {cityLabel ? (
                    <span className="text-xs font-semibold text-gray-800">{cityLabel}</span>
                  ) : null}
                  {dateLabel ? (
                    <span className="text-[11px] text-gray-400">{dateLabel}</span>
                  ) : null}
                </div>
                {line ? (
                  <p
                    className="min-w-0 text-sm font-medium leading-snug text-gray-800 line-clamp-1 break-keep"
                    data-testid="logbook-official-review-hub-card-title"
                  >
                    {line}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}