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
