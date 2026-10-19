import { useState, useEffect } from 'react';
import { attachAuthorLabels } from '../../../pages/DailyReport/utils/reportAuthor';
import { fetchRelatedBlogRows } from './relatedBlogsQuery';

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
