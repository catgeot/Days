import { TRAVEL_SPOTS } from '../pages/Home/data/travelSpots.js';
import { KEYWORD_SYNONYMS } from '../pages/Home/data/keywordData.js';
import {
  resolveTravelSpotFromSearchQuery,
  resolveTravelSpotFromLocation,
} from './travelSpotResolve.js';

const MOONI_PLACEHOLDERS = new Set(['', 'mooni', 'new session', 'scanning...']);

const VIBE_TERMS = ['조용', '한적', '고요', 'quiet', 'peaceful', '힐링', '느긋', '한가'];
const ISLAND_TERMS = ['섬', 'island', '아일랜드', '제도'];

const SCORE_GAP_FOR_SINGLE_WINNER = 8;

function removeSpaces(str) {
  return String(str ?? '').replace(/\s+/g, '').toLowerCase();
}

function isMooniPlaceholder(destination) {
  return MOONI_PLACEHOLDERS.has(String(destination ?? '').trim().toLowerCase());
}

function spotToCandidate(spot, score = 1, reason = 'lookup') {
  return {
    slug: spot.slug,
    name: spot.name,
    lat: spot.lat,
    lng: spot.lng,
    score,
    reason,
  };
}

function normalizeQueryFragment(fragment) {
  const trimmed = String(fragment ?? '').trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  return KEYWORD_SYNONYMS[lower] || KEYWORD_SYNONYMS[removeSpaces(lower)] || trimmed;
}

function looksLikeThemeQuery(text) {
  const lower = String(text ?? '').toLowerCase();
  const hasVibe = VIBE_TERMS.some((t) => lower.includes(t));
  const hasIsland = ISLAND_TERMS.some((t) => lower.includes(t));
  return hasVibe || hasIsland;
}

function buildHighResult(spot, score, source) {
  return {
    slug: spot.slug,
    name: spot.name,
    lat: spot.lat ?? null,
    lng: spot.lng ?? null,
    confidence: 'high',
    candidates: [spotToCandidate(spot, score, source)],
    source,
  };
}

function buildLowResult(candidates, source) {
  return {
    slug: null,
    name: null,
    lat: null,
    lng: null,
    confidence: 'low',
    candidates: candidates.slice(0, 3),
    source,
  };
}

function emptyResult() {
  return {
    slug: null,
    name: null,
    lat: null,
    lng: null,
    confidence: 'none',
    candidates: [],
    source: null,
  };
}

/** MOONi 등 slug 미바인딩 세션에서 목적지 해석이 필요한지 */
export function shouldResolveDestination(destination) {
  return true;
}

/**
 * 발화·히스토리에서 여행지 slug 후보를 해석한다 (홈 검색 SSOT 재사용).
 */
export function resolveDestinationFromChat(userText, chatHistory = [], currentDestination = '') {
  const bound = !isMooniPlaceholder(currentDestination)
    ? resolveTravelSpotFromLocation(currentDestination)?.spot
    : null;

  const currentText = String(userText ?? '').trim();
  if (!currentText) {
    return bound ? buildHighResult(bound, 10, 'bound') : emptyResult();
  }

  const currentDirect = resolveDirectHits(currentText);
  if (currentDirect.length === 1) {
    return buildHighResult(currentDirect[0].spot, currentDirect[0].score, 'lookup');
  }
  if (currentDirect.length > 1) {
    return buildLowResult(
      currentDirect.map(({ spot, score }) => spotToCandidate(spot, score, 'lookup')),
      'lookup'
    );
  }

  if (looksLikeThemeQuery(currentText)) {
    const themeCandidates = collectThemeCandidates(currentText);
    if (themeCandidates.length > 0) {
      return buildLowResult(themeCandidates, 'theme');
    }
  }

  const recentUser = chatHistory
    .filter((m) => m.role === 'user')
    .slice(-3)
    .map((m) => m.text ?? '')
    .filter(Boolean);
  const combined = [...recentUser, currentText].join(' ').trim();
  const combinedDirect = resolveDirectHits(combined);
  if (combinedDirect.length === 1) {
    return buildHighResult(combinedDirect[0].spot, combinedDirect[0].score, 'lookup');
  }
  if (combinedDirect.length > 1) {
    return buildLowResult(
      combinedDirect.map(({ spot, score }) => spotToCandidate(spot, score, 'lookup')),
      'lookup'
    );
  }

  if (bound) {
    return buildHighResult(bound, 10, 'bound');
  }

  return emptyResult();
}

function resolveDirectHits(text) {
  const hits = collectDirectLookupHits(text);
  if (hits.length <= 1) return hits;

  const sorted = [...hits].sort((a, b) => b.score - a.score);
  if (sorted[0].score >= sorted[1].score + SCORE_GAP_FOR_SINGLE_WINNER) {
    return [sorted[0]];
  }
  return sorted;
}

function collectDirectLookupHits(text) {
  const queries = extractLookupQueries(text);
  const bySlug = new Map();

  for (const query of queries) {
    const spot = resolveTravelSpotFromSearchQuery(query);
    if (!spot) continue;
    const score = query.length + 20;
    const prev = bySlug.get(spot.slug);
    if (!prev || score > prev.score) {
      bySlug.set(spot.slug, { spot, score });
    }
  }

  for (const spot of TRAVEL_SPOTS) {
    const names = [spot.name, spot.name_en, ...(spot.keywords || [])].filter(
      (n) => n && String(n).trim().length >= 2
    );
    for (const name of names) {
      if (!textIncludesPlaceName(text, name)) continue;
      const score = String(name).length + 15;
      const prev = bySlug.get(spot.slug);
      if (!prev || score > prev.score) {
        bySlug.set(spot.slug, { spot, score });
      }
    }
  }

  return [...bySlug.values()];
}

function extractLookupQueries(text) {
  const trimmed = String(text ?? '').trim();
  const out = new Set();
  if (!trimmed) return [];

  out.add(normalizeQueryFragment(trimmed));

  const patterns = [
    /(.+?)\s*(?:가고\s*싶|여행|가(?:려|고)|갈\s*거|추천|어때)/,
    /(.+?)가고?\s*싶/,
    /(?:가고\s*싶은\s*(?:곳|여행지)(?:은|가)?|목적지(?:는)?|어디(?:로|가)?)\s*(.+)/,
  ];
  for (const re of patterns) {
    const match = trimmed.match(re);
    if (match?.[1]?.trim()) {
      out.add(normalizeQueryFragment(match[1].trim()));
    }
  }

  const compact = removeSpaces(trimmed);
  if (KEYWORD_SYNONYMS[compact]) {
    out.add(KEYWORD_SYNONYMS[compact]);
  }

  return [...out].filter(Boolean);
}

function textIncludesPlaceName(haystack, needle) {
  const h = haystack.toLowerCase();
  const n = String(needle).trim().toLowerCase();
  if (!n || n.length < 2) return false;

  if (/^[a-z0-9\s-]+$/i.test(n)) {
    const re = new RegExp(`(?:^|[\\s,.!?])${escapeRegExp(n)}(?:$|[\\s,.!?])`, 'i');
    return re.test(haystack) || h.includes(n);
  }

  if (n.includes(' ')) {
    return h.includes(n);
  }

  const compactHay = removeSpaces(haystack);
  const compactNeedle = removeSpaces(n);
  if (compactNeedle.length >= 3 && compactHay.includes(compactNeedle)) {
    return true;
  }

  return h.includes(n);
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectThemeCandidates(text) {
  const lower = text.toLowerCase();
  const hasVibe = VIBE_TERMS.some((t) => lower.includes(t));
  const hasIsland = ISLAND_TERMS.some((t) => lower.includes(t));
  if (!hasVibe && !hasIsland) return [];

  const scored = [];
  for (const spot of TRAVEL_SPOTS) {
    const blob = [
      spot.name,
      spot.name_en,
      spot.desc,
      ...(spot.keywords || []),
      spot.primaryCategory,
      spot.category,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    let score = 0;
    if (hasVibe && VIBE_TERMS.some((t) => blob.includes(t))) score += 3;
    if (hasIsland && (ISLAND_TERMS.some((t) => blob.includes(t)) || blob.includes('섬'))) score += 2;
    if (hasVibe && hasIsland && score >= 4) score += 1;

    if (score >= 3) {
      scored.push(spotToCandidate(spot, score, 'theme'));
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
