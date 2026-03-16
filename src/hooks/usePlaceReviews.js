import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../shared/api/supabase';

export const usePlaceReviews = (placeSlug, user) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'mine'

  const fetchReviews = useCallback(async () => {
    if (!placeSlug) return;

    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('place_reviews')
        .select(`
          *,
          user:user_id(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('place_slug', placeSlug)
        .order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let filteredData = data || [];

      // 'mine' 필터 적용 시 내 글만 보기
      if (filter === 'mine' && user) {
        filteredData = filteredData.filter(review => review.user_id === user.id);
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
          user:user_id(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .single();

      if (insertError) throw insertError;

      // 새 리뷰를 목록 맨 앞에 추가
      if (filter === 'all' || (filter === 'mine' && data.user_id === user.id)) {
        setReviews(prev => [data, ...prev]);
      }
      return { data, error: null };
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
          user:user_id(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .single();

      if (updateError) throw updateError;

      setReviews(prev => prev.map(r => r.id === reviewId ? data : r));
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
    refetch: fetchReviews
  };
};
