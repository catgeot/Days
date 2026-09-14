/** @typedef {{ itemName?: string }} MrtTnaRelevanceItem */

export const OVERSEAS_TNA_NOISE_RE =
  /중국|칭다오|상하이|오사카|도쿄|교토|간사이|유니버설|디즈니|만리장성|심천|대련|홍콩|타이베이|LA\b|노산\s*풍경|라오산|연세대학교|연남점|Douro|Yarra|Hidden\s*Valley|Valley\s*of\s*Fire|와인\s*투어|잔지바르|Zanzibar|나이로비|Nairobi|사파리|마사이|Masai|세렝게티|Serengeti|케냐|Kenya|탄자니아|Tanzania|응두투|Ndutu/;

const GENERIC_EN_TOKEN_RE =
  /^(valley|park|tour|island|beach|museum|tower|bridge|lake|mountain|city|hotel|pass|garden|temple|palace|castle|road|street|point|peak|falls|river|bay|coast|harbor|harbour|village|town|center|centre)$/i;

const AMBIGUOUS_KO_PLACE_NAMES = new Set(['영양', '동해', '남해']);

function escapeRegExp(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * @template {MrtTnaRelevanceItem} T
 * @param {T[]} items
 * @param {string} keyword
 * @returns {T[]}
 */
export function filterRelevantMrtTnas(items, keyword) {
  const scored = (items || [])
    .map((it) => ({ it, score: scoreMrtTnaRelevance(it?.itemName, keyword) }))
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
