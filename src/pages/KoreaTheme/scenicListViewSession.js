const SESSION_KEY = 'gateo:scenic-hub-list-view:v1';

/** @returns {boolean} true = legacy row list */
export function readScenicLegacyListFromSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'legacy';
  } catch {
    return false;
  }
}

/** @param {boolean} legacy */
export function writeScenicLegacyListToSession(legacy) {
  try {
    sessionStorage.setItem(SESSION_KEY, legacy ? 'legacy' : 'grid');
  } catch {
    /* private mode */
  }
}
