import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, MessageSquare, Star, X } from 'lucide-react';
import { ReviewItem } from '../../components/PlaceCard/tabs/ReviewsTab.jsx';
import { usePlaceReviews } from '../../hooks/usePlaceReviews';
import { subscribeAuthUser } from '../../shared/Auth/sessionUser.js';
import { useLightboxHistory } from '../../shared/useLightboxHistory.js';
import { festivalReviewPlaceSlug } from './lib/festivalReviewPlaceSlug.js';

function ReviewStatsCompactInner({ stats }) {
  const { t } = useTranslation();
  const countLine = t('place.reviews.countSplit', {
    traveler: stats.travelerCount,
    editorial: stats.editorialCount,
  });
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
      <p className="leading-snug">{countLine}</p>
      {stats.averageRatingDisplay ? (
        <span className="inline-flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded shrink-0">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="font-bold text-yellow-700 text-xs">{stats.averageRatingDisplay}</span>
        </span>
      ) : (
        <span className="text-[10px] text-stone-400">{t('place.reviews.noTravelerRating')}</span>
      )}
    </div>
  );
}

export default function FestivalDetailReviewsSection({ contentId }) {
  const { t } = useTranslation();
  const placeSlug = useMemo(() => festivalReviewPlaceSlug(contentId), [contentId]);
  const [user, setUser] = useState(null);
  const [viewerImages, setViewerImages] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => subscribeAuthUser(setUser), []);

  const { reviews, isLoading, stats, toggleLike, incrementView } = usePlaceReviews(placeSlug, user);

  const closeLightbox = useCallback(() => setViewerImages(null), []);

  const openLightbox = useCallback((images, startIndex) => {
    setViewerImages(images);
    setViewerIndex(startIndex);
  }, []);

  useLightboxHistory(Boolean(viewerImages?.length), closeLightbox);

  if (!placeSlug) return null;
  if (!isLoading && reviews.length === 0) return null;

  return (
  <>
      <div className="space-y-3 pt-2" data-festival-section="reviews">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" aria-hidden="true" />
            <h4 className="text-[11px] font-bold tracking-widest text-stone-500 uppercase">
              {t('place.reviews.headerShort')}
            </h4>
          </div>
          {!isLoading && reviews.length > 0 ? <ReviewStatsCompactInner stats={stats} /> : null}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-stone-400" data-festival-reviews-loading="">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
          </div>
        ) : (
          <div className="space-y-4" data-festival-reviews-list="">
            {reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                user={user}
                onEdit={() => {}}
                onDelete={() => {}}
                onImageClick={openLightbox}
                onToggleLike={toggleLike}
                onVisible={incrementView}
                onRequireLogin={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {viewerImages && viewerImages.length > 0
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
              onClick={closeLightbox}
            >
              <div className="absolute top-0 left-0 w-full flex justify-between items-center px-4 pt-10 pb-6 sm:pt-6 text-white z-[10000] bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="text-base font-bold tracking-widest pl-2 mt-2">
                  {viewerIndex + 1} / {viewerImages.length}
                </div>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full active:scale-95 transition-transform pointer-events-auto"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>
              <div
                className="relative w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  key={viewerIndex}
                  src={
                    viewerImages[viewerIndex]?.url
                    || viewerImages[viewerIndex]?.publicUrl
                    || viewerImages[viewerIndex]
                  }
                  alt={t('place.reviews.galleryViewerAlt')}
                  className="max-w-full max-h-full object-contain select-none"
                  loading="lazy"
                />
                {viewerImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewerIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-2 md:left-8 p-3 bg-black/40 hover:bg-black/80 text-white rounded-full"
                    >
                      <ChevronLeft className="w-7 h-7" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewerIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-2 md:right-8 p-3 bg-black/40 hover:bg-black/80 text-white rounded-full"
                    >
                      <ChevronRight className="w-7 h-7" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
