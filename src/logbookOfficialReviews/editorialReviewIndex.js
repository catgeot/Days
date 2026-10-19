import { LOGBOOK_OFFICIAL_REVIEWER_DROPDOWN_ORDER } from './constants.js';

export const EDITORIAL_REVIEW_INDEX_SELECT =
  'id, place_slug, place_name, persona_label, content, images, created_at, is_public';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {{ limit?: number }} [options]
 */
export async function fetchEditorialReviewIndex(client, { limit = 500 } = {}) {
  const { data, error } = await client
    .from('place_reviews')
    .select(EDITORIAL_REVIEW_INDEX_SELECT)
    .eq('is_editorial', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }
  return data ?? [];
}

/** @param {Iterable<string>} labelsFromData */
export function sortPersonaLabelsForDropdown(labelsFromData) {
  const unique = [...new Set(labelsFromData.map((l) => String(l || '').trim()).filter(Boolean))];
  const rank = new Map(LOGBOOK_OFFICIAL_REVIEWER_DROPDOWN_ORDER.map((label, index) => [label, index]));
  return unique.sort((a, b) => {
    const ra = rank.has(a) ? rank.get(a) : 1000;
    const rb = rank.has(b) ? rank.get(b) : 1000;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, 'ko');
  });
}

/** @param {Array<{ persona_label?: string | null }>} rows */
export function countPersonaLabels(rows) {
  const counts = {};
  for (const row of rows) {
    const key = String(row?.persona_label || '').trim() || '(empty)';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}
