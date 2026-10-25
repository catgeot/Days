import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EditorialReviewText } from '../../../components/PlaceCard/tabs/EditorialReviewText.jsx';
import { LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE } from '../../../logbookOfficialReviews/constants.js';
import { useLogbookOfficialReviewHub } from '../../../logbookOfficialReviews/useLogbookOfficialReviewHub.js';
import { formatLogbookDisplayDate } from '../../../utils/logbookDisplayDate';
import { formatGateoReviewerBadge } from '../../../utils/placeReviewEditorial';
import {
  getGalleryImageEntries,
  resolveReviewImageSrc,
} from '../../../utils/placeReviewContentBlocks.js';
import { buildPlaceReviewsHref } from '../../../utils/placeReviewFocus.js';

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
  const placeCardHref = placePath ? buildPlaceReviewsHref(placePath, review?.id) : '';

  return (
    <section
      className="mb-6 w-full min-w-0 max-w-full box-border md:max-w-[min(80rem,calc(100vw-16rem-3rem))] overflow-x-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm"
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

      <div className="px-4 py-4 sm:px-5">
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
            {review.content ? (
              <EditorialReviewText
                text={review.content}
                className="text-sm text-gray-800 leading-relaxed"
              />
            ) : null}
            {Array.isArray(review.images) && review.images.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {getGalleryImageEntries(review.images, review.content_blocks).map(({ img, key }) => {
                  const src = resolveReviewImageSrc(img);
                  if (!src) return null;
                  return (
                    <img
                      key={key}
                      src={src}
                      alt=""
                      className="w-full rounded-lg object-cover aspect-[4/3] bg-gray-100"
                      loading="lazy"
                      decoding="async"
                    />
                  );
                })}
              </div>
            ) : null}
            {placeCardHref ? (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link
                  to={placeCardHref}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  data-testid="logbook-official-review-hub-go-place-card"
                >
                  여행지 카드로 가기
                </Link>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
};

export default LogbookOfficialReviewHubDetail;
