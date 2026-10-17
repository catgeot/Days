const loads = new Map();

/** The sheet's in-flight 주변 맛집 fetch, so a food question can wait for it. */
export function beginFestivalRestaurantLoad(contentId, promise) {
  const key = String(contentId || '').trim();
  if (!key || !promise) return promise;
  const tracked = Promise.resolve(promise).catch(() => ({ spots: [] }));
  loads.set(key, tracked);
  return tracked;
}

export function resetFestivalRestaurantLoad(contentId) {
  if (contentId == null) loads.clear();
  else loads.delete(String(contentId).trim());
}

function spotRows(value) {
  const spots = Array.isArray(value?.spots)
    ? value.spots
    : Array.isArray(value)
      ? value
      : [];
  const rows = [];
  for (const spot of spots) {
    const name = String(spot?.name || spot || '').replace(/\s+/g, ' ').trim();
    if (!name) continue;
    const distKm = Number(spot?.distKm);
    const homepage = String(spot?.url || spot?.homepage || '').trim();
    rows.push({
      name,
      distKm: Number.isFinite(distKm) ? distKm : null,
      locality: String(spot?.locality || '').replace(/\s+/g, ' ').trim(),
      addr1: String(spot?.addr1 || '').replace(/\s+/g, ' ').trim(),
      cat3: String(spot?.cat3 || '').trim(),
      url: /^https?:\/\//i.test(homepage) ? homepage : '',
    });
    if (rows.length >= 24) break;
  }
  return rows;
}

/** MOONi food hints need measured distances — name-only sheet rows still wait for the fetch. */
export function festivalRestaurantRowsReadyForMooni(rows) {
  if (!Array.isArray(rows) || !rows.length) return false;
  const withDist = rows.filter((row) => Number.isFinite(row?.distKm));
  const need = Math.min(3, rows.length);
  return withDist.length >= need;
}

/**
 * Names already on the sheet win. Otherwise wait for the sheet fetch, or start one, up to timeoutMs.
 * @param {string} contentId
 * @param {{ names?: unknown, timeoutMs?: number, trigger?: () => Promise<unknown> }} [options]
 */
export async function waitForFestivalRestaurantNames(contentId, options = {}) {
  const ready = spotRows(options.names);
  if (festivalRestaurantRowsReadyForMooni(ready)) return ready;
  const timeoutMs = Math.max(0, Number(options.timeoutMs) || 3000);
  const key = String(contentId || '').trim();
  let pending = key ? loads.get(key) : null;
  if (!pending && typeof options.trigger === 'function') {
    pending = beginFestivalRestaurantLoad(key, Promise.resolve().then(() => options.trigger()));
  }
  if (!pending) return [];
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    const result = await Promise.race([pending, timeout]);
    const loaded = result ? spotRows(result) : [];
    if (festivalRestaurantRowsReadyForMooni(loaded)) return loaded;
    const merged = loaded.length ? loaded : ready;
    const withDist = merged.filter((row) => Number.isFinite(row.distKm));
    return withDist.length ? withDist : merged;
  } finally {
    clearTimeout(timer);
  }
}
