import { curatedPlaceGallery } from '../../../data/curatedPlaceGalleries.js';
import { pickImageFromPlaceStatsRows } from '../../DailyReport/lib/curationImageResolve.js';
import { buildPlaceDbIdCandidates } from '../../../utils/travelSpotResolve.js';
import { resolveListImageUrl } from '../../../utils/listImageUrl.js';

/**
 * Place cards with no photo use a category gradient and no bitmap
 * (SpotThumbnailCard). This card's empty destination tile is the same idea
 * without a wordmark: slate gradient, no text or logo.
 */
export const HOME_WATCH_CONTINUE_FALLBACK_CLASS =
  'absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950';

const PLACE_STATS_QUERY_MS = 8_000;
const LIST_PHOTO_WIDTH = 480;

/**
 * Recent-history rows store a name and slug only. The continue slot resolves
 * the representative photo the same way a place card thumbnail does:
 * slug-locked curated gallery first (an empty lock stays empty), otherwise
 * a read-only place_stats image_url / gallery_urls[0]. No gallery persist.
 * @param {string} slug
 * @returns {{ kind: 'skip' | 'lookup' | 'photo' | 'empty', imageUrl: string }}
 */
export function resolveHomeWatchContinueLockedPhoto(slug) {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return { kind: 'skip', imageUrl: '' };
  const curated = curatedPlaceGallery(key);
  if (!curated) return { kind: 'lookup', imageUrl: '' };
  const imageUrl = curated
    .map((image) => String(image?.urls?.regular || image?.urls?.small || '').trim())
    .find(Boolean) || '';
  return imageUrl ? { kind: 'photo', imageUrl } : { kind: 'empty', imageUrl: '' };
}

export function continuePlaceSlugFromHref(href) {
  const match = String(href || '').trim().match(/^\/place\/([^/?#]+)/);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]).trim();
  } catch {
    return match[1].trim();
  }
}

export function homeWatchContinueDisplayUrl(imageUrl) {
  return resolveListImageUrl(imageUrl, { role: 'list', width: LIST_PHOTO_WIDTH });
}

async function defaultPlaceStatsQuery(candidates) {
  const ids = [...new Set(candidates.map((id) => String(id || '').trim()).filter(Boolean))].slice(0, 8);
  if (!ids.length) return [];
  const { supabase } = await import('../../../shared/api/supabase.js');
  const { data, error } = await supabase
    .from('place_stats')
    .select('place_id, image_url, gallery_urls')
    .in('place_id', ids)
    .limit(8);
  if (error) {
    const failure = new Error(error.message || 'place_stats continue photo');
    failure.cause = error;
    throw failure;
  }
  return Array.isArray(data) ? data : [];
}

/**
 * @param {string} slug
 * @param {(candidates: string[]) => Promise<object[]>} [query]
 * @returns {Promise<string>} representative URL, or '' when the place has none
 */
export async function fetchHomeWatchContinuePlacePhoto(slug, query = defaultPlaceStatsQuery) {
  const locked = resolveHomeWatchContinueLockedPhoto(slug);
  if (locked.kind === 'photo') return locked.imageUrl;
  if (locked.kind !== 'lookup') return '';

  const candidates = buildPlaceDbIdCandidates({ slug: String(slug || '').trim() });
  let timer;
  const pending = Promise.resolve().then(() => query(candidates));
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('place_stats continue photo timeout')), PLACE_STATS_QUERY_MS);
  });
  try {
    const rows = await Promise.race([pending, timeout]);
    return pickImageFromPlaceStatsRows(rows, candidates).imageUrl || '';
  } finally {
    clearTimeout(timer);
    void pending.catch(() => {});
  }
}
