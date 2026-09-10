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
 * @param {Array<{ name?: string, title?: string, addr1?: string } | null | undefined>} rows
 * @param {string} title
 * @param {string[]} [hubHints]
 */
export function pickTourAttractionRowForTitle(rows, title, hubHints = []) {
  const q = normalizeTourTitleKey(title);
  if (!q || q.length < 2) return null;
  let best = null;
  let bestScore = 0;
  const hints = (hubHints || []).filter((h) => String(h || '').length >= 2);
  for (const row of rows || []) {
    const t = normalizeTourTitleKey(row?.name || row?.title);
    if (!t) continue;
    let score = 0;
    if (t === q) score = 100;
    else if (t.startsWith(q) || q.startsWith(t)) {
      const ratio = Math.max(t.length, q.length) / Math.min(t.length, q.length);
      if (ratio > 2.6) continue;
      score = 88;
    } else if (t.includes(q)) {
      if (t.length / q.length > 2.6) continue;
      score = 74;
    } else continue;
    const addr = String(row?.addr1 || '');
    if (hints.some((h) => addr.includes(h) || t.includes(h))) score += 8;
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return bestScore >= 74 ? best : null;
}
