/**
 * PlaceCard 플래너 탭 경로 — 라우트 SSOT (`/place/:slug/planner`, query `?tab=` 아님).
 * @param {string | null | undefined} slug
 */
export function buildPlacePlannerPath(slug) {
  if (!slug) return null;
  const key = String(slug).trim().toLowerCase();
  if (!key) return null;
  return `/place/${key}/planner`;
}

/** 저장 메시지·레거시 resolver의 `?tab=planner` 정규화 */
export function normalizePlacePlannerPath(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const legacy = trimmed.match(/^(\/place\/[^/?#]+)\?tab=planner\/?$/);
  if (legacy) return `${legacy[1]}/planner`;
  return trimmed;
}
