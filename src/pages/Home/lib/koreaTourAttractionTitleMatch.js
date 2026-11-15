/**
 * tourapi_attraction 제목 매칭 — 네트워크 없음.
 * JSON contentId 기입 아님.
 */

function normalizeTourTitleKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/**
 * 공식 제목 꼬리. «군»은 고인돌군·지석묘군만 — 시·군 행정명(남원군·조선왕릉군)은 넣지 않는다.
 * @param {string} after
 */
function officialHeritageTail(after) {
  return String(after || '').replace(/\[유네스코세계(?:문화)?유산\]$/u, '');
}

function matchesOfficialHeritageSuffix(titleKey, after) {
  if (titleKey.length < 3 || !after) return false;
  const tail = officialHeritageTail(after);
  if (tail === '' && tail !== after) return true;
  if (tail === '유적' || tail === '군유적' || tail === '유적군') return true;
  if (tail === '군' && /(?:고인돌|지석묘)$/u.test(titleKey)) return true;
  return false;
}

/**
 * «강화 고인돌»이 제목 앞에 오고 뒤가 유적·유네스코 표기인 행을 앞으로.
 * 완전 일치(꼬리 없음)는 순서를 바꾸지 않는다.
 * @param {{ title?: string, name?: string }} row
 * @param {string} query
 */
export function tourTitleHeritageLeadRank(row, query) {
  const q = normalizeTourTitleKey(query);
  if (q.length < 2) return 1;
  const keys = [row?.title, row?.name].map(normalizeTourTitleKey).filter(Boolean);
  for (const key of keys) {
    if (!key.startsWith(q)) continue;
    const rawTail = key.slice(q.length);
    const tail = officialHeritageTail(rawTail);
    if (tail === '유적' || tail === '군유적' || (tail === '' && rawTail !== '')) return 0;
  }
  return 1;
}

/** Enter·제안 title exact — «고산사»↔«고산사(홍성)», «대웅전» 접미 */
export function tourRowTitleMatchesCompactQuery(row, title) {
  const titleKey = normalizeTourTitleKey(title);
  if (titleKey.length < 2) return false;
  const queryTokens = String(title || '')
    .trim()
    .split(/\s+/)
    .map(normalizeTourTitleKey)
    .filter((t) => t.length >= 2);
  const keys = [row?.title, row?.name].map(normalizeTourTitleKey).filter(Boolean);
  if (queryTokens.length >= 2) {
    for (const k of keys) {
      if (queryTokens.every((t) => k.includes(t))) return true;
    }
  }
  const parenRegion = String(title || '').match(/\(([^)]+)\)/)?.[1]?.trim();
  if (parenRegion) {
    const regionKey = normalizeTourTitleKey(parenRegion);
    const baseKey = normalizeTourTitleKey(String(title || '').replace(/\([^)]*\)/g, ''));
    for (const k of keys) {
      if (k === titleKey) return true;
      if (baseKey.length >= 2 && k === `${baseKey}(${regionKey})`) return true;
      if (baseKey.length >= 2 && k.startsWith(`${baseKey}(`) && k.includes(regionKey)) return true;
    }
    return false;
  }
  for (const k of keys) {
    if (k === titleKey) return true;
    if (k.endsWith(titleKey)) return true;
    const idx = k.indexOf(titleKey);
    if (idx < 0) continue;
    const after = k.slice(idx + titleKey.length);
    if (!after) return true;
    if (/^\([^)]+\)$/u.test(after)) return true;
    if (/^(?:대웅전|루|전|각|암|탑|동|리|사|터|원|당|문|각|채|각)$/u.test(after)) return true;
    if (matchesOfficialHeritageSuffix(titleKey, after)) return true;
  }
  const queryParen = titleKey.match(/^(.+)\(([^)]+)\)$/)?.[1];
  if (queryParen && queryParen.length >= 2) {
    for (const k of keys) {
      if (k === queryParen || k.startsWith(`${queryParen}(`)) return true;
    }
  }
  return false;
}

function scoreTourTitleRow(row, q, hints) {
  const t = normalizeTourTitleKey(row?.name || row?.title);
  if (!t) return 0;
  let score = 0;
  if (t === q) score = 100;
  else if (t.startsWith(q) || q.startsWith(t)) {
    const ratio = Math.max(t.length, q.length) / Math.min(t.length, q.length);
    if (ratio > 2.6) return 0;
    score = 88;
  } else if (t.includes(q)) {
    if (t.length / q.length > 2.6) return 0;
    score = 74;
  } else return 0;
  const addr = String(row?.addr1 || '');
  if (hints.some((h) => addr.includes(h) || t.includes(h))) score += 8;
  return score;
}

function rowIdentity(row) {
  return String(row?.contentId || row?.content_id || row?.id || row?.name || row?.title || '');
}

/**
 * @param {Array<{ name?: string, title?: string, addr1?: string } | null | undefined>} rows
 * @param {string} title
 * @param {string[]} [hubHints]
 */
export function pickTourAttractionRowForTitle(rows, title, hubHints = []) {
  const q = normalizeTourTitleKey(title);
  if (!q || q.length < 2) return null;
  const hints = (hubHints || []).filter((h) => String(h || '').length >= 2);
  let best = null;
  let bestScore = 0;
  for (const row of rows || []) {
    const score = scoreTourTitleRow(row, q, hints);
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return bestScore >= 74 ? best : null;
}

/**
 * First-Pass용 — 동점 다후보는 고르지 않음 (세션 #5 선택 UI).
 * @param {Array<{ name?: string, title?: string, addr1?: string } | null | undefined>} rows
 * @param {string} title
 * @param {string[]} [hubHints]
 * @param {number} [minScore]
 */
export function pickUniqueTourAttractionRowForTitle(rows, title, hubHints = [], minScore = 88) {
  const q = normalizeTourTitleKey(title);
  if (!q || q.length < 2) return null;
  const hints = (hubHints || []).filter((h) => String(h || '').length >= 2);
  const scored = [];
  for (const row of rows || []) {
    const score = scoreTourTitleRow(row, q, hints);
    if (score >= minScore) scored.push({ row, score });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0].score;
  const tied = scored.filter((item) => item.score === top);
  const ids = new Set(tied.map((item) => rowIdentity(item.row)));
  if (ids.size !== 1) return null;
  return tied[0].row;
}
