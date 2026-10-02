const SESSION_CACHE_KEY = 'gateo_trending_ranking_v1';
const FAIL_CACHE_KEY = 'gateo_trending_ranking_fail_v1';
const FAIL_BACKOFF_MS = 5 * 60 * 1000;

let memoryCache = null;
let inflight = null;

export function clearTrendingRankingMemoryCache() {
  memoryCache = null;
  inflight = null;
}

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

function readFailUntil() {
  try {
    const raw = sessionStorage.getItem(FAIL_CACHE_KEY);
    if (!raw) return 0;
    const until = Number(JSON.parse(raw)?.until);
    return Number.isFinite(until) ? until : 0;
  } catch {
    return 0;
  }
}

function writeFailUntil(now) {
  try {
    sessionStorage.setItem(
      FAIL_CACHE_KEY,
      JSON.stringify({ until: now + FAIL_BACKOFF_MS }),
    );
  } catch {
    // quota / private mode
  }
}

function clearFailUntil() {
  try {
    sessionStorage.removeItem(FAIL_CACHE_KEY);
  } catch {
    // quota / private mode
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
  const { supabase } = await import('../../../shared/api/supabase');
  const { TRAVEL_SPOTS } = await import('../data/travelSpots');
  const { buildSpotLookup, resolveTravelSpotFromPlaceId } = await import(
    '../../../utils/travelSpotResolve'
  );
  const spotLookup = buildSpotLookup(TRAVEL_SPOTS);

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
 * Failures are remembered for 5 minutes so a closed sheet does not refetch immediately.
 * @param {{ now?: number, fetchDb?: () => Promise<Array | null> }} [options]
 * @returns {Promise<Array | null>} null on error or insufficient data
 */
export async function fetchTrendingRankingCached(options = {}) {
  const now = options.now ?? Date.now();
  const fetchDb = options.fetchDb ?? fetchTrendingRankingFromDb;

  if (memoryCache?.length >= 3) return memoryCache;

  const fromSession = readSessionCache();
  if (fromSession) {
    memoryCache = fromSession;
    clearFailUntil();
    return fromSession;
  }

  if (readFailUntil() > now) return null;

  if (inflight) return inflight;

  inflight = fetchDb()
    .then((spots) => {
      if (!spots?.length) {
        writeFailUntil(now);
        return null;
      }
      clearFailUntil();
      writeSessionCache(spots);
      return spots;
    })
    .catch(() => {
      writeFailUntil(now);
      return null;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
