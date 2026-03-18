import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { PenSquare, Star, MessageSquare, Image as ImageIcon, MoreVertical, Trash2, Edit, X, ChevronLeft, ChevronRight, Heart, Eye } from 'lucide-react';
import { usePlaceReviews } from '../../../hooks/usePlaceReviews';
import { supabase } from '../../../shared/api/supabase';
import ReviewEditorModal from '../modals/ReviewEditorModal';

// --- 추가: 긴 글 접기 및 이미지 썸네일 렌더링을 담당하는 단일 리뷰 카드 컴포넌트 ---
const ReviewItem = ({ review, user, onEdit, onDelete, onImageClick, onToggleLike, onVisible, onRequireLogin }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    // Simple way to trigger view: When the component mounts, consider it viewed
    // In a real app, you might use IntersectionObserver to only count when visible on screen
    if (!hasViewed && onVisible) {
      onVisible(review.id);
      setHasViewed(true);
    }
  }, [hasViewed, onVisible, review.id]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
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
        alert('로그인 하고 리뷰에 참여하고 경험을 공유하세요.');
      }
      return;
    }
    if (onToggleLike) {
      onToggleLike(review.id, review.is_liked);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* 작성자 및 별점 정보 */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase overflow-hidden">
            {review.user?.avatar_url ? (
              <img src={review.user.avatar_url} alt="profile" className="w-full h-full object-cover" />
            ) : (
              (review.user?.display_name || 'U')[0]
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
              {review.user?.display_name || '익명 사용자'}
              {!review.is_public && (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">비공개</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{formatDate(review.created_at)}</div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-0.5">
            {renderStars(review.rating)}
          </div>

          {user && user.id === review.user_id && (
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => onEdit(review)} className="text-gray-400 hover:text-blue-600 transition-colors" title="수정">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(review.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="삭제">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 본문 내용 (더보기 로직 적용) */}
      <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mt-2 break-keep">
        <div className={`${isExpanded ? '' : 'line-clamp-3'}`}>
          {review.content}
        </div>
        {/* 간단한 길이 체크 로직 - css line-clamp 활용. 더보기 버튼 렌더링. 줄바꿈이 많거나 글자가 길 때 */}
        {review.content.length > 120 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-500 font-medium text-xs mt-1 hover:underline"
          >
            {isExpanded ? '접기' : '더보기'}
          </button>
        )}
      </div>

      {/* 첨부 이미지 (있을 경우) */}
      {review.images && review.images.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {review.images.map((img, idx) => {
            const imgSrc = img?.url || img?.publicUrl || img;
            if (!imgSrc || typeof imgSrc !== 'string') return null;

            return (
              <div
                key={idx}
                onClick={() => onImageClick(review.images, idx)}
                className="relative shrink-0 w-24 h-24 min-w-[6rem] rounded-lg overflow-hidden snap-start bg-gray-100 border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img
                  src={imgSrc}
                  alt={`review img ${idx}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/100x100?text=Error';
                  }}
                />
              </div>
            );
          })}
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
          <span className="text-[10px] font-medium">{review.views_count || 0} 읽음</span>
        </div>
      </div>
    </div>
  );
};
// --------------------------------------------------------------------------

const LogbookTab = ({ location }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 초기 사용자 세션 확인
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));

    // PC 환경 등에서 세션 지연 로딩/변경 감지 (핵심 버그 픽스)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const placeSlug = location.slug || location.id; // slug 우선 사용, 없으면 id
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  // Lightbox 갤러리 뷰어 관련 상태
  const [viewerImages, setViewerImages] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openLightbox = (images, startIndex) => {
    setViewerImages(images);
    setViewerIndex(startIndex);
  };

  const closeLightbox = () => {
    setViewerImages(null);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setViewerIndex(prev => (prev === 0 ? viewerImages.length - 1 : prev - 1));
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setViewerIndex(prev => (prev === viewerImages.length - 1 ? 0 : prev + 1));
  };

  const handleRequireLogin = () => {
    if (window.confirm('로그인이 필요한 기능입니다.\n로그인 페이지로 이동하시겠습니까?')) {
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
    if (window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      const { error } = await deleteReview(reviewId);
      if (error) {
        alert('삭제 중 오류가 발생했습니다: ' + error);
      } else {
        alert('리뷰가 삭제되었습니다.');
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="flex flex-col h-full bg-white animate-[fadeIn_0.3s_ease-out]">
      {/* 헤더 및 통계 영역 */}
      <div className="p-4 border-b border-gray-100 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              장소 리뷰
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              이 장소를 다녀온 여행자들의 생생한 경험담
            </p>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-lg text-gray-800">{stats.averageRating}</span>
            </div>
            <p className="text-xs text-gray-500">리뷰 {stats.totalReviews}개</p>
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
              전체 보기
            </button>
            <button
              onClick={() => setFilter('mine')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              내 리뷰
            </button>
          </div>

          <button
            onClick={handleWriteClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <PenSquare className="w-4 h-4" />
            작성하기
          </button>
        </div>
      </div>

      {/* 비로그인 안내 배너 */}
      {!user && !isLoading && (
        <div className="mx-4 mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-bold text-blue-700">로그인</span>하고 첫 리뷰를 남겨보세요!<br/>
              <span className="text-xs text-gray-500">다른 여행자들에게 큰 도움이 됩니다.</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/auth/login', { state: { from: window.location.pathname + window.location.search } })}
            className="shrink-0 w-full sm:w-auto px-5 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-bold rounded-lg transition-colors shadow-sm"
          >
            로그인 하기
          </button>
        </div>
      )}

      {/* 리뷰 피드 목록 */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            리뷰를 불러오는 중입니다...
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium mb-1">
              {filter === 'mine' ? '작성한 리뷰가 없습니다.' : '아직 작성된 리뷰가 없습니다.'}
            </p>
            <p className="text-sm text-gray-400 mb-6">
              첫 번째 리뷰를 남겨보세요!
            </p>
            {filter !== 'mine' && (
              <button
                onClick={handleWriteClick}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                리뷰 작성하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                user={user}
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

      {/* 에디터 모달 */}
      {isModalOpen && (
        <ReviewEditorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          location={location}
          existingReview={editingReview}
          onSuccess={() => {
            setIsModalOpen(false);
            refetch(); // 작성/수정 성공 시 피드 새로고침
          }}
        />
      )}

      {/* Lightbox 갤러리 뷰어 모달 */}
      {viewerImages && viewerImages.length > 0 && createPortal(
        <div
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
              alt="갤러리 뷰어 이미지"
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default LogbookTab;
