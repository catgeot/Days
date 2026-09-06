/**
 * 방문 place_stats → 검색 카드. AI 생성 없음(intro 캐시 hit만).
 */
import { supabase } from '../../../shared/api/supabase.js';
import { fetchPlaceChatIntroSummaryForLocation } from './placeChatIntro.js';
import {
  buildVisitedLookupTokens,
  isSafeVisitedSearchQuery,
  rowMatchesVisitedSearchQuery,
  visitedRowToSearchSpot,
} from './visitedPlaceSearch.js';

function postgrestQuoted(value) {
  return `"${String(value).replace(/"/g, '')}"`;
}

async function attachIntroDesc(spot) {
  if (!spot) return null;
  try {
    const summary = await fetchPlaceChatIntroSummaryForLocation(spot);
    if (!summary) return spot;
    return { ...spot, desc: summary };
  } catch {
    return spot;
  }
}

export async function lookupVisitedPlacesForSearch(query) {
  const q = String(query || '').trim();
  if (!isSafeVisitedSearchQuery(q)) return [];

  const tokens = buildVisitedLookupTokens(q);
  if (!tokens.length) return [];

  const clauses = [];
  for (const token of tokens) {
    const quoted = postgrestQuoted(token);
    clauses.push(`name_ko.eq.${quoted}`);
    clauses.push(`name_en.eq.${quoted}`);
    clauses.push(`place_id.eq.${quoted}`);
  }

  try {
    const { data, error } = await supabase
      .from('place_stats')
      .select('place_id, name_ko, name_en, lat, lng, image_url')
      .or(clauses.join(','))
      .limit(8);

    if (error || !Array.isArray(data) || data.length === 0) return [];

    const spots = [];
    const seen = new Set();
    for (const row of data) {
      if (!rowMatchesVisitedSearchQuery(row, q)) continue;
      const spot = visitedRowToSearchSpot(row);
      if (!spot) continue;
      const key = `${spot.slug || spot.name}|${Number(spot.lat).toFixed(2)}|${Number(spot.lng).toFixed(2)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      spots.push(spot);
    }

    if (!spots.length) return [];
    return Promise.all(spots.map((spot) => attachIntroDesc(spot)));
  } catch {
    return [];
  }
}
