import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LogbookEditorialReviewBody } from '../../../logbookOfficialReviews/LogbookEditorialReviewBody.jsx';
import { LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE } from '../../../logbookOfficialReviews/constants.js';
import { useLogbookOfficialReviewHub } from '../../../logbookOfficialReviews/useLogbookOfficialReviewHub.js';
import { formatLogbookDisplayDate } from '../../../utils/logbookDisplayDate';
import { formatGateoReviewerBadge } from '../../../utils/placeReviewEditorial';
import { buildPlaceReviewsHref } from '../../../utils/placeReviewFocus.js';

/** Below link chips — CTA bar + safe-area + chip row so max scroll does not cover chips. */
const STICKY_CTA_SCROLL_CLEARANCE =
  'min-h-[calc(7.75rem+env(safe-area-inset-bottom,0px))]';

function PlaceCardCta({ href }) {
  return (
    <Link
      to={href}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
      data-testid="logbook-official-review-hub-go-place-card"
    >
      여행지 카드로 가기
    </Link>
  );
}

const LogbookOfficialReviewHubDetail = ({ reviewId }) => {
  const { rows, isLoading } = useLogbookOfficialReviewHub();
  const id = String(reviewId ?? '').trim();

  const review = useMemo(
    () => rows.find((row) => String(row.id) === id) ?? null,
    [rows, id],
  );

  if (!id) return null;

  const slug = String(review?.place_slug || '').trim();
  const placePath = slug ? `/place/${slug}` : '';
  const placeCardHref = placePath && review?.id ? buildPlaceReviewsHref(placePath, review.id) : '';

  return (
    <section
      className="relative mb-6 w-full min-w-0 max-w-full box-border md:max-w-[min(80rem,calc(100vw-16rem-3rem))] overflow-x-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm"
      aria-label={LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE}
      data-testid="logbook-official-review-hub-detail"
      data-hub-detail-review-id={id}
    >
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          aria-label="뒤로"
          data-testid="logbook-official-review-hub-detail-back"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={20} aria-hidden />
        </button>
        <span className="text-sm font-bold text-gray-900 truncate">GATEO 리뷰어 리뷰</span>
      </div>

      <div
        className="px-4 py-4 sm:px-5 pb-4"
        data-testid="logbook-official-review-hub-detail-body"
      >
        {isLoading && !review ? (
          <p className="text-sm text-gray-500">불러오는 중…</p>
        ) : null}
        {!isLoading && !review ? (
          <p className="text-sm text-gray-600">리뷰를 찾을 수 없어요</p>
        ) : null}
        {review ? (
          <>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
              <span
                className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700"
                data-testid="logbook-official-review-hub-detail-persona"
              >
                {formatGateoReviewerBadge(review.persona_label)}
              </span>
              {review.place_name ? (
                <span className="text-sm font-semibold text-gray-800">{review.place_name}</span>
              ) : null}
              {review.created_at ? (
                <span className="text-xs text-gray-400">
                  {formatLogbookDisplayDate(review.created_at)}
                </span>
              ) : null}
            </div>
            <LogbookEditorialReviewBody review={review} />
            {placeCardHref ? (
              <div
                className={STICKY_CTA_SCROLL_CLEARANCE}
                data-testid="logbook-official-review-hub-detail-sticky-clearance"
                aria-hidden="true"
              />
            ) : null}
          </>
        ) : null}
      </div>

      {placeCardHref ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 pt-2"
          data-testid="logbook-official-review-hub-go-place-card-sticky"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-[min(80rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white/95 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm">
            <PlaceCardCta href={placeCardHref} />
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default LogbookOfficialReviewHubDetail;
