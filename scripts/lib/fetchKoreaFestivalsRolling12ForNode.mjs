/**
 * Node capture/health — same rolling12 payload as fetchKoreaFestivalsRolling12 (anon tourapi-proxy).
 */
import { rolling12MonthRangeYmd } from '../../src/pages/Korea/festivalTimeFilter.js';

function filterFestivalItems(items) {
  return (items || []).filter(
    (item) => item?.title && /^\d{8}$/.test(String(item.eventStartDate || '')),
  );
}

/**
 * @param {{ now?: Date, force?: boolean, locale?: string }} [opts]
 */
export async function fetchKoreaFestivalsRolling12ForNode(opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const range = rolling12MonthRangeYmd(now);
  const baseUrl = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!baseUrl || !anonKey) {
    return { ok: false, items: [], error: 'missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY' };
  }

  const body = {
    action: 'festivalWindow',
    eventStartDate: range.eventStartDate,
    eventEndDate: range.eventEndDate,
    locale: opts.locale || 'ko',
  };
  if (opts.force) body.force = true;

  const res = await fetch(`${baseUrl}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    return { ok: false, items: [], error: `tourapi-proxy HTTP ${res.status}` };
  }
  const data = await res.json();
  if (!data?.ok || !Array.isArray(data.items)) {
    return {
      ok: false,
      items: [],
      error: data?.message || data?.error || 'festivalWindow not ok',
    };
  }
  return { ok: true, items: filterFestivalItems(data.items), fromCache: Boolean(data.fromCache) };
}
