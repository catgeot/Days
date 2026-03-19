import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase';

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
        const { data, error } = await supabase
          .from('reports')
          .select(`
            id,
            title,
            date,
            location,
            images,
            created_at,
            user_id
          `)
          .eq('is_public', true)
          .eq('is_deleted', false)
          .ilike('location', `%${locationName}%`)
          .order('date', { ascending: false })
          .limit(5);

        if (error) throw error;
        setBlogs(data || []);
      } catch (error) {
        console.error('Error fetching related blogs:', error);
        setBlogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, [locationName]);

  return { blogs, isLoading };
};
