import { supabase } from '../../../shared/api/supabase';
import { isReportsMissingColumnError } from '../../../utils/reportsSchemaFallback';
import { filterPublicLogbookFeedRows } from '../../../utils/logbookPublicFeed';
import { editorialLocationIlikePatterns } from '../../../utils/placeEditorialTravelogue';

export const RELATED_BLOGS_SELECT_LEGACY = `
  id,
  title,
  date,
  location,
  images,
  created_at,
  user_id
`;

export const RELATED_BLOGS_SELECT_EDITORIAL = `
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

export const EDITORIAL_TRAVELOGUE_SELECT = `
  id,
  title,
  dek,
  date,
  location,
  images,
  created_at,
  user_id,
  is_editorial,
  slug,
  status,
  place_slug,
  content
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

export async function fetchRelatedBlogRows(locationName) {
  let { data, error } = await buildRelatedBlogsQuery(RELATED_BLOGS_SELECT_EDITORIAL, locationName);

  if (error && isReportsMissingColumnError(error)) {
    const fallback = await buildRelatedBlogsQuery(RELATED_BLOGS_SELECT_LEGACY, locationName);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  return filterPublicLogbookFeedRows(data || []);
}

export async function fetchEditorialTraveloguesByPlaceSlug(placeSlug) {
  if (!placeSlug) return [];

  let { data, error } = await supabase
    .from('reports')
    .select(EDITORIAL_TRAVELOGUE_SELECT)
    .eq('is_public', true)
    .eq('is_deleted', false)
    .eq('is_editorial', true)
    .eq('status', 'published')
    .eq('place_slug', placeSlug)
    .order('date', { ascending: false })
    .limit(2);

  if (error && isReportsMissingColumnError(error)) {
    return [];
  }
  if (error) throw error;
  return filterPublicLogbookFeedRows(data || []);
}

function quotePostgrestIlike(pattern) {
  return `"${String(pattern).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export async function fetchEditorialTraveloguesByLocationName(locationName) {
  const patterns = editorialLocationIlikePatterns(locationName);
  if (!patterns.length) return [];

  const orFilter = patterns.map((pattern) => `location.ilike.${quotePostgrestIlike(pattern)}`).join(',');
  let { data, error } = await supabase
    .from('reports')
    .select(EDITORIAL_TRAVELOGUE_SELECT)
    .eq('is_public', true)
    .eq('is_deleted', false)
    .eq('is_editorial', true)
    .eq('status', 'published')
    .or(orFilter)
    .order('date', { ascending: false })
    .limit(20);

  if (error && isReportsMissingColumnError(error)) return [];
  if (error) throw error;
  return filterPublicLogbookFeedRows(data || []);
}
