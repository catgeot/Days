#!/usr/bin/env node
/**
 * LIVE Pexels 검색 스모크 — VITE_PEXELS_API_KEY 또는 PEXELS_API_KEY 필요.
 * Whakarewarewa Village 키워드로 API 응답 1건 이상 확인.
 */
const apiKey = process.env.VITE_PEXELS_API_KEY || process.env.PEXELS_API_KEY;

if (!apiKey) {
  console.log('smoke:place-gallery-pexels-live SKIP (no Pexels API key)');
  process.exit(0);
}

const query = 'Whakarewarewa Village';
const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&page=1`;

const response = await fetch(url, {
  headers: { Authorization: apiKey },
});

if (!response.ok) {
  console.error(`smoke:place-gallery-pexels-live FAIL HTTP ${response.status}`);
  process.exit(1);
}

const data = await response.json();
const count = Array.isArray(data.photos) ? data.photos.length : 0;

if (count < 1) {
  console.error(`smoke:place-gallery-pexels-live FAIL 0 photos for "${query}"`);
  process.exit(1);
}

console.log(`smoke:place-gallery-pexels-live PASS (${count} photos for "${query}")`);
