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

  const row = {
    place_id: String(payload.placeId || '').trim(),
    section: String(payload.section || '').trim(),
    note: String(payload.note || '').trim(),
    url: String(payload.url || '').trim() || null,
  };

  const { error } = await supabase.from('toolkit_reports').insert(row);

  if (error) {
    return { ok: false, error };
  }
  return { ok: true };
}
