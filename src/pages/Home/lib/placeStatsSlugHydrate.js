/**
 * place_stats 행 — 한글 place_id URL (/place/흥정계곡) 복원.
 */
import { supabase } from '../../../shared/api/supabase.js';
import { visitedRowToSearchSpot } from './visitedPlaceSearch.js';

const HANGUL_PLACE_SLUG_RE = /[\uAC00-\uD7A3]/;

export function isHangulPlaceStatsSlug(slug) {
  const raw = String(slug ?? '').trim();
  return Boolean(raw) && HANGUL_PLACE_SLUG_RE.test(raw);
}

function postgrestQuoted(value) {
  return `"${String(value).replace(/"/g, '')}"`;
}

/**
 * @param {string} slug — URL segment (decoded)
 * @returns {Promise<object | null>}
 */
export async function fetchUiPlacePinFromPlaceStatsSlug(slug) {
  const raw = String(slug ?? '').trim();
  if (!raw || !isHangulPlaceStatsSlug(raw)) return null;

  const quoted = postgrestQuoted(raw);
  try {
    const { data: byId, error: idError } = await supabase
      .from('place_stats')
      .select('place_id, name_ko, name_en, lat, lng, image_url')
      .eq('place_id', raw)
      .maybeSingle();
    if (!idError && byId) {
      const spot = visitedRowToSearchSpot(byId);
      if (spot) {
        return {
          ...spot,
          slug: raw,
          canonical_slug: raw,
          place_id: raw,
        };
      }
    }

    const { data: byName, error: nameError } = await supabase
      .from('place_stats')
      .select('place_id, name_ko, name_en, lat, lng, image_url')
      .eq('name_ko', raw)
      .maybeSingle();
    if (!nameError && byName) {
      const placeId = String(byName.place_id || raw).trim();
      const spot = visitedRowToSearchSpot(byName);
      if (spot) {
        return {
          ...spot,
          slug: placeId,
          canonical_slug: placeId,
          place_id: placeId,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}
