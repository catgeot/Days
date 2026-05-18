/** @param {import('@supabase/supabase-js').SupabaseClient} supabase */
export async function fetchAllPlaceToolkits(supabase, { select = 'place_id, essential_guide, toolkit_updated_at' } = {}) {
  const rows = [];
  const pageSize = 500;
  let from = 0;

  while (true) {
    const { data, error } = await supabase.from('place_toolkit').select(select).range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}
