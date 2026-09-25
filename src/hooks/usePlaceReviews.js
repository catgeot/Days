import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../shared/api/supabase';
import { computePlaceReviewStats } from '../utils/placeReviewStats';

function mapReviewRows(data, user) {
  return (data || []).map((review) => ({
    ...review,
    likes_count: review.likes ? review.likes.length : 0,
    is_liked: user ? review.likes?.some((like) => like.user_id === user.id) : false,
  }));
}

export const usePlaceReviews = (placeSlug, user) => {
  const [allReviews, setAllReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'mine'

  const fetchReviews = useCallback(async () => {
    if (!placeSlug) {
      setAllReviews([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError;

      setAllReviews(mapReviewRows(data, user));
    } catch (err) {
      console.error('Error fetching place reviews:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [placeSlug, user]);

  useEffect(() => {
    setAllReviews([]);
    fetchReviews();
  }, [fetchReviews]);

  const reviews = useMemo(() => {
    if (filter === 'mine') {
      if (!user) return [];
      return allReviews.filter((review) => review.user_id === user.id);
    }
    return allReviews;
  }, [allReviews, filter, user]);

  const stats = useMemo(() => computePlaceReviewStats(allReviews), [allReviews]);

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

      setAllReviews((prev) => [newReview, ...prev]);
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
        .eq('user_id', user.id)
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

      setAllReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            return {
              ...data,
              likes_count: r.likes_count,
              is_liked: r.is_liked
            };
          }
          return r;
        }),
      );
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
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setAllReviews((prev) => prev.filter((r) => r.id !== reviewId));
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

    setAllReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            is_liked: !isCurrentlyLiked,
            likes_count: isCurrentlyLiked ? Math.max(0, r.likes_count - 1) : r.likes_count + 1
          };
        }
        return r;
      }),
    );

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('place_review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('place_review_likes')
          .insert([{ review_id: reviewId, user_id: user.id }]);

        if (error) throw error;
      }
      return { error: null };
    } catch (err) {
      console.error('Error toggling like:', err);
      setAllReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            return {
              ...r,
              is_liked: isCurrentlyLiked,
              likes_count: isCurrentlyLiked ? r.likes_count + 1 : Math.max(0, r.likes_count - 1)
            };
          }
          return r;
        }),
      );
      return { error: err.message };
    }
  };

  const incrementView = useCallback(async (reviewId) => {
    const viewedKey = `viewed_review_${reviewId}`;
    if (sessionStorage.getItem(viewedKey)) {
      return;
    }

    try {
      sessionStorage.setItem(viewedKey, 'true');

      const { error } = await supabase.rpc('increment_review_view', {
        review_id_param: reviewId
      });
      if (error) throw error;

      setAllReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            return { ...r, views_count: (r.views_count || 0) + 1 };
          }
          return r;
        }),
      );
    } catch (err) {
      console.error('Error incrementing view count:', err);
      sessionStorage.removeItem(viewedKey);
    }
  }, []);

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
