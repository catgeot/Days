import { invokeSupabaseFunctionDeduped } from '../../../shared/api/invokeSupabaseFunctionDeduped.js';
import { shouldQueryFestivalTransport } from './festivalTransportCatalog.js';

const FETCH_TIMEOUT_MS = 25_000;

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('transport-proxy timeout')), ms);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * @param {{ contentId: string, trainDate?: string|null }} args
 * @returns {Promise<{ status: 'unsupported'|'outOfRange'|'unavailable'|'ready', card?: Record<string, unknown> }>}
 */
export async function fetchFestivalTransportCard({ contentId, trainDate }) {
  const id = String(contentId || '').trim();
  if (!shouldQueryFestivalTransport(id)) return { status: 'unsupported' };
  if (!trainDate) return { status: 'outOfRange' };
  try {
    const { data, error } = await withTimeout(
      invokeSupabaseFunctionDeduped('transport-proxy', {
        body: { contentId: id, trainDate },
        ttlMs: 5 * 60 * 1000,
      }),
      FETCH_TIMEOUT_MS,
    );
    if (error || !data || data.ok !== true) return { status: 'unavailable' };
    return { status: 'ready', card: data };
  } catch {
    return { status: 'unavailable' };
  }
}
