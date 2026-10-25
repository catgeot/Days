/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{
 *   placeId: string;
 *   section: string;
 *   note: string;
 *   url?: string;
 *   honeypot?: string;
 * }} payload
 */
export async function submitToolkitReport(supabase, payload) {
  if (String(payload.honeypot || '').trim()) {
    return { ok: true, skipped: true };
  }

  const note = String(payload.note || '').trim().slice(0, 2000);
  const urlRaw = String(payload.url || '').trim();
  const url = urlRaw ? urlRaw.slice(0, 500) : null;

  const row = {
    place_id: String(payload.placeId || '').trim().slice(0, 200),
    section: String(payload.section || '').trim(),
    note,
    url,
  };

  const { error } = await supabase.from('toolkit_reports').insert(row);

  if (error) {
    return { ok: false, error };
  }
  return { ok: true };
}
