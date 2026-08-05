#!/usr/bin/env node
/**
 * 명승 관광지 종목(cat1/cat2) SSOT + (선택) DB 필터 스모크.
 *
 *   npm run smoke:korea-scenic-categories
 */
import {
  labelTourAttractionCat1,
  labelTourAttractionCat2,
  listTourAttractionCat2,
  normalizeTourAttractionCat1,
  normalizeTourAttractionCat2,
  TOUR_ATTRACTION_CAT1,
  TOUR_ATTRACTION_CAT2_BY_CAT1,
} from '../src/pages/Home/lib/koreaTourAttractionCategories.js';
import { createClient } from '@supabase/supabase-js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

assert(TOUR_ATTRACTION_CAT1.length === 2, 'cat1 majors = 자연·인문');
assert(
  TOUR_ATTRACTION_CAT1.every((c) => c.code && c.label),
  'cat1 chips have code+label',
);
assert(
  (TOUR_ATTRACTION_CAT2_BY_CAT1.A01 || []).length === 2,
  'A01 sub count=2',
);
assert(
  (TOUR_ATTRACTION_CAT2_BY_CAT1.A02 || []).length === 5,
  'A02 sub count=5',
);
assert(normalizeTourAttractionCat1('a01') === 'A01', 'normalize cat1 case');
assert(normalizeTourAttractionCat1('전체') === null, 'reject invalid cat1');
assert(normalizeTourAttractionCat2('A01', 'A0101') === 'A0101', 'normalize cat2');
assert(
  normalizeTourAttractionCat2('A01', 'A0201') === null,
  'reject cat2 outside major',
);
assert(listTourAttractionCat2('A02').length === 5, 'list cat2 for A02');
assert(labelTourAttractionCat1('A01') === '자연', 'label cat1');
assert(labelTourAttractionCat2('A02', 'A0205') === '건축·조형물', 'label cat2');

const url = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const anon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (url && anon) {
  const sb = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { count, error } = await sb
    .from('tourapi_attraction')
    .select('content_id', { count: 'exact', head: true })
    .eq('active', true)
    .eq('content_type_id', '12')
    .eq('cat1', 'A01')
    .in('area_code', ['1', '2', '31']);
  assert(!error, `DB cat1 filter (${error?.message || 'ok'})`);
  assert(typeof count === 'number' && count >= 1, `수도권·자연 ≥1 (got ${count})`);

  const { count: c2, error: e2 } = await sb
    .from('tourapi_attraction')
    .select('content_id', { count: 'exact', head: true })
    .eq('active', true)
    .eq('content_type_id', '12')
    .eq('cat2', 'A0201')
    .in('area_code', ['1', '2', '31']);
  assert(!e2, `DB cat2 filter (${e2?.message || 'ok'})`);
  assert(typeof c2 === 'number' && c2 >= 1, `수도권·역사관광지 ≥1 (got ${c2})`);
} else {
  console.log('SKIP  DB filter (no supabase env)');
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nPASS smoke:korea-scenic-categories');
