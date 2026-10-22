import { useState, useEffect } from 'react';
import { attachAuthorLabels } from '../../../pages/DailyReport/utils/reportAuthor';
import { fetchRelatedBlogRows } from './relatedBlogsQuery';

function relatedRowMatchesPlace(row, locationName, placeKey) {
  const slug = String(row?.place_slug || '').trim();
  const key = String(placeKey || '').trim();
  if (slug && key && slug !== key) return false;
  const name = String(locationName || '').trim();
  if (!name) return false;
  const loc = String(row?.location || '').trim();
  if (!loc) return false;
  const segments = loc.split(/[,/|·•、，;]+/).map((part) => part.trim()).filter(Boolean);
  return (segments.length ? segments : [loc]).some(
    (segment) => segment === name || segment.startsWith(`${name} `) || segment.startsWith(`${name}(`),
  );
}

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
        setBlogs(
          placeKey
            ? rows.filter((row) => relatedRowMatchesPlace(row, locationName, placeKey))
            : rows,
        );
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
