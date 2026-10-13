/**
 * Festival list panel title (h2) — EN avoids quoted time breaking across lines.
 */

function isEnLocale(locale) {
  return String(locale || '').startsWith('en');
}

/** EN list title time phrase by tab id (not chip label). */
const EN_TIME_TAB_HEADLINE = {
  now: 'Festivals on now',
  weekend: "This weekend's festivals",
  thisMonth: "This month's festivals",
  spring: 'Spring festivals',
  summer: 'Summer festivals',
  autumn: 'Autumn festivals',
  winter: 'Winter festivals',
};

/**
 * @param {string} timeTab
 * @param {string} [timeLabel] — fallback when tab id unknown
 */
export function enFestivalListTimePhrase(timeTab, timeLabel) {
  const id = String(timeTab || '').trim();
  if (EN_TIME_TAB_HEADLINE[id]) return EN_TIME_TAB_HEADLINE[id];
  const label = String(timeLabel || '').trim();
  if (!label) return 'Festivals';
  if (/festivals?$/i.test(label)) return label;
  return `${label} festivals`;
}

export function listEnFestivalTimeTabHeadlines() {
  return { ...EN_TIME_TAB_HEADLINE };
}

/**
 * Festival home list title — EN period phrases (KO uses chip labels).
 */
export function festivalIndexTimePhrase(locale, timeTab, timeTabs, t) {
  const id = String(timeTab || 'now');
  const label =
    timeTabs.find((tab) => tab.id === id)?.label ||
    t('korea.festival.timeTab.now');
  if (String(locale || '').startsWith('en')) {
    return enFestivalListTimePhrase(id, label);
  }
  return label;
}

/** EN tail after time phrase — omit when phrase already includes «Festivals». */
export function enFestivalListHeadlineTail(timeTab, timeLabel) {
  const phrase = enFestivalListTimePhrase(timeTab, timeLabel);
  if (/\bfestivals\b/i.test(phrase)) return '';
  return ' festival list';
}

/**
 * @param {{
 *   locale?: string,
 *   timeTab: string,
 *   place?: string,
 *   time: string,
 *   tasteSuffix: string,
 *   t: import('i18next').TFunction,
 * }} p
 */
export function formatFestivalIndexHeadlinePlain({
  locale,
  timeTab,
  place,
  time,
  tasteSuffix,
  t,
}) {
  if (isEnLocale(locale)) {
    const core = `${enFestivalListTimePhrase(timeTab, time)}${tasteSuffix}`;
    const tail = enFestivalListHeadlineTail(timeTab, time);
    if (place) return `${place} · ${core}${tail}`;
    return `${core}${tail}`;
  }
  if (place) {
    return t('korea.festival.headlineWithPlace', { place, time, tasteSuffix });
  }
  return t('korea.festival.headlineGeneral', { time, tasteSuffix });
}

/**
 * @param {{
 *   locale?: string,
 *   timeTab: string,
 *   place?: string,
 *   time: string,
 *   tasteSuffix: string,
 *   t: import('i18next').TFunction,
 * }} p
 */
export function buildFestivalIndexHeadlineContent({
  locale,
  timeTab,
  place,
  time,
  tasteSuffix,
  t,
}) {
  if (isEnLocale(locale)) {
    const core = `${enFestivalListTimePhrase(timeTab, time)}${tasteSuffix}`;
    const tail = enFestivalListHeadlineTail(timeTab, time);
    if (place) {
      return {
        kind: 'en',
        place,
        nowrap: core,
        tail,
      };
    }
    return { kind: 'en', nowrap: core, tail };
  }
  return {
    kind: 'text',
    text: formatFestivalIndexHeadlinePlain({
      locale,
      timeTab,
      place,
      time,
      tasteSuffix,
      t,
    }),
  };
}
