import { buildGygActivitiesSearchQuery } from '../../components/PlaceCard/tabs/planner/locationRules.js';
import {
  filterRelevantMrtTnas,
  scoreMrtTnaRelevance,
} from '../../utils/mrtTnaRelevance.js';
import { resolveMrtTnaQuery } from '../../utils/mrtTnaQuery.js';
import { getLocalizedPlaceName } from '../../components/PlaceCard/common/locationDisplay.js';
const TOUR_KEYWORD_HINT_RE =
  /(스노클|다이빙|호핑|투어|티켓|패키지|market|tour|hop|diving|snorkel|cruise|ticket|island|kayak|rafting)/i;

/** 회귀(QA): 카오락·엘니도 등 해외 허브 — 액티비티 키워드 힌트 */
const TOUR_ACTIVITY_ALIASES_BY_SLUG = {
  bangkok: [
    '수상시장',
    'floating market',
    'damnoen saduak',
    'amphawa',
    'saduak',
    'chaophraya',
  ],
  'khao-lak': [
    '시미란',
    'similan',
    '심일란',
    'surin',
    '팡아',
    'phang nga',
    'phangnga',
    '카오락',
    'khao lak',
  ],
  'el-nido': ['island hopping', '아일랜드', '호핑', 'bacuit', '팔라완', 'palawan', 'el nido'],
  phuket: ['피피', 'phi phi', 'james bond', '팡아', 'phang nga'],
};

const TOUR_GENERIC_REGION_TOKENS = new Set([
  'island',
  'islands',
  'hopping',
  'tour',
  'tours',
  'ticket',
  'tickets',
  'package',
  'packages',
  'activity',
  'activities',
  'day',
  'trip',
  'cruise',
  'diving',
  'snorkel',
  'snorkeling',
  'kayak',
  'rafting',
  'market',
  'hop',
]);

function escapeRegExp(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function minQueryTokenLength(token) {
  const text = String(token || '').trim();
  if (/[가-힣]/.test(text)) return 2;
  return 3;
}

function compact(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function labelTokens(region) {
  const parts = [
    region?.name,
    region?.name_en,
    region?.name_ko,
    region?.country,
    region?.country_en,
    region?.slug?.replace(/-/g, ' '),
  ];
  const out = new Set();
  for (const part of parts) {
    const text = String(part || '').trim();
    if (!text) continue;
    for (const token of text.split(/[\s/·,]+/)) {
      const t = token.trim();
      if (t.length >= 2) out.add(compact(t));
    }
    out.add(compact(text));
  }
  return out;
}

/**
 * @param {string} label
 * @param {string} token
 */
function wordMatchesLabel(label, token) {
  const hay = String(label || '').trim();
  const needle = String(token || '').trim();
  if (!hay || !needle) return false;
  if (needle.length < minQueryTokenLength(needle)) {
    const re = new RegExp(`(?:^|[\\s/'(-])${escapeRegExp(needle)}(?:$|[\\s/'(-])`, 'i');
    return re.test(hay);
  }
  const re = new RegExp(`(?:^|[\\s/'(-])${escapeRegExp(needle)}(?:$|[\\s/'(-])`, 'i');
  if (re.test(hay)) return true;
  return compact(hay).startsWith(compact(needle));
}

/**
 * @param {unknown} requestedKeyword
 * @param {object | null | undefined} location
 * @param {object[]} [items]
 */
export function resolveTourActivityListing(requestedKeyword, location, items = null) {
  const keyword = String(requestedKeyword || '').trim();
  if (!keyword) {
    return { keywordMatched: true, usedFallbackListing: false, items: items || [] };
  }
  if (Array.isArray(items)) {
    const relevant = filterRelevantMrtTnas(items, keyword, location);
    if (relevant.length > 0) {
      return {
        keywordMatched: true,
        usedFallbackListing: false,
        items: relevant,
      };
    }
    return {
      keywordMatched: false,
      usedFallbackListing: items.length > 0,
      items: [],
    };
  }
  return {
    keywordMatched: tourActivityKeywordLikelyMatches(location, keyword),
    usedFallbackListing: false,
    items: [],
  };
}

/**
 * GYG·커밋 시점 휴리스틱 — MRT는 fetch 후 resolveTourActivityListing으로 덮어씀.
 * @param {object | null | undefined} location
 * @param {unknown} keyword
 */
export function tourActivityKeywordLikelyMatches(location, keyword) {
  const kw = String(keyword || '').trim();
  if (!kw) return true;

  const slug = String(location?.slug || '').trim().toLowerCase();
  const aliasCorpus = (TOUR_ACTIVITY_ALIASES_BY_SLUG[slug] || []).join(' ');
  const corpus = [
    location?.name,
    location?.name_en,
    location?.name_ko,
    getLocalizedPlaceName(location, 'ko'),
    getLocalizedPlaceName(location, 'en'),
    buildGygActivitiesSearchQuery(location),
    resolveMrtTnaQuery(location)?.keyword,
    ...(resolveMrtTnaQuery(location)?.nearbyKeywords || []),
    ...(resolveMrtTnaQuery(location)?.altKeywords || []),
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .join(' ');
  const mergedCorpus = [corpus, aliasCorpus].filter(Boolean).join(' ');

  if (mergedCorpus && filterRelevantMrtTnas([{ itemName: mergedCorpus }], kw).length > 0) {
    return true;
  }

  const tokens = kw
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  const meaningful = tokens.filter((t) => !TOUR_KEYWORD_HINT_RE.test(t));
  const scan = meaningful.length ? meaningful : tokens;

  for (const token of scan) {
    if (scoreMrtTnaRelevance(mergedCorpus, token) >= 3) return true;
    for (const label of mergedCorpus.split(/\s+/)) {
      if (wordMatchesLabel(label, token)) return true;
    }
  }

  if (aliasCorpus && compact(aliasCorpus).includes(compact(kw)) && kw.length >= 2) {
    return true;
  }

  return false;
}

function tourSearchTokens(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** 한글 2자+ 또는 라틴 활동/장소형 토큰 — 무의미 fallback 억제 */
function tourActivitySearchTokenLooksPlausible(token) {
  const t = String(token || '').trim();
  if (!t) return false;
  if (TOUR_KEYWORD_HINT_RE.test(t)) return true;
  if (/^[가-힣]{2,}$/.test(t)) return true;
  if (/^[a-zA-Z]{3,}$/.test(t) && /[aeiouAEIOU]/.test(t)) return true;
  if (/^[a-zA-Z]{5,}$/.test(t)) return true;
  return false;
}

function tourActivitySearchTextLooksPlausible(text) {
  const raw = String(text || '').trim();
  if (!raw) return false;
  if (TOUR_KEYWORD_HINT_RE.test(raw)) return true;
  for (const token of tourSearchTokens(raw)) {
    if (tourActivitySearchTokenLooksPlausible(token)) return true;
  }
  return false;
}

/** zzqx 등 — 라틴 자음 덩어리·너무 짧은 영문 잡음 */
function tourActivitySearchTokenLooksMeaningless(token) {
  const t = String(token || '').trim();
  if (!t) return false;
  if (/^[a-zA-Z]+$/.test(t)) {
    if (t.length < 3) return true;
    return !/[aeiouAEIOU]/.test(t);
  }
  return false;
}

function tourActivitySearchTextLooksMeaningless(text) {
  const tokens = tourSearchTokens(text);
  if (!tokens.length) return false;
  return tokens.every(tourActivitySearchTokenLooksMeaningless);
}

/**
 * GYG 커밋(items 없음): 실제 결과를 알 수 없을 때 fallback은 **무의미 입력만**.
 * MRT는 items·fetch 후 resolveTourActivityListing이 우선.
 */
export function tourActivityKeywordShouldShowListingFallback(
  location,
  keyword,
  searchText = '',
) {
  const kw = String(keyword || '').trim();
  if (!kw) return false;
  const full = String(searchText || '').trim();
  const candidates = full && full !== kw ? [kw, full] : [kw];
  for (const text of candidates) {
    if (tourActivityKeywordLikelyMatches(location, text)) return false;
    if (tourActivitySearchTextLooksPlausible(text)) return false;
  }
  return candidates.some((text) => tourActivitySearchTextLooksMeaningless(text));
}

/**
 * @param {unknown} query
 * @param {object | null | undefined} region
 */
export function scoreTourServiceRegionMatch(query, region) {
  const raw = typeof query === 'string' ? query.trim() : '';
  if (!raw || !region) return 9;
  const qCompact = compact(raw);
  const queryTokens = raw.split(/\s+/).filter(Boolean);
  if (
    queryTokens.length === 1 &&
    queryTokens[0].length < minQueryTokenLength(queryTokens[0])
  ) {
    return 9;
  }
  const labels = [region.name, region.name_en, region.name_ko, region.slug?.replace(/-/g, ' ')]
    .map((v) => String(v || '').trim())
    .filter(Boolean);

  if (queryTokens.length >= 2) {
    const meaningful = queryTokens.filter(
      (t) => !TOUR_GENERIC_REGION_TOKENS.has(t.toLowerCase()),
    );
    let best = 9;
    for (const label of labels) {
      const lCompact = compact(label);
      if (!lCompact) continue;
      if (lCompact === qCompact) return 0;
      if (lCompact.startsWith(qCompact) && qCompact.length >= 4) best = Math.min(best, 1);
      if (compact(label).includes(qCompact) && qCompact.length >= 4) best = Math.min(best, 2);
      if (wordMatchesLabel(label, raw)) best = Math.min(best, 2);
      let matched = 0;
      for (const token of meaningful) {
        if (wordMatchesLabel(label, token)) matched += 1;
      }
      const need = Math.min(2, meaningful.length);
      if (meaningful.length > 0 && matched >= need) best = Math.min(best, 3);
    }
    return best;
  }

  for (const label of labels) {
    const lCompact = compact(label);
    if (!lCompact) continue;
    if (lCompact === qCompact) return 0;
    if (lCompact.startsWith(qCompact) && qCompact.length >= 2) return 1;
    if (wordMatchesLabel(label, raw)) return 2;
    const queryTokens = raw.split(/\s+/).filter(Boolean);
    if (queryTokens.length >= 2) {
      const phrase = queryTokens.join(' ');
      if (compact(label).includes(compact(phrase))) return 2;
      if (wordMatchesLabel(label, phrase)) return 2;
    }
    for (const token of queryTokens) {
      if (token.length < 3) {
        if (wordMatchesLabel(label, token)) return 4;
        continue;
      }
      if (wordMatchesLabel(label, token)) return 3;
      if (compact(label).includes(compact(token)) && token.length >= 4) return 4;
    }
  }
  return 9;
}

/**
 * @param {unknown} query
 * @param {object[]} regions
 */
export function filterTourServiceRegions(query, regions = []) {
  const raw = typeof query === 'string' ? query.trim() : '';
  if (!raw) return [];
  const ranked = [];
  for (const region of regions || []) {
    if (!region) continue;
    const rank = scoreTourServiceRegionMatch(raw, region);
    if (rank >= 9) continue;
    ranked.push({ region, rank });
  }
  ranked.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return String(a.region.name || '').localeCompare(String(b.region.name || ''), 'ko');
  });
  const out = [];
  const seen = new Set();
  for (const row of ranked) {
    const key = row.region.slug || row.region.name;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row.region);
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * @param {unknown} draft
 * @param {object[]} regions
 */
export function listTourServiceRegionSuggestionHits(draft, regions = []) {
  const raw = String(draft || '').trim();
  if (!raw) return [];
  const tokens = raw.split(/\s+/).filter(Boolean);
  const out = [];
  const seen = new Set();

  const pushMany = (list) => {
    for (const region of list || []) {
      const key = region?.slug || region?.name;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(region);
    }
  };

  pushMany(filterTourServiceRegions(raw, regions));

  if (tokens.length >= 2) {
    for (let len = Math.min(tokens.length, 4); len >= 1; len -= 1) {
      for (let start = 0; start <= tokens.length - len; start += 1) {
        const phrase = tokens.slice(start, start + len).join(' ');
        const phraseTokens = phrase.split(/\s+/).filter(Boolean);
        if (
          phraseTokens.length === 1 &&
          TOUR_GENERIC_REGION_TOKENS.has(phraseTokens[0].toLowerCase())
        ) {
          continue;
        }
        pushMany(filterTourServiceRegions(phrase, regions));
      }
    }
  } else if (tokens.length === 1 && tokens[0].length >= 3) {
    if (!TOUR_GENERIC_REGION_TOKENS.has(tokens[0].toLowerCase())) {
      pushMany(filterTourServiceRegions(tokens[0], regions));
    }
  }

  return out.slice(0, 8);
}