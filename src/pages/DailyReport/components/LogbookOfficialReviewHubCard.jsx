import React, { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Sparkles } from 'lucide-react';
import { LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE } from '../../../logbookOfficialReviews/constants.js';
import { useLogbookOfficialReviewHub } from '../../../logbookOfficialReviews/useLogbookOfficialReviewHub.js';
import { formatLogbookDisplayDate } from '../../../utils/logbookDisplayDate';
import {
  formatGateoReviewerBadge,
  placeReviewVisitStoryDisplayTitle,
} from '../../../utils/placeReviewEditorial';
import {
  getCollapsedPreviewText,
  resolveReviewThumbnailSrc,
} from '../../../utils/placeReviewContentBlocks.js';
import { stripReviewInlineMarkdown } from '../../../utils/reviewInlineMarkdown.js';

const PAGE_SIZE = 10;
const LIST_PREVIEW_MAX = 120;

function editorialReviewListPreview(review) {
  const titled = placeReviewVisitStoryDisplayTitle(review, LIST_PREVIEW_MAX);
  if (titled) return titled;
  const raw = getCollapsedPreviewText(review);
  const plain = stripReviewInlineMarkdown(raw).replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  if (plain.length <= LIST_PREVIEW_MAX) return plain;
  return `${plain.slice(0, LIST_PREVIEW_MAX).trim()}…`;
}

function editorialReviewThumbSrc(review) {
  const images = review?.images;
  if (!Array.isArray(images) || !images.length) return null;
  return resolveReviewThumbnailSrc(images[0], { width: 160, height: 160 });
}

const LogbookOfficialReviewHubCard = () => {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { enabled, rows, isLoading, loadFailed, totalCount } = useLogbookOfficialReviewHub();

  const visibleRows = useMemo(() => rows.slice(0, visibleCount), [rows, visibleCount]);

  if (!enabled || loadFailed || (!isLoading && totalCount === 0)) {
    return null;
  }

  if (isLoading && totalCount === 0) {
    return null;
  }

  const hasMore = visibleCount < totalCount;

  return (
    <section
      className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
      aria-label={LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE}
      data-testid="logbook-official-review-hub"
    >
      <button
        type="button"
        className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 rounded-2xl"
        aria-expanded={expanded}
        aria-controls={panelId}
        data-testid="logbook-official-review-hub-toggle"
        onClick={() => setExpanded((open) => !open)}
      >
        <Sparkles size={18} className="shrink-0 text-indigo-500" aria-hidden />
        <span className="min-w-0 flex-1 text-sm font-bold text-gray-900">{LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE}</span>
        <span className="shrink-0 text-xs font-semibold text-gray-400">
          {totalCount}편
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div id={panelId} className="border-t border-gray-100 px-3 pb-4 pt-2 sm:px-4" data-testid="logbook-official-review-hub-panel">
          <ul className="divide-y divide-gray-100">
            {visibleRows.map((review) => {
              const slug = String(review.place_slug || '').trim();
              const href = slug ? `/place/${slug}/reviews` : '#';
              const thumb = editorialReviewThumbSrc(review);
              const preview = editorialReviewListPreview(review);
              const placeName = String(review.place_name || '').trim();
              const dateLabel = formatLogbookDisplayDate(review.created_at);

              return (
                <li key={review.id}>
                  <Link
                    to={href}
                    className="flex gap-3 py-3 px-1 rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid="logbook-official-review-hub-item"
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg object-cover bg-gray-100"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-100" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          {formatGateoReviewerBadge(review.persona_label)}
                        </span>
                        {placeName ? (
                          <span className="text-xs font-semibold text-gray-700">{placeName}</span>
                        ) : null}
                      </div>
                      {preview ? (
                        <p className="text-sm text-gray-600 line-clamp-2 break-keep">{preview}</p>
                      ) : null}
                      {dateLabel ? (
                        <p className="mt-1 text-[11px] text-gray-400">{dateLabel}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          {hasMore ? (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 px-4 py-2"
                data-testid="logbook-official-review-hub-more"
                onClick={() => setVisibleCount((n) => Math.min(n + PAGE_SIZE, totalCount))}
              >
                더 보기
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default LogbookOfficialReviewHubCard;
