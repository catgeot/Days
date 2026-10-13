/**
 * Festival list panel title (h2) — EN avoids quoted time breaking across lines.
 */

function isEnLocale(locale) {
  return String(locale || '').startsWith('en');
}

/**
 * @param {{
 *   locale?: string,
 *   place?: string,
 *   time: string,
 *   tasteSuffix: string,
 *   t: import('i18next').TFunction,
 * }} p
 */
export function formatFestivalIndexHeadlinePlain({
  locale,
  place,
  time,
  tasteSuffix,
  t,
}) {
  if (isEnLocale(locale)) {
    const core = `${time}${tasteSuffix}`;
    if (place) return `${place} · ${core} festival list`;
    return `${core} festival list`;
  }
  if (place) {
    return t('korea.festival.headlineWithPlace', { place, time, tasteSuffix });
  }
  return t('korea.festival.headlineGeneral', { time, tasteSuffix });
}

/**
 * @param {{
 *   locale?: string,
 *   place?: string,
 *   time: string,
 *   tasteSuffix: string,
 *   t: import('i18next').TFunction,
 * }} p
 */
export function buildFestivalIndexHeadlineContent({
  locale,
  place,
  time,
  tasteSuffix,
  t,
}) {
  if (isEnLocale(locale)) {
    const core = `${time}${tasteSuffix}`;
    if (place) {
      return {
        kind: 'en',
        place,
        nowrap: core,
        tail: ' festival list',
      };
    }
    return { kind: 'en', nowrap: core, tail: ' festival list' };
  }
  return {
    kind: 'text',
    text: formatFestivalIndexHeadlinePlain({
      locale,
      place,
      time,
      tasteSuffix,
      t,
    }),
  };
}
