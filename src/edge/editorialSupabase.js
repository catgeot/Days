import { isEditorialSlugSafe } from './editorialSlug.js';

const DEFAULT_TIMEOUT_MS = 1500;

export function getEditorialSupabaseConfig() {
  const url = String(process.env.VITE_SUPABASE_URL || '').trim();
  const key = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) return null;
  return { url, key };
}

/**
 * @param {string} slug
 * @param {{ timeoutMs?: number, fetchImpl?: typeof fetch }} [options]
 */
export async function fetchPublishedEditorialBySlug(slug, options = {}) {
  if (!isEditorialSlugSafe(slug)) return null;
  const cfg = getEditorialSupabaseConfig();
  if (!cfg) return null;

  const select = 'slug,title,dek,content,images,disclosure_badge,published_at,place_slug,locale';
  const endpoint =
    `${cfg.url}/rest/v1/reports?select=${encodeURIComponent(select)}` +
    `&is_editorial=eq.true&status=eq.published&is_deleted=eq.false` +
    `&slug=eq.${encodeURIComponent(slug)}&limit=1`;

  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    const res = await fetchImpl(endpoint, {
      headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows[0]?.slug || !rows[0]?.title) return null;
    return rows[0];
  } catch {
    return null;
  }
}

/**
 * @param {{ timeoutMs?: number, fetchImpl?: typeof fetch }} [options]
 */
export async function fetchPublishedEditorialIndex(options = {}) {
  const cfg = getEditorialSupabaseConfig();
  if (!cfg) return [];

  const endpoint =
    `${cfg.url}/rest/v1/reports?select=${encodeURIComponent('slug,published_at')}` +
    '&is_editorial=eq.true&status=eq.published&is_deleted=eq.false' +
    '&order=published_at.desc';

  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    const res = await fetchImpl(endpoint, {
      headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows.filter((row) => isEditorialSlugSafe(row?.slug));
  } catch {
    return [];
  }
}
