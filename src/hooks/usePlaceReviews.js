import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../shared/api/supabase';

export const usePlaceReviews = (placeSlug, user) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'mine'

  const fetchReviews = useCallback(async () => {
    if (!placeSlug) {
      setReviews([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('place_reviews')
        .select(`
          *,
          user:profiles(
            id,
            display_name,
            avatar_url
          ),
          likes:place_review_likes(user_id)
        `)
        .eq('place_slug', placeSlug)
        .order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let filteredData = (data || []).map(review => ({
        ...review,
        likes_count: review.likes ? review.likes.length : 0,
        is_liked: user ? review.likes?.some(like => like.user_id === user.id) : false
      }));

      // 'mine' 필터 적용 시 내 글만 보기
      if (filter === 'mine') {
        if (user) {
          filteredData = filteredData.filter(review => review.user_id === user.id);
        } else {
          filteredData = [];
        }
      }

      setReviews(filteredData);
    } catch (err) {
      console.error('Error fetching place reviews:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [placeSlug, user, filter]);

  useEffect(() => {
    // 장소가 변경될 때 즉시 이전 리뷰 초기화 (깜빡임 방지)
    setReviews([]);
    fetchReviews();
  }, [fetchReviews]);

  const addReview = async (reviewData) => {
    if (!user) return { error: '로그인이 필요합니다.' };

    setIsLoading(true);
    try {
      const { data, error: insertError } = await supabase
        .from('place_reviews')
        .insert([{
          ...reviewData,
          place_slug: placeSlug,
          user_id: user.id
        }])
        .select(`
          *,
          user:profiles(
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (insertError) throw insertError;

      const newReview = {
        ...data,
        likes_count: 0,
        is_liked: false
      };

      // 새 리뷰를 목록 맨 앞에 추가
      if (filter === 'all' || (filter === 'mine' && data.user_id === user.id)) {
        setReviews(prev => [newReview, ...prev]);
      }
      return { data: newReview, error: null };
    } catch (err) {
      console.error('Error adding review:', err);
      return { data: null, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const updateReview = async (reviewId, updates) => {
    if (!user) return { error: '로그인이 필요합니다.' };

    setIsLoading(true);
    try {
      const { data, error: updateError } = await supabase
        .from('place_reviews')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .eq('user_id', user.id) // 본인 글만 수정 가능
        .select(`
          *,
          user:profiles(
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (updateError) throw updateError;

      setReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          return {
            ...data,
            likes_count: r.likes_count,
            is_liked: r.is_liked
          };
        }
        return r;
      }));
      return { data, error: null };
    } catch (err) {
      console.error('Error updating review:', err);
      return { data: null, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!user) return { error: '로그인이 필요합니다.' };

    setIsLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('place_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id); // 본인 글만 삭제 가능

      if (deleteError) throw deleteError;

      setReviews(prev => prev.filter(r => r.id !== reviewId));
      return { error: null };
    } catch (err) {
      console.error('Error deleting review:', err);
      return { error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = async (reviewId, isCurrentlyLiked) => {
    if (!user) return { error: '로그인이 필요합니다.' };

    // Optimistic Update
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          is_liked: !isCurrentlyLiked,
          likes_count: isCurrentlyLiked ? Math.max(0, r.likes_count - 1) : r.likes_count + 1
        };
      }
      return r;
    }));

    try {
      if (isCurrentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from('place_review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('place_review_likes')
          .insert([{ review_id: reviewId, user_id: user.id }]);

        if (error) throw error;
      }
      return { error: null };
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert Optimistic Update on error
      setReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            is_liked: isCurrentlyLiked,
            likes_count: isCurrentlyLiked ? r.likes_count + 1 : Math.max(0, r.likes_count - 1)
          };
        }
        return r;
      }));
      return { error: err.message };
    }
  };

  const incrementView = useCallback(async (reviewId) => {
    // sessionStorage를 활용하여 중복 조회수 증가 방지
    const viewedKey = `viewed_review_${reviewId}`;
    if (sessionStorage.getItem(viewedKey)) {
      return;
    }

    try {
      // API 호출 전 즉시 세션스토리지에 기록하여 Strict Mode 이중 호출 방지
      sessionStorage.setItem(viewedKey, 'true');

      const { error } = await supabase.rpc('increment_review_view', {
        review_id_param: reviewId
      });
      if (error) throw error;

      // Update UI optimistically without re-fetching everything
      setReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          return { ...r, views_count: (r.views_count || 0) + 1 };
        }
        return r;
      }));
    } catch (err) {
      console.error('Error incrementing view count:', err);
      sessionStorage.removeItem(viewedKey); // 에러 시 롤백
    }
  }, []);

  // 장소의 평균 별점 및 리뷰 수 계산
  const stats = {
    averageRating: reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : 0,
    totalReviews: reviews.length
  };

  return {
    reviews,
    isLoading,
    error,
    filter,
    setFilter,
    stats,
    addReview,
    updateReview,
    deleteReview,
    toggleLike,
    incrementView,
    refetch: fetchReviews
  };
};
