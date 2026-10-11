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
    rows.push({ name, distKm: Number.isFinite(distKm) ? distKm : null });
    if (rows.length >= 24) break;
  }
  return rows;
}

/**
 * Names already on the sheet win. Otherwise wait for the sheet fetch, or start one, up to timeoutMs.
 * @param {string} contentId
 * @param {{ names?: unknown, timeoutMs?: number, trigger?: () => Promise<unknown> }} [options]
 */
export async function waitForFestivalRestaurantNames(contentId, options = {}) {
  const ready = spotRows(options.names);
  if (ready.length) return ready;
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
    return result ? spotRows(result) : [];
  } finally {
    clearTimeout(timer);
  }
}
