#!/usr/bin/env node
/**
 * TourAPI 한국관광공사 사진갤러리(searchPhoto) 조회 헬퍼.
 * 자체 큐레이션 작업 시 고화질 사진 및 갤러리 URL 수집용.
 *
 *   node scripts/search-tourapi-photos.mjs "울진 금강소나무숲길"
 *   node scripts/search-tourapi-photos.mjs "비내섬"
 */
import { loadEnvFile } from './lib/load-env-file.mjs';

loadEnvFile();

const keyword = process.argv[2];
if (!keyword) {
  console.error('Usage: node scripts/search-tourapi-photos.mjs <keyword>');
  process.exit(1);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required.');
  process.exit(1);
}

async function search() {
  const url = SUPABASE_URL.replace(/\/+$/, '') + '/functions/v1/tourapi-proxy';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ action: 'searchPhoto', keyword: keyword.trim() }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    console.error(`Fetch failed (${res.status}):`, data.message || data.error);
    process.exit(1);
  }

  const items = Array.isArray(data.items) ? data.items : [];
  console.log(`[searchPhoto] "${keyword}": ${items.length}건 (rawCount: ${data.rawCount ?? 0})`);

  items.slice(0, 10).forEach((item, idx) => {
    const imgUrl = item.imageUrl || item.galWebImageUrl;
    console.log(`  [${idx + 1}] ${item.title || '-'} | 작가: ${item.photographer || item.galPhotographer || '-'} | 주소: ${item.addr1 || '-'}`);
    console.log(`      URL: ${imgUrl}`);
  });
}

search();
