import React, { useState, useEffect } from 'react';
import { PenSquare, Star, MessageSquare, Image as ImageIcon, MoreVertical, Trash2, Edit } from 'lucide-react';
import { usePlaceReviews } from '../../../hooks/usePlaceReviews';
import { supabase } from '../../../shared/api/supabase';
import ReviewEditorModal from '../modals/ReviewEditorModal';

const LogbookTab = ({ location }) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  const placeSlug = location.slug || location.id; // slug 우선 사용, 없으면 id
  const {
    reviews,
    isLoading,
    filter,
    setFilter,
    stats,
    deleteReview,
    refetch
  } = usePlaceReviews(placeSlug, user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const handleWriteClick = () => {
    if (!user) {
      alert('리뷰를 작성하려면 로그인이 필요합니다.');
      // 필요한 경우 로그인 페이지로 리다이렉트하는 로직 추가
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
    <div className="flex flex-col h-full bg-white">
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
              <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                {/* 작성자 및 별점 정보 */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase overflow-hidden">
                      {review.user?.raw_user_meta_data?.avatar_url ? (
                        <img src={review.user.raw_user_meta_data.avatar_url} alt="profile" className="w-full h-full object-cover" />
                      ) : (
                        (review.user?.raw_user_meta_data?.full_name || review.user?.email || 'U')[0]
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                        {review.user?.raw_user_meta_data?.full_name || review.user?.email?.split('@')[0] || '익명 사용자'}
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

                    {/* 내 글일 경우 수정/삭제 버튼 메뉴 (간단히 구현) */}
                    {user && user.id === review.user_id && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleEditClick(review)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(review.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 본문 내용 */}
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mt-2">
                  {review.content}
                </div>

                {/* 첨부 이미지 (있을 경우) */}
                {review.images && review.images.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2 snap-x">
                    {review.images.map((img, idx) => (
                      <div key={idx} className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden snap-start bg-gray-100 border border-gray-200">
                        <img
                          src={img.url || img}
                          alt={`review img ${idx}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/100x100?text=Error';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
    </div>
  );
};

export default LogbookTab;
