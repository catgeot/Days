import { detectMooniReplyLeak } from '../../supabase/functions/_shared/gemini/answerSanitize.mjs';

const PAGE_SIZE = 500;

/**
 * Scan place_chat_intro.summary rows for MOONi draft / instruction leaks (stored text).
 * @param {{ supabaseUrl: string, anonKey: string, fetch: typeof fetch, timeoutMs?: number }} opts
 * @returns {Promise<{ ok: boolean, scanned: number, leaks: Array<{ destination_key: string, reason: string }> }>}
 */
export async function probePlaceChatIntroSummariesForLeaks(opts) {
  const base = opts.supabaseUrl.replace(/\/$/, '');
  const headers = {
    apikey: opts.anonKey,
    Authorization: `Bearer ${opts.anonKey}`,
    Accept: 'application/json',
  };
  const fetchImpl = opts.fetch;
  const timeoutMs = opts.timeoutMs ?? 15_000;

  const leaks = [];
  let offset = 0;
  let scanned = 0;

  while (true) {
    const url =
      `${base}/rest/v1/place_chat_intro` +
      `?select=destination_key,summary` +
      `&order=destination_key.asc` +
      `&limit=${PAGE_SIZE}` +
      `&offset=${offset}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(url, { headers, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) {
      throw new Error(`place_chat_intro HTTP ${response.status}`);
    }
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const row of rows) {
      scanned += 1;
      const summary = typeof row?.summary === 'string' ? row.summary : '';
      const reason = detectMooniReplyLeak(summary);
      if (reason) {
        leaks.push({ destination_key: String(row.destination_key ?? ''), reason });
      }
    }

    offset += rows.length;
    if (rows.length < PAGE_SIZE) break;
  }

  return { ok: leaks.length === 0, scanned, leaks };
}
