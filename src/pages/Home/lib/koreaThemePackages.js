import { KOREA_THEME_PACKAGE_KEYS } from '../data/mrtPackageThemeLinks.js';
import { resolveMrtPackageThemeHref } from '../../../utils/mrtPackageLinks.js';

/**
 * @returns {{ key: string, url: string, ctaLabel: string }[]}
 */
export function listKoreaThemePackageCtas(options = {}) {
  const utmContentPrefix = String(options.utmContentPrefix || 'korea-theme-packages').trim();
  /** @type {{ key: string, url: string, ctaLabel: string }[]} */
  const out = [];
  for (const key of KOREA_THEME_PACKAGE_KEYS) {
    const resolved = resolveMrtPackageThemeHref(key, {
      utmContent: `${utmContentPrefix}-${key}`.slice(0, 100),
    });
    if (!resolved?.url) continue;
    out.push({ key, url: resolved.url, ctaLabel: resolved.ctaLabel });
  }
  return out;
}
