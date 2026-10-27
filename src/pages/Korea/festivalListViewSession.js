const SESSION_KEY = 'gateo:festival-hub-list-view:v1';

/** @returns {boolean} true = legacy row list */
export function readFestivalHubLegacyListFromSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'legacy';
  } catch {
    return false;
  }
}

/** @param {boolean} legacy */
export function writeFestivalHubLegacyListToSession(legacy) {
  try {
    sessionStorage.setItem(SESSION_KEY, legacy ? 'legacy' : 'grid');
  } catch {
    /* private mode */
  }
}
