import { isDomesticKoreaLocation } from './tourApiMatch.js';

/** @typedef {{ itemName?: string, category?: string, itemDesc?: string, description?: string }} MrtTnaRelevanceItem */

/** Admin/place suffix that still names the same token (마포구, 제주도, 서울타워). */
const KO_PLACE_SUFFIX = '(?:구|시|군|읍|면|동|리|도|역|타워|공원)';

/** Province tag glued onto a short place, e.g. [경북영양] · [경북/영양]. */
const KO_REGION_PREFIX =
  '서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주';

/**
 * A Korea festival must not keep a product that names another country,
 * even when a short place token sits inside the title.
 */
const OVERSEAS_COUNTRY_RE =
  /뉴질랜드|new zealand|호주|australia|일본|japan|태국|thailand|베트남|vietnam|프랑스|france|이탈리아|italy|미국|united states|\busa\b|캐나다|canada|영국|united kingdom|독일|germany|스위스|switzerland|스페인|spain|인도네시아|indonesia|필리핀|philippines|말레이시아|malaysia|싱가포르|singapore|대만|taiwan|홍콩|hong kong|라오스|\blaos\b|캄보디아|cambodia|튀르키예|turkey|그리스|greece|포르투갈|portugal|네덜란드|netherlands|오스트리아|austria|체코|czech|헝가리|hungary|폴란드|poland|러시아|russia|멕시코|mexico|브라질|brazil|페루|peru|이집트|egypt|모로코|morocco|피지|fiji|하와이|hawaii/i;

export const OVERSEAS_TNA_NOISE_RE =
  /중국|칭다오|상하이|오사카|도쿄|교토|간사이|유니버설|디즈니|만리장성|심천|대련|홍콩|타이베이|LA\b|노산\s*풍경|라오산|연세대학교|연남점|Douro|Yarra|Hidden\s*Valley|Valley\s*of\s*Fire|와인\s*투어|잔지바르|Zanzibar|나이로비|Nairobi|사파리|마사이|Masai|세렝게티|Serengeti|케냐|Kenya|탄자니아|Tanzania|응두투|Ndutu/;

/** 충남 공주시와 한글 「공주(公主)」 테마 해외·국내 체험 상품 */
export const GONGJU_PRINCESS_TNA_NOISE_RE =
  /당나라\s*(?:의\s*)?공주|唐(?:朝)?[^[]*公主|켄싱턴\s*궁(?:전)?[^[]*공주|Kensington\s+Palace[^[\n]*(?:[Pp]rincess|공주)|(?:London|영국|UK)[^[\n]*공주|인어\s*공주|(?:셰익스피어|웨스턴|문화)[^[\n]*공주\s*특별/;

const GENERIC_EN_TOKEN_RE =
  /^(valley|park|tour|island|beach|museum|tower|bridge|lake|mountain|city|hotel|pass|garden|temple|palace|castle|road|street|point|peak|falls|river|bay|coast|harbor|harbour|village|town|center|centre)$/i;

const AMBIGUOUS_KO_PLACE_NAMES = new Set(['영양', '동해', '남해', '연기']);

/** 키워드↔영문 동의어 — 한 어느 쪽이든 그룹 전체를 매칭에 쓴다 */
const TOUR_KEYWORD_SYNONYM_GROUPS = [
  ['수상시장', 'floating', 'market', 'damnoen', 'amphawa', '콧창', 'khlong'],
  ['시미란', 'similan', '심일란'],
  ['스노클링', '스노클', 'snorkel', 'snorkeling'],
  ['호핑', 'island hopping', 'hopping'],
];

function escapeRegExp(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compact(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function synonymGroupsForKeyword(keyword) {
  const raw = String(keyword || '').trim();
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const c = compact(raw);
  const out = [];
  for (const group of TOUR_KEYWORD_SYNONYM_GROUPS) {
    const hit = group.some((term) => {
      const t = String(term || '').trim();
      if (!t) return false;
      if (/[가-힣]/.test(t)) return raw.includes(t);
      return lower.includes(t.toLowerCase()) || c.includes(compact(t));
    });
    if (hit) out.push(group);
  }
  return out;
}

function expandKeywordMatchingForms(keyword) {
  const raw = String(keyword || '').trim();
  if (!raw) return [];
  const forms = new Set([raw]);
  for (const group of synonymGroupsForKeyword(raw)) {
    for (const term of group) forms.add(term);
  }
  const tokens = raw.split(/\s+/).map((t) => t.trim()).filter((t) => t.length >= 2);
  for (const token of tokens) {
    forms.add(token);
    for (const group of synonymGroupsForKeyword(token)) {
      for (const term of group) forms.add(term);
    }
  }
  return [...forms];
}

function regionLabelTokens(location) {
  if (!location || typeof location !== 'object') return new Set();
  const parts = [
    location.name,
    location.name_en,
    location.name_ko,
    location.slug?.replace(/-/g, ' '),
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
 * @param {unknown} keyword
 * @param {object | null | undefined} [location]
 */
export function stripRegionTokensFromActivityKeyword(keyword, location) {
  const raw = String(keyword || '').trim();
  if (!raw) return '';
  const regionTokens = regionLabelTokens(location);
  if (!regionTokens.size) return raw;
  const kept = raw
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !regionTokens.has(compact(t)));
  return kept.length ? kept.join(' ') : raw;
}

/**
 * @param {MrtTnaRelevanceItem | string | null | undefined} itemOrText
 */
export function mrtTnaItemSearchText(itemOrText) {
  if (typeof itemOrText === 'string') return String(itemOrText || '').trim();
  if (!itemOrText || typeof itemOrText !== 'object') return '';
  return [
    itemOrText.itemName,
    itemOrText.category,
    itemOrText.itemDesc,
    itemOrText.description,
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .join(' ');
}

function relevanceTokens(keyword) {
  return String(keyword || '')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .filter((t) => !GENERIC_EN_TOKEN_RE.test(t));
}

/**
 * @param {string} itemName
 * @param {string} keyword
 */
export function scoreMrtTnaRelevance(itemName, keyword) {
  const name = String(itemName || '');
  if (!name || !keyword) return 0;
  const tokens = relevanceTokens(keyword);
  if (!tokens.length) return 0;

  let best = 0;
  for (const token of tokens) {
    const esc = escapeRegExp(token);
    if (new RegExp(`\\[${esc}\\]`, 'i').test(name)) {
      best = Math.max(best, 10);
      continue;
    }
    if (new RegExp(`(?:^|[\\s\\[\\(/,])${esc}(?:$|[\\s\\]\\)/,·])`, 'i').test(name)) {
      best = Math.max(best, 8);
      continue;
    }
    const boundedPlace = new RegExp(
      `(?:^|[\\s\\[\\(/,·])${esc}${KO_PLACE_SUFFIX}(?:$|[\\s\\]\\)/,·.])|\\[(?:${KO_REGION_PREFIX})[/ ]?${esc}\\]`,
      'i',
    ).test(name);
    if (boundedPlace) {
      best = Math.max(best, 8);
    }
  }

  if (best > 0 && OVERSEAS_TNA_NOISE_RE.test(name)) {
    return 0;
  }

  if (best > 0 && best <= 3) {
    for (const token of tokens) {
      if (!AMBIGUOUS_KO_PLACE_NAMES.has(token)) continue;
      const esc = escapeRegExp(token);
      const strongGeo = new RegExp(
        `\\[(?:경북\\/|경남\\/|전북\\/|전남\\/|충북\\/|충남\\/|강원\\/|제주\\/)?${esc}\\]|\\[(?:경북|경남|전북|전남|충북|충남|강원|제주)${esc}\\]|${esc}(?:군|시|읍|면)|(?:^|[\\s\\[/])${esc}(?:$|[\\s\\]/,·])`,
        'i',
      ).test(name);
      if (!strongGeo) return 0;
    }
  }

  return best;
}

/**
 * @param {MrtTnaRelevanceItem} item
 * @param {unknown} keyword
 * @param {object | null | undefined} [location]
 */
export function scoreMrtTnaItemRelevance(item, keyword, location = null) {
  const text = mrtTnaItemSearchText(item);
  if (!text) return 0;
  const stripped = stripRegionTokensFromActivityKeyword(keyword, location);
  const forms = expandKeywordMatchingForms(stripped || keyword);
  let best = 0;
  for (const form of forms) {
    best = Math.max(best, scoreMrtTnaRelevance(text, form));
  }
  if (best > 0 && isDomesticKoreaLocation(location) && OVERSEAS_COUNTRY_RE.test(text)) {
    return 0;
  }
  return best;
}

/**
 * @template {MrtTnaRelevanceItem} T
 * @param {T[]} items
 * @param {string} keyword
 * @param {object | null | undefined} [location]
 * @returns {T[]}
 */
export function filterRelevantMrtTnas(items, keyword, location = null) {
  const scored = (items || [])
    .map((it) => ({ it, score: scoreMrtTnaItemRelevance(it, keyword, location) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((row) => row.it);
}

/**
 * Edge·nearby 병합 응답용 — 해외 노이즈·동형어(영양) 약한 오탐만 제거.
 * @template {MrtTnaRelevanceItem} T
 * @param {T[]} items
 * @returns {T[]}
 */
export function stripUnsafeMrtTnaItems(items) {
  return (items || []).filter((it) => {
    const name = String(it?.itemName || '');
    if (!name) return false;
    if (OVERSEAS_TNA_NOISE_RE.test(name)) return false;
    if (GONGJU_PRINCESS_TNA_NOISE_RE.test(name)) return false;
    for (const place of AMBIGUOUS_KO_PLACE_NAMES) {
      if (!name.includes(place)) continue;
      if (scoreMrtTnaRelevance(name, place) === 0) return false;
    }
    return true;
  });
}