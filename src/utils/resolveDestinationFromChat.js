import { TRAVEL_SPOTS } from '../pages/Home/data/travelSpots.js';
import { KEYWORD_SYNONYMS } from '../pages/Home/data/keywordData.js';
import {
  resolveTravelSpotFromSearchQuery,
  resolveTravelSpotFromLocation,
} from './travelSpotResolve.js';
export { resolveDepartureLabelFromChat } from './resolveDepartureIataFromChat.js';

const MOONI_PLACEHOLDERS = new Set(['', 'mooni', 'new session', 'scanning...']);

const VIBE_TERMS = ['조용', '한적', '고요', 'quiet', 'peaceful', '힐링', '느긋', '한가'];
const ISLAND_TERMS = ['섬', 'island', '아일랜드', '제도'];

/** 출발지·경로 질문 — 「서울에서 어떻게 가?」 등은 목적지 재해석하지 않음 */
const ACCESS_ROUTE_QUERY =
  /어떻게\s*가|가는\s*(?:길|방법|법)|교통편|이동\s*(?:방법|수단)|how\s*to\s*get/i;

/** 출발 허브 — access_route·ferry·출발 직접입력 시 목적지 재바인딩에서 제외 */
const DEPARTURE_HUB_SLUGS = new Set([
  'seoul',
  'incheon',
  'busan',
  'jeju',
  'kimpo',
  'lombok',
  'bali',
  'manila',
  'singapore',
  'bangkok',
  'london',
  'tokyo',
  'osaka',
  'hong-kong',
  'taipei',
  'kuala-lumpur',
  'jakarta',
  'sydney',
  'melbourne',
  'auckland',
  'dubai',
  'paris',
  'frankfurt',
  'los-angeles',
  'new-york',
]);

/** MOONi 「가는 방법」직접입력 — 출발지만 적은 짧은 발화 */
const DEPARTURE_ONLY_FRAGMENT =
  /^[\p{L}\p{N}\s.'-]{1,40}$/u;

const EN_DEST_QUERY_PATTERNS = [
  /(?:want to|wanna|plan(?:ning)? to|going to|travel(?:ing)? to|trip to|visit(?:ing)?)\s+(.+)/i,
  /(?:destination(?: is|:)?|where(?: should I| to)? go(?: for a trip)?)\s+(.+)/i,
];

const ALREADY_ACCESS_SHAPED_KO =
  /(?:에서\s*어떻게|어떻게\s*가|가는\s*(?:길|방법))/iu;

const ALREADY_ACCESS_SHAPED_EN =
  /(?:how\s*to\s*get|getting\s*to|from\s+[\p{L}])/iu;

const SCORE_GAP_FOR_SINGLE_WINNER = 8;

const KOREAN_PLACE_TRAILING_PARTICLE =
  /(?:으로|로|에|은|는|이|가|와|과|랑|하고|에서|까지|부터|을|를|의|도|만)$/u;

/** spot.keywords 부분일치 금지 — 「역사나 문화적으로…」→ 로마·베를린·델리 오탐 */
const GENERIC_KEYWORD_MATCH_BLOCKLIST = new Set(
  [
    '역사',
    '문화',
    '자연',
    '휴양',
    '액티비티',
    '낭만',
    '도시',
    '모험',
    '섬',
    '여행',
    '관광',
  ].map((k) => k.replace(/\s+/g, '').toLowerCase())
);

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

function stripPlaceQueryParticles(fragment) {
  let s = String(fragment ?? '').trim();
  for (let i = 0; i < 3 && s; i += 1) {
    const next = s.replace(KOREAN_PLACE_TRAILING_PARTICLE, '').trim();
    if (next === s) break;
    s = next;
  }
  return s;
}

function stripPlaceQueryForLookup(query) {
  const normalized = normalizeQueryFragment(query);
  const stripped = stripPlaceQueryParticles(normalized);
  return stripped || normalized;
}

function sortHitsByTextOrder(text, hits) {
  const hay = String(text ?? '');
  const order = (hit) => {
    const labels = [hit.spot?.name, hit.spot?.name_en].filter(Boolean);
    let best = hay.length + 1;
    for (const label of labels) {
      const idx = hay.indexOf(String(label).trim());
      if (idx >= 0 && idx < best) best = idx;
    }
    return best;
  };
  return [...hits].sort((a, b) => order(a) - order(b) || b.score - a.score);
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

export function isAccessRouteQuery(text) {
  return ACCESS_ROUTE_QUERY.test(String(text ?? '').trim());
}

/**
 * bound + 「가는 방법」출발 직접입력: 「마닐라」→「마닐라에서 어떻게 가?」 (목적지 오인 방지)
 *
 * @param {string} text
 * @param {{ accessDockActive?: boolean, locale?: string }} [options]
 */
export function normalizeAccessDepartureUserText(
  text,
  { accessDockActive = false, locale = 'ko' } = {},
) {
  const trimmed = String(text ?? '').trim();
  if (!accessDockActive || !trimmed) return trimmed;
  if (isAccessRouteQuery(trimmed) || isFerryRouteQuery(trimmed)) return trimmed;
  const isEn = String(locale).slice(0, 2).toLowerCase() === 'en';
  if (isEn ? ALREADY_ACCESS_SHAPED_EN.test(trimmed) : ALREADY_ACCESS_SHAPED_KO.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.length > 48 || trimmed.includes('?')) return trimmed;
  if (!DEPARTURE_ONLY_FRAGMENT.test(trimmed)) return trimmed;
  return isEn ? `how to get from ${trimmed}?` : `${trimmed}에서 어떻게 가?`;
}

/** 페리·배 출발지 질문 — 「롬복에서 배」 등은 bound slug 유지 */
const FERRY_ROUTE_QUERY =
  /(?:페리|ferry|쾌속선|보트|speedboat|배\s*티켓|(?:에서|→)\s*배(?:\s|$|[?!.]))/i;

export function isFerryRouteQuery(text) {
  return FERRY_ROUTE_QUERY.test(String(text ?? '').trim());
}

/**
 * trip destination + confirmedDestination 메시지에서 세션 바인딩 slug를 복원한다.
 */
export function resolveSessionBoundSpot(currentDestination = '', chatHistory = []) {
  if (!isMooniPlaceholder(currentDestination)) {
    const fromTrip = resolveTravelSpotFromLocation(currentDestination)?.spot;
    if (fromTrip) return fromTrip;
  }

  for (let i = chatHistory.length - 1; i >= 0; i -= 1) {
    const confirmed = chatHistory[i]?.confirmedDestination;
    if (!confirmed?.slug) continue;
    const fromSlug = TRAVEL_SPOTS.find((s) => s.slug === confirmed.slug);
    if (fromSlug) return fromSlug;
    const fromName = resolveTravelSpotFromLocation(confirmed.name)?.spot;
    if (fromName) return fromName;
  }

  return null;
}

function isDepartureHubSpot(spot) {
  if (!spot?.slug) return false;
  return DEPARTURE_HUB_SLUGS.has(String(spot.slug).toLowerCase());
}

function filterDepartureHubs(resolved, excludeDeparture) {
  if (!excludeDeparture) return resolved;
  return {
    ...resolved,
    hits: resolved.hits.filter(({ spot }) => !isDepartureHubSpot(spot)),
  };
}

/**
 * 발화·히스토리에서 여행지 slug 후보를 해석한다 (홈 검색 SSOT 재사용).
 */
export function resolveDestinationFromChat(userText, chatHistory = [], currentDestination = '') {
  const sessionBound = resolveSessionBoundSpot(currentDestination, chatHistory);

  const currentText = String(userText ?? '').trim();
  const accessRoute = isAccessRouteQuery(currentText);
  const ferryRoute = isFerryRouteQuery(currentText);
  const excludeDepartureHub =
    accessRoute ||
    (sessionBound && ferryRoute) ||
    (sessionBound && DEPARTURE_ONLY_FRAGMENT.test(currentText) && !looksLikeThemeQuery(currentText));

  if (!currentText) {
    return sessionBound ? buildHighResult(sessionBound, 10, 'bound') : emptyResult();
  }

  if (sessionBound && (accessRoute || ferryRoute)) {
    return buildHighResult(sessionBound, 10, 'bound');
  }

  const currentResolved = filterDepartureHubs(
    resolveDirectHits(currentText),
    excludeDepartureHub,
  );
  if (currentResolved.overflow) {
    return buildLowResult([], 'lookup');
  }
  if (currentResolved.hits.length === 1) {
    return buildHighResult(
      currentResolved.hits[0].spot,
      currentResolved.hits[0].score,
      'lookup',
    );
  }
  if (currentResolved.hits.length > 1) {
    return buildLowResult(
      currentResolved.hits.map(({ spot, score, reason }) =>
        spotToCandidate(spot, score, reason || 'lookup'),
      ),
      'lookup',
    );
  }

  if (accessRoute && sessionBound) {
    return buildHighResult(sessionBound, 10, 'bound');
  }
  if (accessRoute) {
    return emptyResult();
  }

  if (looksLikeThemeQuery(currentText)) {
    return emptyResult();
  }

  // bound 세션 — 이번 턴 질문에 새 목적지가 없을 때만 유지 (출발지·가는법은 위에서 처리)
  if (sessionBound) {
    return buildHighResult(sessionBound, 10, 'bound');
  }

  return emptyResult();
}

function resolveDirectHits(text) {
  const raw = collectDirectLookupHits(text);
  const nameHits = raw.filter((h) => h.reason === 'name' || h.reason === 'query');

  if (nameHits.length > 3) {
    return { hits: [], overflow: true };
  }

  const pool =
    nameHits.length > 0 ? sortHitsByTextOrder(text, nameHits) : [...raw].sort((a, b) => b.score - a.score);

  if (pool.length <= 1) {
    return { hits: pool, overflow: false };
  }

  if (nameHits.length > 0) {
    return { hits: pool.slice(0, 3), overflow: false };
  }

  if (pool[0].score >= pool[1].score + SCORE_GAP_FOR_SINGLE_WINNER) {
    return { hits: [pool[0]], overflow: false };
  }
  return { hits: pool.slice(0, 3), overflow: false };
}

function collectDirectLookupHits(text) {
  const queries = extractLookupQueries(text);
  const bySlug = new Map();

  for (const query of queries) {
    const lookupQuery = stripPlaceQueryForLookup(query);
    const spot = resolveTravelSpotFromSearchQuery(lookupQuery);
    if (!spot) continue;
    const score = lookupQuery.length + 20;
    const prev = bySlug.get(spot.slug);
    if (!prev || score > prev.score) {
      bySlug.set(spot.slug, { spot, score, reason: 'query' });
    }
  }

  for (const spot of TRAVEL_SPOTS) {
    const names = [spot.name, spot.name_en].filter((n) => n && String(n).trim().length >= 1);
    for (const name of names) {
      if (!textIncludesPlaceName(text, name)) continue;
      const score = Math.max(String(name).length, 1) + 15;
      const prev = bySlug.get(spot.slug);
      if (!prev || score > prev.score || prev.reason === 'keyword') {
        bySlug.set(spot.slug, { spot, score, reason: 'name' });
      }
    }
    const hasNameHit = bySlug.get(spot.slug)?.reason === 'name';
    if (hasNameHit) continue;
    if (looksLikeThemeQuery(text)) continue;
    for (const kw of spot.keywords || []) {
      const compact = String(kw ?? '').replace(/\s+/g, '').toLowerCase();
      if (!compact || compact.length < 2) continue;
      if (GENERIC_KEYWORD_MATCH_BLOCKLIST.has(compact)) continue;
      if (!textIncludesPlaceName(text, kw)) continue;
      const score = String(kw).length + 12;
      const prev = bySlug.get(spot.slug);
      if (!prev || score > prev.score) {
        bySlug.set(spot.slug, { spot, score, reason: 'keyword' });
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
  out.add(stripPlaceQueryForLookup(trimmed));

  const patterns = [
    /(.+?)\s*(?:가고\s*싶|여행|가(?:려|고)|갈\s*거|추천|어때)/,
    /(.+?)가고?\s*싶/,
    /(?:가고\s*싶은\s*(?:곳|여행지)(?:은|가)?|목적지(?:는)?|어디(?:로|가)?)\s*(.+)/,
    ...EN_DEST_QUERY_PATTERNS,
  ];
  for (const re of patterns) {
    const match = trimmed.match(re);
    if (match?.[1]?.trim()) {
      const frag = match[1].trim();
      out.add(normalizeQueryFragment(frag));
      out.add(stripPlaceQueryForLookup(frag));
    }
  }

  const compact = removeSpaces(trimmed);
  if (KEYWORD_SYNONYMS[compact]) {
    out.add(KEYWORD_SYNONYMS[compact]);
  }

  return [...out].filter(Boolean);
}

function textIncludesSingleCharPlaceName(haystack, char) {
  const ch = String(char ?? '').trim();
  if (!ch || ch.length !== 1) return false;
  const esc = escapeRegExp(ch);
  if (new RegExp(`(?:^|[·])${esc}(?:[·]|$)`, 'u').test(haystack)) return true;
  if (
    new RegExp(
      `(?:^|[\\s·,，、.!?])${esc}(?:으로|로|에|은|는|이|가|와|과|랑|이랑|하고|에서)(?=$|[\\s·,，、.!?])`,
      'u',
    ).test(haystack)
  ) {
    return true;
  }
  if (new RegExp(`(?:^|[\\s·,，、.!?])${esc}$`, 'u').test(haystack.trim())) return true;
  if (
    new RegExp(
      `(?:^|[\\s·,，、.!?])${esc}\\s+(?:여행|trip|travel|vacation|holiday)`,
      'iu',
    ).test(haystack)
  ) {
    return true;
  }
  return false;
}

function isCebuGenericDetailUsage(haystack) {
  const h = String(haystack ?? '');
  if (/세부\s*(?:일정|내용|사항|계획|안|설명|항목|정보|내역|스케줄|리스트)/u.test(h)) {
    return true;
  }
  if (/(?:시간별|일별|주별|코스별|동선별|일정별|분(?:별|당)|시(?:간|점)별)\s+세부/u.test(h)) {
    return true;
  }
  return false;
}

function textIncludesCebuPlaceName(haystack) {
  const h = String(haystack ?? '');
  if (isCebuGenericDetailUsage(h)) return false;
  if (/(?:^|[\s·,，、.!?])세부(?:으로|로|에|에서|와|과|랑|이랑)(?=$|[\s·,，、.!?])/u.test(h)) {
    return true;
  }
  if (/(?:^|[\s·,，、.!?])세부\s+(?:여행|관광|자유여행|휴양|배낭)/u.test(h)) {
    return true;
  }
  if (/(?:^|[·])세부(?:[·]|$)/u.test(h)) return true;
  if (/(?:^|[\s·,，、.!?])세부(?=$|[\s·,，、.!?])/u.test(h.trim())) return true;
  return false;
}

function textIncludesPlaceName(haystack, needle) {
  const h = haystack.toLowerCase();
  const n = String(needle).trim().toLowerCase();
  if (!n) return false;
  if (removeSpaces(n) === '세부') {
    return textIncludesCebuPlaceName(haystack);
  }
  if (n.length === 1 && /[\uac00-\ud7a3]/u.test(n)) {
    return textIncludesSingleCharPlaceName(haystack, needle.trim());
  }
  if (n.length < 2) return false;

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
