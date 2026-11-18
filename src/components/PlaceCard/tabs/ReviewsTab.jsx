import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { EditorialReviewText } from './EditorialReviewText.jsx';
import { ReviewLinkChips } from './ReviewLinkChips.jsx';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { PenSquare, Star, MessageSquare, Image as ImageIcon, MoreVertical, Trash2, Edit, X, ChevronLeft, ChevronRight, Heart, Eye, BookOpen } from 'lucide-react';
import { usePlaceReviews } from '../../../hooks/usePlaceReviews';
import { useRelatedBlogs } from '../hooks/useRelatedBlogs';
import { subscribeAuthUser } from '../../../shared/Auth/sessionUser.js';
import ReviewEditorModal from '../modals/ReviewEditorModal';
import { mobilePlaceHeaderSpacerClass, mobilePlaceReviewsFooterScrollPadding, mobileLandscapeChromeHidden } from '../common/mobilePlaceHeaderInset';
import { placeScrollSurfaceClass, resetPlaceMediaScrollInstant } from '../common/placeScrollSurface';
import {
  PLACE_GALLERY_SECTION,
  queuePlaceGallerySectionAfterReview,
} from '../../../utils/placeGallerySectionFocus.js';
import { usePlaceMediaScrollToTop } from '../common/usePlaceMediaScrollToTop';
import { formatGateoReviewerBadge } from '../../../utils/placeReviewEditorial';
import {
  consumeArticleNestedScroll,
  peekArticleNestedScroll,
  rememberLogbookDetailReturn,
} from '../../../shared/navigation/logbookDetailBack.js';
import { isEditorialLogbook, publicLogbookDetailPath } from '../../../utils/logbookEditorial';
import { logbookHeroImageUrl } from '../../../utils/logbookImageSrc';
import { collectUniqueEditorialReviewImageCredits } from '../../../utils/editorialReviewImageCredit';
import {
  getCollapsedPreviewText,
  getGalleryImageEntries,
  getReviewLeadThumbnailImageIndex,
  hasReviewContentBlocks,
  normalizeReviewContentBlocks,
  dedupeReviewLinkItems,
  reviewBodyLinkUrlKeys,
  resolveReviewImageSrc,
  resolveReviewThumbnailSrc,
  shouldShowReviewBottomGallery,
  shouldShowReviewExpandToggle,
} from '../../../utils/placeReviewContentBlocks';
import { shouldToggleReviewBodyFromClick } from '../../../utils/placeReviewExpandInteraction.js';
import { reviewPlainTextForAccessibility } from '../../../utils/reviewInlineMarkdown.js';
import {
  orderPlaceReviewsForDeepLink,
  parsePlaceReviewFocusId,
  placeReviewDomId,
  placeReviewFocusSearchWithoutReview,
  PLACE_REVIEW_USER_INPUT_EVENTS,
  readPlaceReviewFocusIdFromBrowser,
  readPlaceReviewFocusIdFromHistory,
  scrollPlaceReviewIntoView,
  startPlaceReviewFocusSession,
  withPlaceReviewFocusHistory,
} from '../../../utils/placeReviewFocus.js';
import {
  clearPlaceGalleryScrollBack,
  consumeScrollAfterOverlay,
  scheduleOneGalleryScrollRealignAfterImages,
  snapshotScrollBeforeOverlay,
} from '../common/placeScrollMemory.js';
import { useLightboxHistory } from '../../../shared/useLightboxHistory.js';
import { useGateoPhotoLightboxA11y } from '../../../shared/useGateoPhotoLightboxA11y.js';
import { isGateoOfficialEditorialPlaceReview } from '../../../logbookOfficialReviews/gateoOfficialEditorialPlaceReview.js';
import { isLogbookEditorialReviewDetailLayoutActive } from '../../../utils/logbookReviewFilterFlag.js';
import LogbookEditorialReviewDetailHero from '../../../logbookOfficialReviews/LogbookEditorialReviewDetailHero.jsx';
import { resolveEditorialReviewHubHeroImageIndex } from '../../../logbookOfficialReviews/editorialReviewHubThumb.js';

const RelatedBlogCardThumbnail = ({ src }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="h-28 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-emerald-200" />
      </div>
    );
  }

  return (
    <div className="h-28 overflow-hidden bg-gray-100 relative">
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

const EditorialReviewImageCredits = ({ images, compact = false, imageContext = {} }) => {
  const credits = collectUniqueEditorialReviewImageCredits(images, imageContext);
  if (credits.length === 0) return null;

  const className = compact
    ? 'mt-0.5 text-[9px] text-gray-400 leading-none text-right w-full min-w-0 truncate whitespace-nowrap overflow-hidden'
    : 'mt-1.5 text-[10px] text-gray-400 leading-snug';

  return (
    <p className={className} translate="no" data-testid="editorial-review-image-credit">
      {credits.map((credit, index) => (
        <React.Fragment key={`${credit.type}-${index}`}>
          {index > 0 ? <span className="text-gray-300"> · </span> : null}
          {credit.type === 'unsplash' && compact ? (
            <>
              Photo:{' '}
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
              {' / '}
              <a
                href={credit.unsplashHref}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-gray-300 underline-offset-2 hover:text-gray-600"
              >
                Unsplash
              </a>
            </>
          ) : credit.type === 'unsplash' ? (
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
          ) : (
            credit.text
          )}
        </React.Fragment>
      ))}
    </p>
  );
};

const ReviewPerImageCredit = ({ img, images, imageIndex, variant = 'thumbnail' }) => (
  <EditorialReviewImageCredits
    images={[img]}
    compact={variant === 'thumbnail'}
    imageContext={{ images, imageIndex }}
  />
);

const ReviewLightboxImageCredit = ({ img, images, imageIndex }) => {
  const credits = collectUniqueEditorialReviewImageCredits([img], { images, imageIndex });
  if (credits.length === 0) return null;

  return (
    <p
      className="pointer-events-auto max-w-[min(100%,40rem)] px-3 text-center text-xs leading-snug text-white/85"
      data-testid="gateo-review-lightbox-credit"
      translate="no"
      onClick={(event) => event.stopPropagation()}
    >
      {credits.map((credit, index) => (
        <React.Fragment key={`${credit.type}-${index}`}>
          {index > 0 ? <span className="text-white/40"> · </span> : null}
          {credit.type === 'unsplash' ? (
            <>
              Photo by{' '}
              {credit.photographerHref ? (
                <a
                  href={credit.photographerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-white/30 underline-offset-2 hover:text-white"
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
                className="underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                Unsplash
              </a>
            </>
          ) : (
            credit.text
          )}
        </React.Fragment>
      ))}
    </p>
  );
};

const CollapsedReviewLeadThumbnail = ({ review, onImageClick }) => {
  const { t } = useTranslation();
  const images = review.images || [];
  const leadIndex = getReviewLeadThumbnailImageIndex(review);
  if (leadIndex == null || leadIndex >= images.length) return null;
  const leadImg = images[leadIndex];
  const thumbSrc = resolveReviewThumbnailSrc(leadImg);
  if (!thumbSrc) return null;

  return (
    <div className="shrink-0 w-[4.25rem] sm:w-[4.75rem] flex flex-col gap-0.5 min-w-0">
      <button
        type="button"
        onClick={() => onImageClick(images, leadIndex)}
        className="block w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer hover:opacity-95 transition-opacity"
        aria-label={t('place.reviews.thumbnailPreviewAria')}
      >
        <img
          src={thumbSrc}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          width={76}
          height={76}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/76x76?text=Error';
          }}
        />
      </button>
      <ReviewPerImageCredit
        img={leadImg}
        images={images}
        imageIndex={leadIndex}
        variant="thumbnail"
      />
    </div>
  );
};

const ReviewStatsBlock = ({ stats, layout = 'desktop' }) => {
  const { t } = useTranslation();
  const countLine = t('place.reviews.countSplit', {
    traveler: stats.travelerCount,
    editorial: stats.editorialCount,
  });

  if (layout === 'mobile') {
    return (
      <div className="flex flex-col items-end gap-0.5 min-w-0 max-w-[55%]">
        <p className="text-[10px] text-gray-500 leading-snug text-right truncate w-full">{countLine}</p>
        {stats.averageRatingDisplay ? (
          <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded shrink-0">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-yellow-700 text-xs">{stats.averageRatingDisplay}</span>
          </div>
        ) : (
          <p className="text-[10px] text-gray-400 text-right leading-snug">{t('place.reviews.noTravelerRating')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="text-right flex flex-col items-end max-w-[14rem]">
      {stats.averageRatingDisplay ? (
        <div className="flex items-center gap-1 mb-1">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-lg text-gray-800">{stats.averageRatingDisplay}</span>
        </div>
      ) : (
        <p className="text-xs text-gray-500 mb-1 leading-snug">{t('place.reviews.noTravelerRating')}</p>
      )}
      <p className="text-xs text-gray-500 leading-snug">{countLine}</p>
    </div>
  );
};

// --- 추가: 긴 글 접기 및 이미지 썸네일 렌더링을 담당하는 단일 리뷰 카드 컴포넌트 ---
export const ReviewItem = ({ review, user, onEdit, onDelete, onImageClick, onToggleLike, onVisible, onRequireLogin, focused = false, initialExpanded = false }) => {
  const { t, i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [hasViewed, setHasViewed] = useState(false);
  const hubDetailLayout =
    isGateoOfficialEditorialPlaceReview(review) && isLogbookEditorialReviewDetailLayoutActive();

  useEffect(() => {
    if (hasViewed || !onVisible) return;
    const id = review.id;
    queueMicrotask(() => {
      onVisible(id);
      setHasViewed(true);
    });
  }, [hasViewed, onVisible, review.id]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'ko-KR', options);
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const handleLikeClick = () => {
    if (!user) {
      if (onRequireLogin) {
        onRequireLogin();
      } else {
        alert(t('place.reviews.loginPrompt'));
      }
      return;
    }
    if (onToggleLike) {
      onToggleLike(review.id, review.is_liked);
    }
  };

  const usesContentBlocks = hasReviewContentBlocks(review.content_blocks);
  const contentBlocks = usesContentBlocks ? normalizeReviewContentBlocks(review.content_blocks) : [];
  const collapsedPreviewText = getCollapsedPreviewText(review);
  const plainCollapsedPreview = reviewPlainTextForAccessibility(collapsedPreviewText);
  const galleryEntries = usesContentBlocks
    ? getGalleryImageEntries(review.images, review.content_blocks)
    : (review.images || []).map((img, index) => ({ img, index }));
  const showExpandToggle = shouldShowReviewExpandToggle(review);
  const showBottomGallery = shouldShowReviewBottomGallery(review, isExpanded);
  const leadThumbnailIndex = getReviewLeadThumbnailImageIndex(review);
  const hubHeroImageIndex = useMemo(() => {
    if (!hubDetailLayout) return null;
    return resolveEditorialReviewHubHeroImageIndex(review);
  }, [hubDetailLayout, review]);

  const toggleExpanded = () => setIsExpanded((value) => !value);

  const handleReviewBodyClick = (event) => {
    if (!showExpandToggle) return;
    if (!shouldToggleReviewBodyFromClick(event)) return;
    toggleExpanded();
  };

  const renderInlineImage = (imageIndex, blockKey) => {
    const images = review.images || [];
    const img = images[imageIndex];
    const imgSrc = resolveReviewImageSrc(img);
    if (!imgSrc) return null;

    return (
      <div key={blockKey} className="mt-3">
        <button
          type="button"
          onClick={() => onImageClick(images, imageIndex)}
          className="block w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer hover:opacity-95 transition-opacity text-left"
        >
          <img
            src={imgSrc}
            alt={`review img ${imageIndex}`}
            className="w-full max-h-80 object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/400x300?text=Error';
            }}
          />
        </button>
        {review.is_editorial &&
        !(hubDetailLayout && hubHeroImageIndex != null && hubHeroImageIndex === imageIndex) ? (
          <ReviewPerImageCredit
            img={img}
            images={images}
            imageIndex={imageIndex}
            variant="inline"
          />
        ) : null}
      </div>
    );
  };

  const reviewAnchorId = placeReviewDomId(review.id);

  return (
    <div
      id={reviewAnchorId || undefined}
      className={`bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow scroll-mt-4${focused ? ' place-review-focus-current' : ''}`}
      data-review-id={review.id}
    >
      {hubDetailLayout ? (
        <LogbookEditorialReviewDetailHero review={review} onImageClick={onImageClick} />
      ) : (
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase overflow-hidden">
              {review.user?.avatar_url ? (
                <img src={review.user.avatar_url.replace(/^http:\/\//i, 'https://')} alt="profile" className="w-full h-full object-cover" />
              ) : (
                (review.user?.display_name || 'U')[0]
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm flex flex-wrap items-center gap-2">
                {review.is_editorial ? (
                  <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                    {formatGateoReviewerBadge(review.persona_label)}
                  </span>
                ) : (
                  <>
                    {review.user?.display_name || t('place.reviews.anonymous')}
                    {!review.is_public && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t('place.reviews.private')}</span>
                    )}
                  </>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{formatDate(review.created_at)}</div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {review.is_editorial === true ? null : (
              <div className="flex gap-0.5" data-review-stars="">
                {renderStars(review.rating)}
              </div>
            )}

            {user && user.id === review.user_id && (
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => onEdit(review)} className="text-gray-400 hover:text-blue-600 transition-colors" title={t('place.reviews.edit')}>
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(review.id)} className="text-gray-400 hover:text-red-600 transition-colors" title={t('place.reviews.delete')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {review.is_editorial && review.disclosure?.trim() && (
        <p className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-2.5 py-1.5 mt-1 leading-snug">
          {review.disclosure.trim()}
        </p>
      )}

      {/* 본문 (content_blocks 인터리브 또는 기존 content + 하단 갤러리) */}
      <div className="mt-2 flex gap-3 items-start">
        <div
          className={`flex-1 min-w-0 text-gray-700 text-sm leading-relaxed break-keep ${showExpandToggle ? 'cursor-pointer' : ''}`}
          data-review-body=""
          onClick={handleReviewBodyClick}
        >
          {usesContentBlocks ? (
            !isExpanded ? (
              review.is_editorial === true ? (
                <EditorialReviewText
                  text={collapsedPreviewText}
                  inline
                  className="line-clamp-3"
                />
              ) : (
                <div className="whitespace-pre-wrap line-clamp-3">
                  {plainCollapsedPreview}
                </div>
              )
            ) : (
              contentBlocks.map((block, blockIdx) => {
                if (block.type === 'text') {
                  if (review.is_editorial === true) {
                    return (
                      <EditorialReviewText
                        key={`text-${blockIdx}`}
                        text={block.text}
                        className="mt-3 first:mt-0"
                      />
                    );
                  }
                  return (
                    <p key={`text-${blockIdx}`} className="whitespace-pre-wrap mt-3 first:mt-0">
                      {reviewPlainTextForAccessibility(block.text)}
                    </p>
                  );
                }
                if (block.type === 'links') {
                  if (review.is_editorial !== true) return null;
                  const chipItems = dedupeReviewLinkItems(
                    block.items,
                    reviewBodyLinkUrlKeys(contentBlocks),
                  );
                  if (chipItems.length === 0) return null;
                  return <ReviewLinkChips key={`links-${blockIdx}`} items={chipItems} />;
                }
                if (block.type === 'image') {
                  const images = review.images || [];
                  if (block.image_index >= images.length) return null;
                  return renderInlineImage(block.image_index, `image-${blockIdx}`);
                }
                return null;
              })
            )
          ) : review.is_editorial === true ? (
            <EditorialReviewText
              text={review.content}
              inline={!isExpanded}
              className={isExpanded ? '' : 'line-clamp-3'}
            />
          ) : (
            <div className={`whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}>
              {reviewPlainTextForAccessibility(review.content)}
            </div>
          )}
          {showExpandToggle && (
            <button
              type="button"
              data-review-expand-toggle=""
              aria-expanded={isExpanded}
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded();
              }}
              className="mt-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span>{isExpanded ? t('place.reviews.collapse') : t('place.reviews.expand')}</span>
              <span className="text-base leading-none" aria-hidden="true">
                {isExpanded ? '▴' : '▾'}
              </span>
            </button>
          )}
        </div>
        {!hubDetailLayout && !isExpanded && leadThumbnailIndex != null ? (
          <CollapsedReviewLeadThumbnail review={review} onImageClick={onImageClick} />
        ) : null}
      </div>

      {showBottomGallery && (
        <div className="mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {galleryEntries.map(({ img, index: idx }) => {
              const imgSrc = resolveReviewImageSrc(img);
              if (!imgSrc) return null;

              return (
                <div key={idx} className="shrink-0 flex w-24 min-w-[6rem] flex-col gap-0.5 snap-start">
                  <button
                    type="button"
                    onClick={() => onImageClick(review.images, idx)}
                    className="relative h-24 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={imgSrc}
                      alt={`review img ${idx}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/100x100?text=Error';
                      }}
                    />
                  </button>
                  {review.is_editorial &&
                  !(
                    hubDetailLayout && hubHeroImageIndex != null && hubHeroImageIndex === idx
                  ) ? (
                    <ReviewPerImageCredit
                      img={img}
                      images={review.images}
                      imageIndex={idx}
                      variant="thumbnail"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 액션 및 통계 영역 (좋아요 / 조회수 실제 데이터 연동) */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
        <button
          onClick={handleLikeClick}
          className={`flex items-center gap-1.5 transition-colors group ${review.is_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
        >
          <Heart className={`w-4 h-4 ${review.is_liked ? 'fill-red-500' : 'group-hover:fill-red-500'}`} />
          <span className="text-xs font-medium">{review.likes_count || 0}</span>
        </button>
        <div className="flex items-center gap-1 text-gray-400">
          <Eye className="w-4 h-4" />
          <span className="text-[10px] font-medium">{t('place.reviews.reads', { count: review.views_count || 0 })}</span>
        </div>
      </div>
    </div>
  );
};
// --------------------------------------------------------------------------

const ReviewsTab = ({ location, setMediaMode, mobileSecondaryNav = null, isActive = true }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [searchParams] = useSearchParams();
  const queryFocusId = parsePlaceReviewFocusId(searchParams);
  const [cancelledFocusId, setCancelledFocusId] = useState(null);
  const scrollContainerRef = useRef(null);
  const focusSessionRef = useRef(null);
  const articleScrollHoldRef = useRef(false);
  const pendingNestedRef = useRef(null);
  const articleScrollPath = `${routeLocation.pathname}${routeLocation.search}`;
  if (!articleScrollHoldRef.current) {
    const pending = peekArticleNestedScroll(articleScrollPath);
    if (pending?.kind === 'place-reviews') {
      articleScrollHoldRef.current = true;
      pendingNestedRef.current = pending;
    }
  }
  const userCancelledDeepLinkRef = useRef(false);
  const consumedReviewDeepLinkRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    return subscribeAuthUser(setUser);
  }, []);

  // 좌표·검색 기반 장소는 id(search-/loc-)가 리뷰·URL의 단일 키. 지오코딩 slug가 유명 도시와 겹칠 수 있어 id 우선.
  const idStr = location?.id != null ? String(location.id) : '';
  const placeSlug =
    idStr.startsWith('search-') || idStr.startsWith('loc-')
      ? idStr
      : (location.slug || idStr);

  const historyFocusId = readPlaceReviewFocusIdFromHistory(routeLocation.state, placeSlug)
    || readPlaceReviewFocusIdFromBrowser(placeSlug);
  const queryBlocked = Boolean(queryFocusId) && cancelledFocusId === queryFocusId;
  // Query wins on the shared-link load. History keeps that review first after replace and Back.
  const activeFocusId = queryBlocked ? null : (queryFocusId || historyFocusId);
  const prevFocusReviewIdRef = useRef(activeFocusId);
  usePlaceMediaScrollToTop('REVIEWS', scrollContainerRef, !queryFocusId);

  useEffect(() => {
    if (!isActive || !placeSlug) return;
    try {
      const nav = performance.getEntriesByType?.('navigation')?.[0];
      if (nav?.type === 'reload') {
        clearPlaceGalleryScrollBack(placeSlug);
      }
    } catch {
      /* ignore */
    }
  }, [isActive, placeSlug]);

  useLayoutEffect(() => {
    const hadFocus = Boolean(prevFocusReviewIdRef.current);
    prevFocusReviewIdRef.current = activeFocusId;
    if (articleScrollHoldRef.current) return;
    if (activeFocusId) return;
    if (hadFocus) return;
    resetPlaceMediaScrollInstant(scrollContainerRef.current);
  }, [placeSlug, activeFocusId]);

  const {
    reviews,
    isLoading,
    filter,
    setFilter,
    stats,
    deleteReview,
    toggleLike,
    incrementView,
    refetch
  } = usePlaceReviews(placeSlug, user);

  useLayoutEffect(() => {
    if (!articleScrollHoldRef.current) return undefined;
    const nested = pendingNestedRef.current;
    if (!nested || nested.kind !== 'place-reviews') return undefined;
    let frame = 0;
    let raf = 0;
    const tick = () => {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = nested.top;
      frame += 1;
      if (frame < 12) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const timer = window.setTimeout(() => {
      const el = scrollContainerRef.current;
      if (!el || el.scrollHeight < nested.top + 40) return;
      consumeArticleNestedScroll(articleScrollPath);
    }, 1500);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [articleScrollPath, isLoading, reviews.length]);

  const consumeReviewDeepLink = React.useCallback((options = {}) => {
    const reviewId = parsePlaceReviewFocusId(searchParams);
    if (!reviewId || consumedReviewDeepLinkRef.current === reviewId) return;
    consumedReviewDeepLinkRef.current = reviewId;
    const next = placeReviewFocusSearchWithoutReview(searchParams);
    const search = next.toString();
    const pin = options.pin === true;
    const state = pin
      ? withPlaceReviewFocusHistory(routeLocation.state, reviewId, placeSlug)
      : routeLocation.state;
    navigate(
      {
        pathname: routeLocation.pathname,
        search: search ? `?${search}` : '',
        hash: routeLocation.hash,
      },
      {
        replace: true,
        preventScrollReset: true,
        state,
      },
    );
  }, [navigate, placeSlug, routeLocation.hash, routeLocation.pathname, routeLocation.state, searchParams]);

  useEffect(() => {
    userCancelledDeepLinkRef.current = false;
    if (!isActive || !queryFocusId) return undefined;

    const listeners = [];
    const cancelFromUser = () => {
      userCancelledDeepLinkRef.current = true;
      setCancelledFocusId(queryFocusId);
      focusSessionRef.current?.abort();
    };

    const attach = () => {
      const root = scrollContainerRef.current;
      if (!root || listeners.length) return;
      for (const type of PLACE_REVIEW_USER_INPUT_EVENTS) {
        root.addEventListener(type, cancelFromUser, { passive: true });
        listeners.push([root, type, cancelFromUser]);
      }
    };

    attach();
    const poll = window.setInterval(attach, 50);

    return () => {
      window.clearInterval(poll);
      listeners.forEach(([root, type, handler]) => {
        root.removeEventListener(type, handler);
      });
    };
  }, [isActive, queryFocusId, placeSlug]);

  useEffect(() => {
    if (articleScrollHoldRef.current) return undefined;
    if (!isActive) {
      focusSessionRef.current?.abort();
      focusSessionRef.current = null;
      return undefined;
    }
    const blocked = Boolean(queryFocusId) && (userCancelledDeepLinkRef.current || cancelledFocusId === queryFocusId);
    if (blocked) {
      consumeReviewDeepLink({ pin: false });
      return undefined;
    }
    if (!activeFocusId) return undefined;
    if (isLoading) return undefined;

    const prev = focusSessionRef.current;
    if (prev) prev.abort();

    const session = startPlaceReviewFocusSession(
      activeFocusId,
      scrollContainerRef.current,
      { behavior: 'auto' },
    );
    focusSessionRef.current = session;
    let cancelled = false;

    session.promise.then((result) => {
      if (cancelled || !queryFocusId) return;
      if (result?.reason === 'aborted' && !userCancelledDeepLinkRef.current) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        const pin = result?.reason === 'found' && result.ok && !userCancelledDeepLinkRef.current;
        consumeReviewDeepLink({ pin });
      });
    });

    return () => {
      cancelled = true;
      const result = session.getResult();
      if (result?.reason === 'found' && result.ok) {
        session.release();
      } else {
        session.abort();
      }
      if (focusSessionRef.current === session) {
        focusSessionRef.current = null;
      }
    };
  }, [isActive, activeFocusId, queryFocusId, cancelledFocusId, isLoading, placeSlug, consumeReviewDeepLink]);

  useEffect(() => {
    if (!queryFocusId) consumedReviewDeepLinkRef.current = null;
  }, [queryFocusId]);

  useEffect(() => () => {
    focusSessionRef.current?.abort();
    focusSessionRef.current = null;
  }, []);

  const { blogs, isLoading: blogsLoading } = useRelatedBlogs(location.name, placeSlug);
  const orderedReviews = useMemo(
    () => orderPlaceReviewsForDeepLink(reviews, activeFocusId),
    [reviews, activeFocusId],
  );
  const focusRowReady = Boolean(activeFocusId)
    && reviews.some((review) => String(review?.id) === String(activeFocusId));

  useLayoutEffect(() => {
    if (articleScrollHoldRef.current) return undefined;
    if (!activeFocusId || !focusRowReady) return undefined;
    const align = () => {
      if (userCancelledDeepLinkRef.current) return;
      const root = scrollContainerRef.current;
      if (!root) return;
      scrollPlaceReviewIntoView(root, activeFocusId, { behavior: 'auto' });
    };
    align();
    const timer = window.setTimeout(align, 200);
    return () => clearTimeout(timer);
  }, [activeFocusId, focusRowReady, blogs.length]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  // Lightbox 갤러리 뷰어 관련 상태
  const [viewerImages, setViewerImages] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const reviewsOverlayKey = useMemo(
    () => (placeSlug ? `reviews:${placeSlug}` : ''),
    [placeSlug],
  );

  const reviewsLightboxRef = useRef(null);

  const closeLightbox = useCallback(() => {
    setViewerImages(null);
  }, []);

  const openLightbox = useCallback((images, startIndex) => {
    snapshotScrollBeforeOverlay(reviewsOverlayKey, scrollContainerRef.current, placeSlug);
    setViewerImages(images);
    setViewerIndex(startIndex);
  }, [reviewsOverlayKey, placeSlug]);

  useLightboxHistory(Boolean(viewerImages?.length), closeLightbox);

  useGateoPhotoLightboxA11y({
    open: Boolean(viewerImages?.length),
    onClose: closeLightbox,
    rootRef: reviewsLightboxRef,
    onArrowLeft: () => setViewerIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1)),
    onArrowRight: () => setViewerIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1)),
  });

  useLayoutEffect(() => {
    if (viewerImages) return undefined;
    const top = consumeScrollAfterOverlay(reviewsOverlayKey);
    const el = scrollContainerRef.current;
    if (top <= 0 || !el) return undefined;
    el.scrollTop = top;
    return scheduleOneGalleryScrollRealignAfterImages(el, top);
  }, [viewerImages, reviewsOverlayKey]);

  const prevImage = (e) => {
    e.stopPropagation();
    setViewerIndex(prev => (prev === 0 ? viewerImages.length - 1 : prev - 1));
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setViewerIndex(prev => (prev === viewerImages.length - 1 ? 0 : prev + 1));
  };

  const handleRequireLogin = () => {
    if (window.confirm(t('place.reviews.loginRequiredConfirm'))) {
      navigate('/auth/login', { state: { from: window.location.pathname + window.location.search } });
    }
  };

  const handleWriteClick = () => {
    if (!user) {
      handleRequireLogin();
      return;
    }
    setEditingReview(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (review) => {
    setEditingReview(review);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (reviewId) => {
    if (window.confirm(t('place.reviews.deleteConfirm'))) {
      const { error } = await deleteReview(reviewId);
      if (error) {
        alert(t('place.reviews.deleteError', { error: String(error) }));
      } else {
        alert(t('place.reviews.deleteSuccess'));
      }
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white animate-[fadeIn_0.3s_ease-out] relative">
      {/* PC 헤더 (기존 유지) */}
      <div className="hidden lg:block p-4 border-b border-gray-100 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              {t('place.reviews.title')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('place.reviews.subtitle')}
            </p>
          </div>

          <div className="text-right flex flex-col items-end">
            <ReviewStatsBlock stats={stats} layout="desktop" />
          </div>
        </div>

        {/* 필터 및 작성 버튼 */}
        <div className="flex justify-between items-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('place.reviews.filterAll')}
            </button>
            <button
              onClick={() => setFilter('mine')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('place.reviews.filterMine')}
            </button>
          </div>

          <button
            onClick={handleWriteClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <PenSquare className="w-4 h-4" />
            {t('place.reviews.writeAction')}
          </button>
        </div>
      </div>

      {/* 모바일 우측 하단 FAB 작성 버튼 */}
      <button
        onClick={handleWriteClick}
        className={`lg:hidden fixed bottom-6 right-4 z-50 flex items-center justify-center gap-1.5 px-4 py-3 bg-blue-600 text-white rounded-full shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:bg-blue-700 active:scale-95 transition-all ${mobileLandscapeChromeHidden}`}
      >
        <PenSquare className="w-4 h-4" />
        <span className="font-bold text-sm">{t('place.reviews.write')}</span>
      </button>

      {/* 모바일: 미디어 탭 + 리뷰 헤더 + 본문 단일 스크롤 / 데스크톱: 본문만 스크롤 */}
      <div className={mobilePlaceHeaderSpacerClass} aria-hidden="true" />
      <div
        ref={scrollContainerRef}
        data-place-reviews-scroll-root=""
        className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar [overflow-anchor:none] [&_*]:[overflow-anchor:none] ${placeScrollSurfaceClass} ${mobilePlaceReviewsFooterScrollPadding} lg:pb-4 lg:pt-0`}
      >
        {mobileSecondaryNav && (
          <div
            data-place-reviews-scroll-chrome=""
            className={`lg:hidden px-2 pb-2 shrink-0 ${mobileLandscapeChromeHidden}`}
          >
            {mobileSecondaryNav}
          </div>
        )}

        {/* 모바일 전용 압축 헤더 — sticky 제거, 스크롤과 함께 이동 */}
        <div className={`lg:hidden flex flex-col shrink-0 bg-white border-b border-gray-100 shadow-sm ${mobileLandscapeChromeHidden}`}>
          <div className="flex items-start justify-between px-3 pt-2.5 pb-1 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setMediaMode?.('GALLERY')}
                className="p-1 -ml-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1.5 min-w-0">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <h3 className="font-bold text-gray-900 text-sm truncate">
                  {t('place.reviews.headerShort')}
                </h3>
              </div>
            </div>

            <ReviewStatsBlock stats={stats} layout="mobile" />
          </div>
          <div className="flex items-center justify-end px-3 pb-2.5 gap-2">
            <div className="flex bg-gray-100 rounded p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
                  filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {t('place.reviews.filterAllShort')}
              </button>
              <button
                type="button"
                onClick={() => setFilter('mine')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
                  filter === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {t('place.reviews.filterMine')}
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          {/* 비로그인 안내 배너 */}
          {!user && !isLoading && (
            <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-gray-700">
                  <Trans
                    i18nKey="place.reviews.loginBanner"
                    components={{ bold: <span className="font-bold text-blue-700" /> }}
                  />
                  <br />
                  <span className="text-xs text-gray-500">{t('place.reviews.loginHint')}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate('/auth/login', {
                    state: { from: window.location.pathname + window.location.search },
                  })
                }
                className="shrink-0 w-full sm:w-auto px-5 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                {t('place.reviews.loginAction')}
              </button>
            </div>
          )}

          {/* 관련 블로그 연동 영역 */}
          {!blogsLoading && blogs.length > 0 && filter === 'all' && (
            <div className="mb-6 border border-gray-100 rounded-xl bg-gray-50/50 p-4">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <h4 className="font-bold text-gray-800">{t('place.reviews.sectionTitle')}</h4>
                <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  {t('place.reviews.blogBadge')}
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x custom-scrollbar">
                {blogs.map((blog) => {
                  const editorial = isEditorialLogbook(blog);
                  const thumb = logbookHeroImageUrl(blog.images);
                  return (
                  <a
                    key={blog.id}
                    href={publicLogbookDetailPath(blog)}
                    className={`shrink-0 w-56 bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer snap-start flex flex-col group no-underline ${editorial ? 'border-indigo-100' : 'border-gray-100'}`}
                    onClick={() => rememberLogbookDetailReturn(publicLogbookDetailPath(blog))}
                  >
                    <RelatedBlogCardThumbnail src={thumb} />
                    <div className="p-3 flex flex-col gap-1">
                      <h5 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {blog.title}
                      </h5>
                      <p className="text-[10px] text-gray-400 font-medium truncate">
                        {editorial ? (
                          <span className="text-indigo-700 font-semibold">GATEO 에디터 · </span>
                        ) : blog.author_label ? (
                          <span className="text-gray-500">{blog.author_label} · </span>
                        ) : null}
                        {blog.date} · {blog.location}
                      </p>
                    </div>
                  </a>
                );
                })}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
              {t('place.reviews.loading')}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-600 font-medium mb-1">
                {filter === 'mine' ? t('place.reviews.emptyMine') : t('place.reviews.emptyAll')}
              </p>
              <p className="text-sm text-gray-400 mb-6">{t('place.reviews.empty')}</p>
              {filter !== 'mine' && (
                <button
                  type="button"
                  onClick={handleWriteClick}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  {t('place.reviews.writeFirst')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {orderedReviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  user={user}
                  initialExpanded={pendingNestedRef.current?.reviewId === String(review.id)}
                  focused={String(review.id) === String(activeFocusId)}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onImageClick={openLightbox}
                  onToggleLike={toggleLike}
                  onVisible={incrementView}
                  onRequireLogin={handleRequireLogin}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 에디터 모달 */}
      {isModalOpen && (
        <ReviewEditorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          location={location}
          existingReview={editingReview}
          onSuccess={() => {
            setIsModalOpen(false);
            refetch();
            window.dispatchEvent(new Event('place-visit-stories-refresh'));
            if (!editingReview) {
              queuePlaceGallerySectionAfterReview(placeSlug, PLACE_GALLERY_SECTION.STORIES);
            }
          }}
        />
      )}

      {/* Lightbox 갤러리 뷰어 모달 */}
      {viewerImages && viewerImages.length > 0 && createPortal(
        <div
          ref={reviewsLightboxRef}
          data-gateo-photo-lightbox=""
          data-gateo-photo-lightbox-focus=""
          role="dialog"
          aria-modal="true"
          aria-label={t('place.reviews.galleryViewerAlt')}
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
          onClick={closeLightbox}
        >
          {/* 상단 닫기 버튼 및 카운터 */}
          <div className="absolute top-0 left-0 w-full flex justify-between items-center px-4 pt-10 pb-6 sm:pt-6 text-white z-[10000] bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div className="text-base font-bold tracking-widest pl-2 mt-2">
              {viewerIndex + 1} / {viewerImages.length}
            </div>
            <button
              onClick={closeLightbox}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-full active:scale-95 transition-transform pointer-events-auto"
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          {/* 메인 이미지 */}
          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* 배경 로딩 스피너 (이미지가 로드되는 동안 검게 보이지 않게) */}
            <div className="absolute inset-0 flex items-center justify-center -z-10">
               <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
            <img
              key={viewerIndex} // 키를 변경하여 재렌더링 유도
              src={viewerImages[viewerIndex]?.url || viewerImages[viewerIndex]?.publicUrl || viewerImages[viewerIndex]}
              alt={t('place.reviews.galleryViewerAlt')}
              className="max-w-full max-h-full object-contain select-none"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/800x600?text=Error';
              }}
            />

            {/* 이전/다음 버튼 (여러 장일 때만 렌더링) */}
            {viewerImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 md:left-8 p-3 bg-black/40 hover:bg-black/80 text-white rounded-full active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 md:right-8 p-3 bg-black/40 hover:bg-black/80 text-white rounded-full active:scale-95 transition-all"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[10000] flex justify-center bg-gradient-to-t from-black/80 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-8"
            onClick={(e) => e.stopPropagation()}
          >
            <ReviewLightboxImageCredit
              key={viewerIndex}
              img={viewerImages[viewerIndex]}
              images={viewerImages}
              imageIndex={viewerIndex}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReviewsTab;
