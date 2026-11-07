const SESSION_KEY = 'gateo:festival-hub-region-choice:v1';

/**
 * @typedef {{ areaCode: string, cityName: string, explicit: boolean }} FestivalHubRegionChoiceRecord
 */

/** @returns {FestivalHubRegionChoiceRecord | null} */
export function readFestivalHubRegionChoiceSession() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const areaCode = String(parsed?.areaCode ?? '').trim();
    if (!areaCode) return null;
    const cityName = String(parsed?.cityName ?? 'all').trim() || 'all';
    const explicit = Boolean(parsed?.explicit);
    return { areaCode, cityName, explicit };
  } catch {
    return null;
  }
}

/** @param {FestivalHubRegionChoiceRecord} record */
export function writeFestivalHubRegionChoiceSession(record) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        areaCode: String(record.areaCode),
        cityName: String(record.cityName ?? 'all'),
        explicit: Boolean(record.explicit),
      }),
    );
  } catch {
    /* private mode */
  }
}

export function clearFestivalHubRegionChoiceSession() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
}
