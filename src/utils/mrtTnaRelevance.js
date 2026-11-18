/** @typedef {{ itemName?: string, category?: string, itemDesc?: string, description?: string }} MrtTnaRelevanceItem */

export const OVERSEAS_TNA_NOISE_RE =
  /중국|칭다오|상하이|오사카|도쿄|교토|간사이|유니버설|디즈니|만리장성|심천|대련|홍콩|타이베이|LA\b|노산\s*풍경|라오산|연세대학교|연남점|Douro|Yarra|Hidden\s*Valley|Valley\s*of\s*Fire|와인\s*투어|잔지바르|Zanzibar|나이로비|Nairobi|사파리|마사이|Masai|세렝게티|Serengeti|케냐|Kenya|탄자니아|Tanzania|응두투|Ndutu/;

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
    if (name.toLowerCase().includes(token.toLowerCase())) {
      best = Math.max(best, 3);
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
    for (const place of AMBIGUOUS_KO_PLACE_NAMES) {
      if (!name.includes(place)) continue;
      if (scoreMrtTnaRelevance(name, place) === 0) return false;
    }
    return true;
  });
}