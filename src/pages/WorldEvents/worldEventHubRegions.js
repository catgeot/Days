/** Q3 Wave1 + Wave2 + Wave3 — `/world-events` 지역 칩 SSOT (5개) */
export const WORLD_EVENT_HUB_REGIONS = [
  {
    id: 'europe',
    slugs: ['vienna', 'munich', 'edinburgh', 'amsterdam', 'barcelona', 'prague', 'paris', 'london'],
  },
  {
    id: 'asiaPacific',
    slugs: ['tokyo', 'kyoto', 'bangkok', 'bali', 'singapore'],
  },
  {
    id: 'americas',
    slugs: ['rio-de-janeiro', 'new-york', 'los-angeles'],
  },
  {
    id: 'oceaniaNature',
    slugs: ['iceland', 'sydney'],
  },
  {
    id: 'niche',
    slugs: ['marrakech', 'hanoi', 'dubai', 'istanbul'],
  },
];

const slugToRegion = new Map();

for (const region of WORLD_EVENT_HUB_REGIONS) {
  for (const slug of region.slugs) {
    slugToRegion.set(slug, region.id);
  }
}

/**
 * @param {string | null | undefined} slug
 * @returns {string | null}
 */
export function resolveWorldEventHubRegionId(slug) {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return null;
  return slugToRegion.get(key) ?? null;
}

/**
 * @param {string | null | undefined} regionId
 * @returns {Set<string>}
 */
export function worldEventHubRegionSlugSet(regionId) {
  const key = String(regionId || '').trim();
  if (!key || key === 'all') return new Set();
  const region = WORLD_EVENT_HUB_REGIONS.find((entry) => entry.id === key);
  return new Set(region?.slugs ?? []);
}
