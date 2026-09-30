import { supabase } from '../../../shared/api/supabase';
import { TRAVEL_SPOTS } from '../data/travelSpots';
import { buildSpotLookup, resolveTravelSpotFromPlaceId } from '../../../utils/travelSpotResolve';

const spotLookup = buildSpotLookup(TRAVEL_SPOTS);

const SESSION_CACHE_KEY = 'gateo_trending_ranking_v1';

let memoryCache = null;
let inflight = null;

function readSessionCache() {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.spots) || parsed.spots.length < 3) return null;
    return parsed.spots;
  } catch {
    return null;
  }
}

function writeSessionCache(spots) {
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ spots, at: Date.now() }));
  } catch {
    // quota / private mode
  }
  memoryCache = spots;
}

/**
 * @returns {Promise<Array<{ rank: number, score?: number, ... }> | null>}
 */
export async function fetchTrendingRankingFromDb() {
  const { data, error } = await supabase
    .from('place_stats')
    .select('place_id, total_score')
    .order('total_score', { ascending: false })
    .limit(30);

  if (error) throw error;
  if (!data?.length) return null;

  const validSpots = data
    .map((row) => {
      const resolved = resolveTravelSpotFromPlaceId(spotLookup, TRAVEL_SPOTS, row.place_id);
      if (!resolved?.spot) return null;
      return { ...resolved.spot, score: row.total_score };
    })
    .filter(Boolean);

  if (validSpots.length < 3) return null;

  return validSpots.slice(0, 10).map((spot, index) => ({
    ...spot,
    rank: index + 1,
  }));
}

/**
 * Session-cached ranking for explore sheet (one network round-trip per session).
 * @returns {Promise<Array | null>} null on error or insufficient data
 */
export async function fetchTrendingRankingCached() {
  if (memoryCache?.length >= 3) return memoryCache;

  const fromSession = readSessionCache();
  if (fromSession) {
    memoryCache = fromSession;
    return fromSession;
  }

  if (inflight) return inflight;

  inflight = fetchTrendingRankingFromDb()
    .then((spots) => {
      if (!spots?.length) return null;
      writeSessionCache(spots);
      return spots;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
