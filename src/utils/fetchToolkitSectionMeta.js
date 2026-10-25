import { buildSectionMetaMap } from '../data/toolkitFreshness/policy.js';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string | null | undefined} placeId
 * @returns {Promise<Record<string, object> | null>}
 */
export async function fetchToolkitSectionMetaMap(supabase, placeId) {
  const key = String(placeId || '').trim();
  if (!key) return {};

  const { data, error } = await supabase
    .from('place_toolkit_section_meta')
    .select('section, checked_at, source_urls, status')
    .eq('place_id', key);

  if (error) {
    if (import.meta.env?.DEV) {
      console.warn('[fetchToolkitSectionMeta] section meta unavailable', error.message);
    }
    return null;
  }

  return buildSectionMetaMap(data || []);
}
