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

/** 저장 메시지·레거시 resolver의 `?tab=planner` 정규화 (hash 유지) */
export function normalizePlacePlannerPath(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const hashIdx = trimmed.indexOf('#');
  const pathPart = hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed;
  const hashPart = hashIdx >= 0 ? trimmed.slice(hashIdx) : '';
  const legacy = pathPart.match(/^(\/place\/[^/?#]+)\?tab=planner\/?$/);
  const normalizedPath = legacy ? `${legacy[1]}/planner` : pathPart;
  return `${normalizedPath}${hashPart}`;
}
