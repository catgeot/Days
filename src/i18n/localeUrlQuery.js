/**
 * Append `lang=en` only when English came from URL, storage, or an explicit toggle — not browser inference.
 *
 * @param {import('./constants.js').AppLocale} locale
 * @param {'url' | 'storage' | 'browser' | 'explicit'} localeSource
 */
export function shouldAppendEnglishLangQuery(locale, localeSource) {
  if (locale !== 'en') return false;
  return localeSource !== 'browser';
}

/**
 * @param {string} path
 * @param {import('./constants.js').AppLocale} locale
 * @param {'url' | 'storage' | 'browser' | 'explicit'} localeSource
 */
export function appendEnglishLangQueryToPath(path, locale, localeSource) {
  const raw = String(path || '').trim();
  if (!raw || !shouldAppendEnglishLangQuery(locale, localeSource)) return raw;
  const qIdx = raw.indexOf('?');
  const pathname = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  const params = new URLSearchParams(qIdx >= 0 ? raw.slice(qIdx + 1) : '');
  if (!params.has('lang')) params.set('lang', 'en');
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}
