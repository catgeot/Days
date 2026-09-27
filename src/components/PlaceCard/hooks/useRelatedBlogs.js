import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { attachAuthorLabels } from '../../../pages/DailyReport/utils/reportAuthor';
import { isReportsMissingColumnError } from '../../../utils/reportsSchemaFallback';
import { filterPublicLogbookFeedRows } from '../../../utils/logbookPublicFeed';

const RELATED_BLOGS_SELECT_LEGACY = `
  id,
  title,
  date,
  location,
  images,
  created_at,
  user_id
`;

const RELATED_BLOGS_SELECT_EDITORIAL = `
  id,
  title,
  date,
  location,
  images,
  created_at,
  user_id,
  is_editorial,
  slug,
  status
`;

function buildRelatedBlogsQuery(selectList, locationName) {
  return supabase
    .from('reports')
    .select(selectList)
    .eq('is_public', true)
    .eq('is_deleted', false)
    .ilike('location', `%${locationName}%`)
    .order('date', { ascending: false })
    .limit(5);
}

async function fetchRelatedBlogRows(locationName) {
  let { data, error } = await buildRelatedBlogsQuery(RELATED_BLOGS_SELECT_EDITORIAL, locationName);

  if (error && isReportsMissingColumnError(error)) {
    const fallback = await buildRelatedBlogsQuery(RELATED_BLOGS_SELECT_LEGACY, locationName);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  return filterPublicLogbookFeedRows(data || []);
}

export const useRelatedBlogs = (locationName) => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      if (!locationName) {
        setBlogs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const visible = await fetchRelatedBlogRows(locationName);
        const rows = await attachAuthorLabels(visible);
        setBlogs(rows);
      } catch (error) {
        console.error('Error fetching related blogs:', error);
        setBlogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchBlogs();
  }, [locationName]);

  return { blogs, isLoading };
};
