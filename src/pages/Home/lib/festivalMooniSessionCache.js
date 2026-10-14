const sessions = new Map();

function sessionKey(contentId, locale) {
  const id = String(contentId || '').trim();
  if (!id) return '';
  const lang = String(locale || 'ko').slice(0, 2) || 'ko';
  return `${id}:${lang}`;
}

/** @param {string} contentId @param {string} [locale] */
export function readFestivalMooniSession(contentId, locale) {
  const key = sessionKey(contentId, locale);
  if (!key) return null;
  return sessions.get(key) || null;
}

/**
 * @param {string} contentId
 * @param {string} [locale]
 * @param {{ opening?: string, messages?: object[] }} patch
 */
export function writeFestivalMooniSession(contentId, locale, patch) {
  const key = sessionKey(contentId, locale);
  if (!key || !patch) return;
  const prev = sessions.get(key) || {};
  sessions.set(key, { ...prev, ...patch });
}

/** The opening stays the first bubble after the user sends a question. */
export function showFestivalOpeningInThread({ opening, initialQuery } = {}) {
  if (!String(opening || '').trim()) return false;
  const query = String(initialQuery || '').trim();
  return !query;
}

function messageBody(message) {
  if (!message) return '';
  if (typeof message.text === 'object') return String(message.text?.text || '');
  return String(message.text || '');
}

/** Guess ko/en from a saved thread when the trip has no locale stamp. */
export function inferFestivalThreadLocale(messages) {
  const body = (Array.isArray(messages) ? messages : [])
    .map(messageBody)
    .join('\n')
    .replace(/https?:\/\/\S+/g, ' ');
  const hangul = (body.match(/[가-힣]/g) || []).length;
  const latin = (body.match(/[A-Za-z]/g) || []).length;
  if (hangul >= 8 && hangul > latin) return 'ko';
  if (latin >= 8 && latin > hangul) return 'en';
  return '';
}

/** Persist locale on the JSON column. `saved_trips` has no mooniLocale column. */
export function stampFestivalMooniLocale(curation, locale) {
  const lang = String(locale || 'ko').slice(0, 2) || 'ko';
  const base = curation && typeof curation === 'object' && !Array.isArray(curation) ? curation : {};
  return { ...base, mooniLocale: lang };
}

/** Attach mooniLocale when this save is a festival thread. */
export function festivalSaveExtras(locale, extras) {
  const lang = String(locale || '').slice(0, 2);
  if (lang !== 'ko' && lang !== 'en') return extras;
  return { ...(extras || {}), mooniLocale: lang };
}

/** A festival trip from another language is not this chat. */
export function festivalTripMatchesLocale(trip, locale) {
  const lang = String(locale || 'ko').slice(0, 2) || 'ko';
  const stored = String(trip?.mooniLocale || trip?.curation_data?.mooniLocale || '').slice(0, 2);
  if (stored) return stored === lang;
  const inferred = inferFestivalThreadLocale(trip?.messages);
  if (!inferred) return true;
  return inferred === lang;
}
