export const PLACE_ROUTE_HYDRATE_RETRY_ATTEMPTS = 3;
export const PLACE_ROUTE_HYDRATE_RETRY_DELAY_MS = 700;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** @param {Array<'ok' | 'empty' | 'error'>} attemptStatuses */
export function finalizePlaceRouteHydrateAttempts(attemptStatuses) {
  for (const status of attemptStatuses) {
    if (status === 'ok') return 'found';
    if (status === 'empty') return 'missing';
  }
  return 'error';
}

/**
 * @param {() => Promise<{ status: 'ok' } | { status: 'empty' } | { status: 'error', error?: unknown }>} fetchOnce
 */
export async function runPlaceRouteHydrateWithRetry(fetchOnce) {
  const attemptStatuses = [];
  let lastError;
  for (let attempt = 0; attempt < PLACE_ROUTE_HYDRATE_RETRY_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await sleep(PLACE_ROUTE_HYDRATE_RETRY_DELAY_MS);
    }
    const res = await fetchOnce();
    attemptStatuses.push(res.status);
    if (res.status === 'ok') {
      return { routeStatus: 'found', payload: res };
    }
    if (res.status === 'empty') {
      return { routeStatus: 'missing' };
    }
    lastError = res.error;
  }
  return { routeStatus: finalizePlaceRouteHydrateAttempts(attemptStatuses), error: lastError };
}
