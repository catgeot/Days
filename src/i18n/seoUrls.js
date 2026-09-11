import { DEFAULT_LOCALE } from './constants';

export const SITE_ORIGIN = 'https://www.gateo.kr';

/** i18n 허브 — sitemap xhtml alternate 와 동기 (generate-sitemap.cjs i18nHubPaths) */
export const I18N_HUB_PATHS = [
  '/',
  '/explore',
  '/korea',
  '/korea/theme',
  '/korea/theme/scenic',
  '/korea/theme/courses',
  '/korea/theme/packages',
  '/korea/theme/top10',
  '/korea/theme/regions',
  '/blog',
  '/blog/curation',
  '/world-events',
];

/**
 * @param {string} [path] pathname only (e.g. `/korea`, `/place/tokyo/planner`)
 * @param {'ko' | 'en'} [locale]
 */
export function buildLocalePageUrl(path = '/', locale = DEFAULT_LOCALE) {
  const normalized = !path || path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`;
  const base = `${SITE_ORIGIN}${normalized === '/' ? '' : normalized}`;

  if (locale === 'en') {
    return normalized === '/' ? `${SITE_ORIGIN}/?lang=en` : `${base}?lang=en`;
  }

  return normalized === '/' ? `${SITE_ORIGIN}/` : base;
}

/**
 * @param {string} path
 * @returns {{ hreflang: string, href: string }[]}
 */
export function buildHreflangAlternates(path = '/') {
  return [
    { hreflang: 'ko', href: buildLocalePageUrl(path, 'ko') },
    { hreflang: 'en', href: buildLocalePageUrl(path, 'en') },
    { hreflang: 'x-default', href: buildLocalePageUrl(path, DEFAULT_LOCALE) },
  ];
}
