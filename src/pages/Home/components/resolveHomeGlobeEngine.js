/** DEV only: `?globe=legacy` or `?globe=mapbox` overrides engine selection. */
export function resolveGlobeEngineOverride(search = '') {
  if (import.meta.env.PROD) return null;
  try {
    const raw = search.startsWith('?') ? search.slice(1) : search;
    const engine = new URLSearchParams(raw).get('globe');
    if (engine === 'mapbox' || engine === 'legacy') return engine;
  } catch {
    // ignore malformed query
  }
  return null;
}

export function resolveHomeGlobeEngine({
  mapboxToken,
  isProd = import.meta.env.PROD,
  search = typeof window !== 'undefined' ? window.location.search : '',
} = {}) {
  if (!mapboxToken) return 'legacy';
  if (isProd) return 'mapbox';

  const override = resolveGlobeEngineOverride(search);
  if (override) return override;

  // DEV: use Mapbox on all clients when token is set (prefer URL-unrestricted dev token in .env.local).
  return 'mapbox';
}
