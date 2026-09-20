/** place_stats 조회용 place_id 후보 (slug · 한글명 · 영문 도시) */
export function curationPlaceStatsCandidates(parsedData, catalogSpot = null) {
  const out = [];
  const seen = new Set();
  const push = (value) => {
    const s = String(value ?? '').trim();
    if (!s || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  if (catalogSpot && typeof catalogSpot === 'object') {
    const slug = String(catalogSpot.slug || catalogSpot.canonical_slug || '')
      .trim()
      .toLowerCase();
    if (slug) push(slug);
    push(catalogSpot.name);
    push(catalogSpot.name_en);
  }

  const slug = String(parsedData?.slug || '').trim().toLowerCase();
  if (slug) push(slug);

  const location = String(parsedData?.location || '').trim();
  if (location) push(location);

  const locationEn = String(parsedData?.locationEn || '').trim();
  if (locationEn) {
    push(locationEn);
    const city = locationEn.split(',')[0].trim();
    if (city) push(city);
  }

  return out;
}

/** place_stats 행에서 대표 이미지 URL 추출 */
export function pickImageFromPlaceStatsRow(row) {
  if (!row || typeof row !== 'object') return null;

  const thumb = String(row.image_url || '').trim();
  if (thumb.startsWith('http')) {
    return { imageUrl: thumb, imageSource: 'place_stats' };
  }

  const gallery = Array.isArray(row.gallery_urls) ? row.gallery_urls : [];
  for (const img of gallery) {
    if (!img || typeof img !== 'object') continue;
    const url = String(img.urls?.regular || img.urls?.small || img.url || '').trim();
    if (url.startsWith('http')) {
      return { imageUrl: url, imageSource: 'place_stats' };
    }
  }
  return null;
}

/** 여러 place_stats 행 + 후보 순서 → 첫 유효 이미지 */
export function pickImageFromPlaceStatsRows(rows, candidates) {
  if (!Array.isArray(rows) || !Array.isArray(candidates)) {
    return { imageUrl: null, imageSource: null };
  }
  const byId = new Map(rows.map((row) => [row?.place_id, row]));
  for (const id of candidates) {
    const picked = pickImageFromPlaceStatsRow(byId.get(id));
    if (picked?.imageUrl) return picked;
  }
  return { imageUrl: null, imageSource: null };
}

/** 스톡 검색 쿼리 — 지명 단독보다 풍경 키워드를 넓게 */
export function buildCurationImageQueries(parsedData) {
  const queries = [];
  const push = (q) => {
    const s = String(q || '').trim();
    if (s && !queries.includes(s)) queries.push(s);
  };

  push(parsedData?.searchKeyword);

  const locationEn = String(parsedData?.locationEn || '').trim();
  if (locationEn) {
    const city = locationEn.split(',')[0].trim();
    if (city) {
      push(`${city} nature landscape`);
      push(`${city} tropical island lagoon beach`);
      push(`${locationEn} beach lagoon`);
    }
  }

  push(parsedData?.location);
  return queries;
}
