import modulesJson from '../data/koreaThemeModules.json' with { type: 'json' };

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   blurb: string,
 *   order: number,
 *   enabled: boolean,
 *   path: string,
 *   icon: string,
 * }} KoreaThemeModule
 */

/** @returns {KoreaThemeModule[]} */
export function listKoreaThemeModules({ includeDisabled = false } = {}) {
  const list = Array.isArray(modulesJson?.modules) ? modulesJson.modules : [];
  return list
    .filter((m) => includeDisabled || m?.enabled !== false)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.id).localeCompare(String(b.id)));
}

/** @param {string} id */
export function getKoreaThemeModule(id) {
  const key = String(id || '').trim();
  if (!key) return null;
  return listKoreaThemeModules({ includeDisabled: true }).find((m) => m.id === key) || null;
}
