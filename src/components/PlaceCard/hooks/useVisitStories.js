import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { resolveVerifiedFacts } from '../../../data/placeVerifiedFacts/cairo.js';
import { selectVisitStories } from '../../../data/placeVerifiedFacts/localInfoLayout.js';
import { publicLogbookDetailPath } from '../../../utils/logbookEditorial';
import { useRelatedBlogs } from './useRelatedBlogs';

function reviewPlaceSlug(location) {
  const idStr = location?.id != null ? String(location.id) : '';
  if (idStr.startsWith('search-') || idStr.startsWith('loc-')) return idStr;
  return location?.slug || idStr || '';
}

export function useVisitStories(location) {
  const card = resolveVerifiedFacts(location);
  const enabled = Boolean(card);
  const placeName = enabled ? (location?.name || location?.name_en || '') : '';
  const { blogs, isLoading: blogsLoading } = useRelatedBlogs(placeName);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const slug = reviewPlaceSlug(location);

  useEffect(() => {
    if (!enabled || !slug) {
      setReviews([]);
      setReviewsLoading(false);
      return undefined;
    }
    let cancelled = false;
    setReviewsLoading(true);
    supabase
      .from('place_reviews')
      .select('id, title, is_editorial, created_at')
      .eq('place_slug', slug)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setReviews([]);
        } else {
          setReviews((data || []).filter((row) => String(row?.title || '').trim()));
        }
        setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, slug]);

  const stories = useMemo(() => {
    if (!enabled) return [];
    const names = [
      location?.name,
      location?.name_en,
      location?.name_ko,
      location?.slug,
      card?.name,
      card?.nameEn,
      ...(card?.aliases || []),
    ];
    const entries = [
      ...(blogs || []).map((blog) => ({
        id: blog.id,
        kind: 'logbook',
        title: blog.title,
        editorial: blog.is_editorial,
        date: blog.date || blog.created_at,
        href: publicLogbookDetailPath(blog),
      })),
      ...reviews.map((review) => ({
        id: review.id,
        kind: 'review',
        title: review.title,
        editorial: review.is_editorial,
        date: review.created_at,
      })),
    ];
    return selectVisitStories(entries, names);
  }, [enabled, blogs, reviews, location, card]);

  return {
    stories,
    isLoading: enabled && (blogsLoading || reviewsLoading),
  };
}
