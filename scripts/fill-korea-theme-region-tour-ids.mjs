/**
 * 방방곡곡 명소 contentId 전수 채움 (오프라인 SSOT).
 * runtime searchKeyword 금지 — 이 스크립트만 LIVE 조회.
 *
 *   node scripts/fill-korea-theme-region-tour-ids.mjs
 *   node scripts/fill-korea-theme-region-tour-ids.mjs --limit=20
 *   node scripts/fill-korea-theme-region-tour-ids.mjs --dry-run
 *
 * Auth: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY → Edge tourapi-proxy
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile } from './lib/load-env-file.mjs';
import scenic from '../src/pages/Home/data/koreaScenicSpots.json' with { type: 'json' };
import top10 from '../src/pages/Home/data/koreaTop10Scenic.json' with { type: 'json' };
import tour from '../src/pages/Home/data/travelSpotTourApi.json' with { type: 'json' };
import { KOREA_THEME_REGION_TOUR_OVERRIDES } from './data/korea-theme-region-tour-overrides.mjs';
import {
  listKoreaThemeAreas,
  listKoreaThemeRegionAttractions,
} from '../src/pages/Home/lib/koreaThemeRegions.js';

loadEnvFile();

const __dirname = dirname(fileURLToPath(import.meta.url));
const OVERRIDES_PATH = join(
  __dirname,
  'data/korea-theme-region-tour-overrides.mjs',
);

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '')
  .trim()
  .replace(/\/$/, '');
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) || 0 : 0;

/** 수동 별칭 — Tour 공식명과 hub 명이 다를 때 */
const KEYWORD_ALIASES = {
  보성녹차밭: ['대한다원', '보성녹차밭'],
  주상절리대: ['대포주상절리', '주상절리대'],
  해운대·광안야경: ['해운대해수욕장'],
  '해운대·광안 야경': ['해운대해수욕장'],
  불국사·석굴암일대: ['불국사'],
  '불국사·석굴암 일대': ['불국사'],
  통영·한려경관: ['통영케이블카'],
  '통영·한려 경관': ['통영케이블카'],
  홍대: ['홍대거리', '홍익대학교거리', '홍대'],
  인천차이나타운: ['차이나타운', '인천 차이나타운', '인천차이나타운'],
  송도센트럴파크: ['송도 센트럴파크', '센트럴파크', '송도센트럴파크'],
  동성로: ['대구 동성로', '동성로'],
  서문시장: ['대구 서문시장', '서문시장'],
  자갈치시장: ['자갈치시장'],
  광안리: ['광안리해수욕장', '광안리'],
  도산서원: ['도산서원 [유네스코 세계유산]', '도산서원'],
  봉정사: ['봉정사 [유네스코 세계유산]', '봉정사'],
  만장굴: ['만장굴', '만장굴 (제주도 국가지질공원)'],
  경기전: ['전주 경기전', '경기전'],
  해금강: ['거제도 해금강', '해금강'],
  동피랑벽화마을: ['동피랑마을', '동피랑'],
  석굴암: ['경주 석굴암', '석굴암'],
  갓바위: ['팔공산 갓바위', '갓바위'],
  국립아시아문화전당: ['국립아시아문화전당'],
  수원화성박물관: ['수원화성박물관'],
  군산근대역사박물관: ['군산근대역사박물관'],
  자갈치시장: ['부산 자갈치시장', '자갈치시장'],
  '계족산 황톳길': ['장동산림욕장', '계족산', '계족산 황톳길'],
  신중앙시장: ['대전 중앙시장', '중앙시장', '신중앙시장'],
  마곡사: ['마곡사 [유네스코 세계유산]', '마곡사'],
  무령왕릉: ['공주 무령왕릉과 왕릉원', '무령왕릉'],
  병산서원: ['병산서원 [유네스코 세계유산]', '병산서원'],
  외도보타니아: ['외도 보타니아', '외도보타니아'],
  '남해 독일마을': ['남해독일마을', '독일마을'],
  제주돌문화공원: ['제주돌문화공원'],
  동문시장: ['동문재래시장', '동문시장'],
};

const COMMERCIAL_RE =
  /점$|매장|올리브영|다이소|편의점|카페|식당|호텔|펜션|모텔|리조트|약국|병원|은행|마트|백화점|아울렛|휴대폰|폰케이스|치킨|버거|피자/;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[·.,()/]/g, '');
}

async function tourEdge(action, body) {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error('Need VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON}`,
      apikey: SUPABASE_ANON,
    },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json().catch(() => null);
  if (!data?.ok) {
    return {
      ok: false,
      items: [],
      message: data?.message || data?.error || `HTTP ${res.status}`,
    };
  }
  return { ok: true, items: data.items || [], message: 'OK' };
}

function seedMaps() {
  /** @type {Map<string, { contentId: string, tourTitle: string }>} */
  const bySlug = new Map();
  /** @type {Map<string, { contentId: string, tourTitle: string }>} */
  const byName = new Map();

  const put = (slug, name, contentId, title) => {
    const id = String(contentId || '').trim();
    if (!/^\d{1,32}$/.test(id)) return;
    const entry = { contentId: id, tourTitle: String(title || name || '').trim() };
    if (slug) bySlug.set(String(slug).toLowerCase(), entry);
    if (name) byName.set(norm(name), entry);
  };

  for (const [slug, e] of Object.entries(tour.spots || {})) {
    put(slug, e.title, e.contentId, e.title);
  }
  for (const [name, slug] of Object.entries(tour.byName || {})) {
    const e = tour.spots?.[slug];
    if (e?.contentId) put(slug, name, e.contentId, e.title);
  }
  for (const s of [...(scenic.spots || []), ...(top10.spots || [])]) {
    put(s.placeSlug, s.name, s.contentId, s.name);
    put(s.placeSlug, s.attractionName, s.contentId, s.name);
  }
  for (const [key, e] of Object.entries(
    KOREA_THEME_REGION_TOUR_OVERRIDES.byAttractionId || {},
  )) {
    const parts = key.split(':');
    const slug = parts.slice(1).join(':');
    put(slug, null, e.contentId, e.tourTitle);
  }

  return { bySlug, byName };
}

function scoreHit(query, item, areaName) {
  const title = String(item?.title || '');
  const addr = String(item?.addr1 || item?.addr || '');
  const type = String(item?.contentTypeId || item?.contenttypeid || '');
  const q = norm(query);
  const t = norm(title);
  if (!q || !t) return 0;
  // 관광지(12)·문화시설(14)·레포츠(28) · 시장은 쇼핑(38) 허용
  const isMarket = /시장|마켓/.test(title) || /시장|마켓/.test(query);
  if (type && !['12', '14', '28'].includes(type) && !(type === '38' && isMarket)) {
    return 0;
  }
  if (COMMERCIAL_RE.test(title) && !isMarket) return 0;

  let score = 0;
  // 괄호 안 다른 지역명 오탐 (도산서원(고성) 등)
  const paren = title.match(/\(([^)]+)\)/);
  if (paren) {
    const inside = norm(paren[1]);
    const area = norm(areaName);
    if (
      inside &&
      area &&
      !inside.includes(area.slice(0, 2)) &&
      !q.includes(inside)
    ) {
      return 0;
    }
  }

  // 유네스코·괄호 부가 문구는 길이비에서 제외
  const tCore = t
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();
  if (t === q || tCore === q) score += 100;
  else if (t.startsWith(q) || tCore.startsWith(q) || q.startsWith(tCore)) {
    const ratio =
      Math.max(tCore.length || t.length, q.length) /
      Math.min(tCore.length || t.length, q.length);
    if (ratio > 2.8) return 0;
    score += 88;
  } else if (t.includes(q) || tCore.includes(q)) {
    const ratio = (tCore.length || t.length) / q.length;
    if (ratio > 3.2) return 0;
    score += 72;
  } else if (q.includes(tCore) && tCore.length >= 3) {
    const ratio = q.length / tCore.length;
    if (ratio > 2.5) return 0;
    score += 68;
  } else {
    return 0;
  }

  if (type === '12') score += 12;
  else if (type === '14') score += 10;
  else if (type === '28') score += 6;
  else if (type === '38' && isMarket) score += 8;
  const area = norm(areaName);
  if (area && area.length >= 2 && norm(addr).includes(area.slice(0, 2))) {
    score += 6;
  }
  if (title.includes('유네스코')) score += 5;
  if (title.length <= query.length + 10) score += 4;
  return score;
}

function pickBest(query, items, areaName) {
  let best = null;
  let bestScore = 0;
  for (const item of items || []) {
    const contentId = String(item.contentId || item.contentid || '').trim();
    if (!/^\d{1,32}$/.test(contentId)) continue;
    const sc = scoreHit(query, item, areaName);
    if (sc > bestScore) {
      bestScore = sc;
      best = {
        contentId,
        tourTitle: String(item.title || '').trim(),
        score: sc,
      };
    }
  }
  if (!best || bestScore < 70) return null;
  return best;
}

function hubToken(hubName) {
  return String(hubName || '')
    .replace(/\s+/g, '')
    .replace(/(시|군|구)$/g, '');
}

function addrMatchesHub(addr, hubName, areaName) {
  const a = String(addr || '');
  const token = hubToken(hubName);
  if (token && a.includes(token)) return true;
  // 광역시·도 단위 느슨 매칭 (서울/부산 등)
  const area = String(areaName || '');
  if (area && a.includes(area)) return true;
  return false;
}

async function resolveLive(name, areaName, hubName) {
  const base = KEYWORD_ALIASES[name] || [name];
  const hub = hubToken(hubName);
  const keywords = [
    ...base,
    ...(hub ? base.map((k) => `${hub} ${k}`) : []),
  ];
  const seen = new Set();
  for (const keyword of keywords) {
    if (!keyword || seen.has(keyword)) continue;
    seen.add(keyword);
    const res = await tourEdge('searchKeyword', {
      keyword,
      numOfRows: 10,
      pageNo: 1,
    });
    await sleep(140);
    if (!res.ok) continue;
    const picked =
      pickBest(name, res.items, areaName) ||
      pickBest(keyword, res.items, areaName);
    if (!picked) continue;
    const detail = await tourEdge('detailCommon', {
      contentId: picked.contentId,
    });
    await sleep(120);
    const row = detail.items?.[0];
    const overview = String(row?.overview || '').trim();
    const img = String(row?.firstimage || row?.imageUrl || '').trim();
    if (!overview && !img) continue;
    const addr = String(row?.addr1 || '');
    const title = String(row?.title || picked.tourTitle || '').trim();
    if (!addrMatchesHub(addr, hubName, areaName)) {
      // 허브 행정명과 달라도 제목에 허브명이 있으면 허용 (낙산사·융건릉 등 인근)
      if (!(hub && title.includes(hub))) continue;
    }
    return { contentId: picked.contentId, tourTitle: title };
  }
  return null;
}

function writeOverrides(map) {
  const keys = Object.keys(map).sort();
  const lines = [
    '/**',
    ' * 방방곡곡 명소 → TourAPI contentId (type12).',
    ' * `npm run generate:korea-theme-region-tour` → koreaThemeRegionTour.json',
    ' *',
    ' * key = `${hubId}:${placeSlug}`',
    ' * fill: `node scripts/fill-korea-theme-region-tour-ids.mjs`',
    ' */',
    'export const KOREA_THEME_REGION_TOUR_OVERRIDES = {',
    '  byAttractionId: {',
  ];
  for (const key of keys) {
    const e = map[key];
    const title = String(e.tourTitle || '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'");
    lines.push(
      `    '${key}': { contentId: '${e.contentId}', tourTitle: '${title}' },`,
    );
  }
  lines.push('  },', '};', '');
  writeFileSync(OVERRIDES_PATH, lines.join('\n'), 'utf8');
}

async function main() {
  const { bySlug, byName } = seedMaps();
  /** @type {Record<string, { contentId: string, tourTitle: string }>} */
  const out = {
    ...(KOREA_THEME_REGION_TOUR_OVERRIDES.byAttractionId || {}),
  };

  const attractions = [];
  for (const area of listKoreaThemeAreas()) {
    for (const a of listKoreaThemeRegionAttractions(area.areaCode)) {
      attractions.push(a);
    }
  }

  let seeded = 0;
  let liveHit = 0;
  let miss = 0;
  let searched = 0;

  for (const a of attractions) {
    if (out[a.id]?.contentId) {
      seeded += 1;
      continue;
    }
    const fromSlug = bySlug.get(String(a.placeSlug || '').toLowerCase());
    if (fromSlug) {
      out[a.id] = fromSlug;
      seeded += 1;
      continue;
    }
    const fromName = byName.get(norm(a.name));
    if (fromName) {
      out[a.id] = fromName;
      seeded += 1;
      continue;
    }

    if (limit && searched >= limit) {
      miss += 1;
      continue;
    }
    searched += 1;
    process.stdout.write(`LIVE  ${a.id} (${a.name}) … `);
    const hit = await resolveLive(a.name, a.areaName, a.hubName);
    if (hit) {
      out[a.id] = hit;
      liveHit += 1;
      console.log(`OK ${hit.contentId} ${hit.tourTitle}`);
    } else {
      miss += 1;
      console.log('MISS');
    }
  }

  console.log(
    `\nsummary  total=${attractions.length} seeded=${seeded} liveHit=${liveHit} miss=${miss} mapped=${Object.keys(out).length}`,
  );

  if (dryRun) {
    console.log('dry-run: overrides not written');
    return;
  }
  writeOverrides(out);
  console.log(`wrote ${Object.keys(out).length} → ${OVERRIDES_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
