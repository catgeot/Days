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
