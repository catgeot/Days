/** CJK (kana + han) — 한글(U+AC00–D7A3)은 허용 */
export const CJK_IN_KO_BODY =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAFF]/u;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function containsCjkForKoBody(value) {
  if (value == null) return false;
  return CJK_IN_KO_BODY.test(String(value));
}

/** @type {readonly string[]} */
export const WORLD_EVENT_KO_BODY_PATHS = [
  'title',
  'recurrenceNote',
  'detailOverview',
  'bookingHints',
  'highlights[]',
  'stayAreas[].name',
  'stayAreas[].note',
  'stayAreas[].doHere[]',
  'glossaryTerms[].termKo',
  'glossaryTerms[].promptKo',
  'glossaryTerms[].searchQueryKo',
  'heroImages[].captionKo',
  'venue.name',
];

/** @type {readonly string[]} */
export const WORLD_EVENT_EN_BODY_PATHS = [
  'titleEn',
  'recurrenceNoteEn',
  'detailOverviewEn',
  'highlightsEn[]',
  'stayAreas[].nameEn',
  'stayAreas[].noteEn',
  'stayAreas[].doHereEn[]',
  'glossaryTerms[].termEn',
  'glossaryTerms[].promptEn',
  'glossaryTerms[].searchQueryEn',
  'heroImages[].captionEn',
];

/**
 * @param {Record<string, unknown>} event
 * @param {'ko'|'en'} locale
 * @returns {Array<{ path: string, value: string }>}
 */
export function collectWorldEventCjkViolations(event, locale) {
  /** @type {Array<{ path: string, value: string }>} */
  const hits = [];

  const check = (path, value) => {
    const raw = value == null ? '' : String(value).trim();
    if (!raw) return;
    if (containsCjkForKoBody(raw)) {
      hits.push({ path, value: raw.slice(0, 160) });
    }
  };

  if (locale === 'ko') {
    check('title', event.title);
    check('recurrenceNote', event.recurrenceNote);
    check('detailOverview', event.detailOverview);
    check('bookingHints', event.bookingHints);
    check('venue.name', event.venue?.name);
    for (const [i, item] of (event.highlights ?? []).entries()) {
      check(`highlights[${i}]`, item);
    }
    for (const [i, area] of (event.stayAreas ?? []).entries()) {
      check(`stayAreas[${i}].name`, area.name);
      check(`stayAreas[${i}].note`, area.note);
      for (const [j, line] of (area.doHere ?? []).entries()) {
        check(`stayAreas[${i}].doHere[${j}]`, line);
      }
    }
    for (const [i, term] of (event.glossaryTerms ?? []).entries()) {
      check(`glossaryTerms[${i}].termKo`, term.termKo);
      check(`glossaryTerms[${i}].promptKo`, term.promptKo);
      check(`glossaryTerms[${i}].searchQueryKo`, term.searchQueryKo);
    }
    for (const [i, img] of (event.heroImages ?? []).entries()) {
      check(`heroImages[${i}].captionKo`, img.captionKo);
    }
    return hits;
  }

  check('titleEn', event.titleEn);
  check('recurrenceNoteEn', event.recurrenceNoteEn);
  check('detailOverviewEn', event.detailOverviewEn);
  for (const [i, item] of (event.highlightsEn ?? []).entries()) {
    check(`highlightsEn[${i}]`, item);
  }
  for (const [i, area] of (event.stayAreas ?? []).entries()) {
    check(`stayAreas[${i}].nameEn`, area.nameEn);
    check(`stayAreas[${i}].noteEn`, area.noteEn);
    for (const [j, line] of (area.doHereEn ?? []).entries()) {
      check(`stayAreas[${i}].doHereEn[${j}]`, line);
    }
  }
  for (const [i, term] of (event.glossaryTerms ?? []).entries()) {
    check(`glossaryTerms[${i}].termEn`, term.termEn);
    check(`glossaryTerms[${i}].promptEn`, term.promptEn);
    check(`glossaryTerms[${i}].searchQueryEn`, term.searchQueryEn);
  }
  for (const [i, img] of (event.heroImages ?? []).entries()) {
    check(`heroImages[${i}].captionEn`, img.captionEn);
  }
  return hits;
}