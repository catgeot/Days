import { useState, useEffect } from 'react';
import { attachAuthorLabels } from '../../../pages/DailyReport/utils/reportAuthor';
import { fetchRelatedBlogRows } from './relatedBlogsQuery';
import { filterPlaceRelatedLogbookRows } from '../../../utils/placeRelatedLogbooks.js';

export const useRelatedBlogs = (locationName, placeKey = '') => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!locationName) {
      setBlogs([]);
      setIsLoading(false);
      return undefined;
    }

    setBlogs([]);
    setIsLoading(true);

    const fetchBlogs = async () => {
      try {
        const visible = await fetchRelatedBlogRows(locationName);
        if (cancelled) return;
        const rows = await attachAuthorLabels(visible);
        if (cancelled) return;
        setBlogs(filterPlaceRelatedLogbookRows(rows, locationName, placeKey));
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching related blogs:', error);
        setBlogs([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchBlogs();
    return () => {
      cancelled = true;
    };
  }, [locationName, placeKey]);

  return { blogs, isLoading };
};
