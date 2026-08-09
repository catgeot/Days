/**
 * GATEO 선정 명소 — 잔여 contentId 보강.
 * 1) DB 엄격 매칭 2) areaBasedList(시·군) 3) searchKeyword(잔여·addr/hub 검증)
 * searchKeyword는 잔여만·throttle — 429 시 중단.
 *
 *   node scripts/fill-korea-scenic-spot-content-ids.mjs
 *   node scripts/fill-korea-scenic-spot-content-ids.mjs --dry-run
 *   node scripts/fill-korea-scenic-spot-content-ids.mjs --limit=30
 *   node scripts/fill-korea-scenic-spot-content-ids.mjs --db-only
 *   node scripts/fill-korea-scenic-spot-content-ids.mjs --keyword-only
 *
 * Auth: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
 * 쓰기: scripts/data/korea-scenic-spots-overrides.mjs → generate:korea-scenic-spots
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { loadEnvFile } from './lib/load-env-file.mjs';

loadEnvFile();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCENIC_PATH = join(ROOT, 'src/pages/Home/data/koreaScenicSpots.json');
const SIGUNGU_PATH = join(ROOT, 'src/pages/Home/data/koreaSigunguByHub.json');
const HUBS_PATH = join(ROOT, 'src/pages/Home/data/cityAttractionHubs.json');
const OVERRIDES_PATH = join(__dirname, 'data/korea-scenic-spots-overrides.mjs');

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dbOnly = args.includes('--db-only');
const keywordOnly = args.includes('--keyword-only');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) || 0 : 0;

const GENERIC_RE =
  /^(성지|적벽|공원|시장|해변|해수욕장|폭포|산|강|댐|섬|마을|박물관|기념관|타워|다리|온천|리조트|숲|계곡|체육공원)$/;
const COMMERCIAL_RE =
  /점$|매장|올리브영|다이소|편의점|카페|식당|호텔|펜션|모텔|콘도|약국|병원|은행|마트|백화점|아울렛|휴대폰|치킨|버거|피자|양조장|체험장|도예|케이블카|유람선|모과나무|석등|하대석|당간/;

/** Tour 공식명과 GATEO 명이 다를 때 */
const KEYWORD_ALIASES = {
  평창올림픽기념관: [
    '2018 평창동계올림픽대회 및 동계패럴림픽대회 기념관',
    '평창동계올림픽대회 기념관',
    '평창올림픽기념관',
  ],
  '알펜시아 리조트': ['알펜시아리조트', '알펜시아 리조트'],
  용평리조트: ['모나용평', '용평리조트'],
  '고양 킨텍스': ['킨텍스', 'KINTEX'],
  '스타필드 하남': ['스타필드하남', '스타필드 하남'],
  '양평 들꽃수목원': ['들꽃수목원', '양평들꽃수목원'],
  '의왕 레일파크': ['의왕레일파크', '레일파크'],
  고창읍성: ['고창읍성', '고창 읍성'],
  선운사: ['선운사'],
  '화순 적벽': ['물염적벽', '화순적벽', '적벽'],
  운주사: ['운주사'],
  불갑사: ['불갑사'],
  대흥사: ['대흥사'],
  미륵사지: ['미륵사지'],
  벽골제: ['벽골제'],
  백사장해수욕장: ['백사장해수욕장'],
  무주덕유산리조트: ['무주덕유산리조트'],
  작천정: ['작괘천', '작천정계곡', '작괘천(작천정계곡)'],
  '진해 제황산공원': ['제황산공원'],
  '창원 주남저수지': ['주남저수지 철새도래지', '주남저수지'],
  '고성 공룡박물관': ['고성공룡박물관', '고성 공룡박물관'],
  '만연산 치유숲': ['만연산'],
  퍼플섬: ['반월도·박지도', '반월도', '박지도', '퍼플섬'],
  나로우주센터: ['나로우주센터 우주과학관', '나로우주센터'],
  평림댐: ['평림댐 장미공원', '평림댐'],
  황룡강: ['황룡강 생태공원', '황룡강'],
  불갑저수지: ['불갑저수지 수변공원', '불갑저수지'],
  칠곡보: ['칠곡보 생태공원', '칠곡보'],
  부항댐: ['부항댐 출렁다리', '김천 부항댐 물 문화관', '부항댐'],
  '성주 성밖숲': ['성주 경산리 성밖숲', '성밖숲'],
  '성주 가야산': ['가야산', '가야산국립공원'],
  '밀양 위양지': ['위양지', '위양지(위양지 이팝나무)'],
  원남저수지: ['원남저수지', '원남저수지(원남제)', '원남제'],
  금성산: ['금성산·비봉산(의성)', '금성산'],
  금오랜드: ['금오랜드 놀이동산', '금오랜드'],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripAnnotations(s) {
  return String(s || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/유네스코\s*세계유산/g, ' ')
    .replace(/국립공원|도립공원|군립공원/g, ' ')
    .trim();
}

function norm(s) {
  return stripAnnotations(s)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[·.,()/\[\]]/g, '')
    .replace(/관광지|국민관광지|일대$/g, '');
}

function hubToken(hub) {
  return String(hub?.name || hub?.hubId || '')
    .replace(/\s+/g, '')
    .replace(/(특별자치시|특별시|광역시|특별자치도|시|군|구)$/g, '');
}

/** addr/title 지역 힌트 — "경남 고성" → 경남고성·고성 */
function hubHints(hub) {
  const token = hubToken(hub);
  const hints = new Set();
  if (token && token.length >= 2) hints.add(token);
  const region = token.match(/^(경기|경남|경북|전남|전북|충남|충북|강원|제주)(.+)$/);
  if (region?.[2]?.length >= 2) hints.add(region[2]);
  for (const a of hub?.aliases || []) {
    const raw = String(a || '').replace(/\s+/g, '');
    const stripped = raw.replace(/(시|군|구)$/g, '');
    if (stripped.length >= 2) hints.add(stripped);
    const bare = raw.replace(/^(경기|경남|경북|전남|전북|충남|충북|강원|제주)/, '');
    if (bare.length >= 2 && bare !== raw) hints.add(bare.replace(/(시|군|구)$/g, ''));
  }
  return [...hints].filter((h) => h && h.length >= 2);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLon = toR(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function isCommercial(title, query) {
  if (/리조트/.test(query) && /스키장|눈썰매|루지|골프/.test(title)) return true;
  if (/리조트/.test(title) && /리조트/.test(query)) return false;
  if (/시장|마켓/.test(title) && /시장|마켓/.test(query)) return false;
  // 본체 대신 캠핑장만 걸리는 오매칭 방지
  if (/캠핑|야영|오토캠핑|캠프존/.test(title) && !/캠핑|야영/.test(query)) return true;
  return COMMERCIAL_RE.test(title);
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

function scoreHit(query, item, hub, spot) {
  const title = String(item?.title || '');
  const addr = String(item?.addr1 || item?.addr || '');
  const type = String(item?.contentTypeId || item?.contenttypeid || item?.content_type_id || '');
  const q = norm(query);
  const t = norm(title);
  if (!q || !t || q.length < 2 || GENERIC_RE.test(q)) return 0;
  // 허브명만 쿼리(예: 스타필드 하남 → 「하남」)로 엉뚱한 POI 매칭 금지
  const hubNorms = hubHints(hub).map((h) => norm(h)).filter(Boolean);
  if (hubNorms.includes(q)) return 0;

  const isMarket = /시장|마켓/.test(title) || /시장|마켓/.test(query);
  if (type && !['12', '14', '28'].includes(type) && !(type === '38' && isMarket)) {
    return 0;
  }
  if (isCommercial(title, query) && !isMarket) return 0;

  let score = 0;
  if (t === q) score = 100;
  else if (t.startsWith(q) || q.startsWith(t)) {
    const ratio = Math.max(t.length, q.length) / Math.min(t.length, q.length);
    // 주남저수지 철새도래지·칠곡보 생태공원 등 본명+시설 접미 허용
    if (ratio > 2.6) return 0;
    score = 88;
  } else if (t.includes(q)) {
    if (t.length / q.length > 2.6) return 0;
    score = 74;
  } else if (q.includes(t) && t.length >= 4) {
    if (q.length / t.length > 1.75) return 0;
    score = 70;
  } else return 0;

  // 본체명보다 긴 부속 시설명 감점 (눈썰매장·스키역사관 등)
  if (t.length > q.length + 2) score -= Math.min(20, (t.length - q.length) * 2);
  // 스키장·눈썰매·콘도 등 리조트 부속은 본체 매칭에서 제외
  if (/스키|눈썰매|루지|콘도|호텔|오션|역사관/.test(title) && !/스키|눈썰매/.test(query)) {
    return 0;
  }
  // includes/약한 매칭만 — 「유적공원」「자연사박물관」 단독 쿼리 오매칭 방지
  if (score <= 74) {
    const weakGeneric =
      q.length < 6 ||
      (/박물관$|공원$|온천$|시장$|저수지$|기념관$/.test(q) && !t.startsWith(q) && t !== q);
    if (weakGeneric) return 0;
  }

  if (type === '12') score += 12;
  else if (type === '14') score += 10;
  else if (type === '28') score += 6;
  else if (type === '38' && isMarket) score += 8;

  const token = hubToken(hub);
  const hints = hubHints(hub);
  const addrOk = hints.some((h) => addr.includes(h));
  if (addrOk) score += 8;
  else if (hints.some((h) => title.includes(h))) score += 4;
  else if (Number.isFinite(spot.lat) && Number.isFinite(spot.lng)) {
    const lat = Number(item.mapy ?? item.lat);
    const lng = Number(item.mapx ?? item.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const km = haversineKm(spot.lat, spot.lng, lat, lng);
      if (km <= 2.5) score += 2;
      else return 0;
    } else return 0;
  } else return 0;

  const paren = title.match(/\(([^)]+)\)/);
  if (paren) {
    const inside = norm(paren[1]);
    if (
      inside &&
      token &&
      !inside.includes(norm(token).slice(0, 2)) &&
      !q.includes(inside)
    ) {
      return 0;
    }
  }
  return score;
}

function spotQueries(spot, hub) {
  const queries = new Set([spot.name, spot.attractionName].filter(Boolean));
  for (const base of [...queries]) {
    for (const alias of KEYWORD_ALIASES[base] || []) queries.add(alias);
  }
  const stripTokens = new Set(hubHints(hub));
  for (const q of [...queries]) {
    for (const token of stripTokens) {
      const stripped = String(q)
        .replace(new RegExp(`^${escapeRe(token)}\\s*`), '')
        .trim();
      if (stripped && stripped.length >= 2 && !GENERIC_RE.test(norm(stripped))) {
        queries.add(stripped);
      }
    }
    // "진해 제황산공원" · "창원 주남저수지" → 뒤 토큰 (허브명만 남은 꼬리 제외)
    const parts = String(q).trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const tail = parts.slice(1).join(' ');
      const tailNorm = norm(tail);
      const isHubTail = [...stripTokens].some(
        (t) => norm(t) === tailNorm || tailNorm === norm(t).slice(0, tailNorm.length),
      );
      if (
        tail.length >= 2 &&
        !GENERIC_RE.test(tailNorm) &&
        !isHubTail &&
        tailNorm.length >= 3
      ) {
        queries.add(tail);
      }
    }
  }
  return [...queries];
}

function pickBest(spot, hub, items) {
  let best = null;
  const queries = spotQueries(spot, hub);
  for (const item of items || []) {
    const contentId = String(item.contentId || item.contentid || item.content_id || '').trim();
    if (!/^\d{1,32}$/.test(contentId)) continue;
    for (const q of queries) {
      const sc = scoreHit(q, item, hub, spot);
      if (sc >= 80 && (!best || sc > best.score)) {
        best = {
          contentId,
          tourTitle: String(item.title || '').trim(),
          score: sc,
          query: q,
        };
      }
    }
  }
  return best;
}

async function fetchAreaItems(areaCode, sigunguCode) {
  const types = ['12', '14', '28', '38'];
  const byId = new Map();
  for (const contentTypeId of types) {
    for (let pageNo = 1; pageNo <= 8; pageNo += 1) {
      const res = await tourEdge('areaBasedList', {
        areaCode: String(areaCode),
        sigunguCode: String(sigunguCode),
        contentTypeId,
        numOfRows: 50,
        pageNo,
      });
      await sleep(160);
      if (!res.ok) {
        if (/429/.test(String(res.message || ''))) {
          console.warn(`[areaBased] 429 type=${contentTypeId} page=${pageNo}`);
          await sleep(1200);
          break;
        }
        break;
      }
      const items = res.items || [];
      for (const it of items) {
        const id = String(it.contentId || it.contentid || '').trim();
        if (id) byId.set(id, it);
      }
      if (items.length < 50) break;
    }
  }
  return [...byId.values()];
}

async function fetchKeywordItems(keyword) {
  const res = await tourEdge('searchKeyword', {
    keyword: String(keyword),
    numOfRows: 20,
    pageNo: 1,
  });
  await sleep(220);
  if (!res.ok) {
    if (/429/.test(String(res.message || ''))) {
      return { ok: false, rateLimited: true, items: [], message: res.message };
    }
    return { ok: false, rateLimited: false, items: [], message: res.message };
  }
  return { ok: true, rateLimited: false, items: res.items || [], message: 'OK' };
}

async function confirmDetail(contentId) {
  const detail = await tourEdge('detailCommon', { contentId });
  await sleep(120);
  const row = detail.items?.[0];
  const overview = String(row?.overview || '').trim();
  const img = String(row?.firstimage || row?.imageUrl || '').trim();
  if (!overview && !img) return null;
  return {
    tourTitle: String(row?.title || '').trim(),
    overview,
    img,
  };
}

async function loadDbRows(sb) {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('tourapi_attraction')
      .select(
        'content_id,title,addr1,mapx,mapy,content_type_id,first_image,active,area_code,sigungu_code',
      )
      .eq('active', true)
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    all.push(
      ...data.map((r) => ({
        contentId: String(r.content_id),
        title: r.title,
        addr1: r.addr1,
        mapx: r.mapx,
        mapy: r.mapy,
        contentTypeId: String(r.content_type_id || ''),
        areaCode: r.area_code != null ? String(r.area_code) : '',
        sigunguCode: r.sigungu_code != null ? String(r.sigungu_code) : '',
      })),
    );
    from += 1000;
    if (data.length < 1000) break;
  }
  return all;
}

/** overrides.mjs 블록에서 contentId null인 spot id 목록 */
function nullIdsFromOverrides(source) {
  const ids = new Set();
  const blocks = source.split(/\n\s*\{\n/);
  for (const block of blocks) {
    const idM = block.match(/^\s*order:\s*\d+,\s*\n\s*id:\s*'([^']+)'/);
    if (!idM) continue;
    const cidM = block.match(/contentId:\s*(null|'[^']*')\s*,/);
    if (cidM && cidM[1] === 'null') ids.add(idM[1]);
  }
  return ids;
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyOverrides(source, hitsById) {
  let text = source;
  let applied = 0;
  for (const [id, hit] of hitsById) {
    const idRe = new RegExp(
      `(id:\\s*'${escapeRe(id)}',[\\s\\S]*?contentId:\\s*)null(\\s*,)`,
    );
    if (!idRe.test(text)) {
      console.warn(`[skip-write] pattern miss ${id}`);
      continue;
    }
    text = text.replace(idRe, `$1'${hit.contentId}'$2`);
    applied += 1;
  }
  return { text, applied };
}

async function main() {
  const scenic = JSON.parse(readFileSync(SCENIC_PATH, 'utf8'));
  const sigungu = JSON.parse(readFileSync(SIGUNGU_PATH, 'utf8'));
  const hubsJson = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));
  const hubList = Array.isArray(hubsJson) ? hubsJson : hubsJson.hubs || [];
  const hubById = new Map(hubList.map((h) => [String(h.hubId).toLowerCase(), h]));
  const byHubSig = sigungu.byHubId || {};
  const overridesSrc = readFileSync(OVERRIDES_PATH, 'utf8');
  const nullOverrideIds = nullIdsFromOverrides(overridesSrc);

  const nulls = (scenic.spots || []).filter(
    (s) => nullOverrideIds.has(s.id) || !s.contentId,
  ).filter((s) => nullOverrideIds.has(s.id));
  const targets = limit > 0 ? nulls.slice(0, limit) : nulls;
  console.log(
    `[fill-scenic-contentId] overrideNull=${nullOverrideIds.size} targets=${targets.length}${
      dbOnly ? ' · db-only' : ''
    }${keywordOnly ? ' · keyword-only' : ''}`,
  );

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
  /** @type {Map<string, { contentId: string, tourTitle: string, score: number, src: string }>} */
  const hits = new Map();

  // 1) offline DB pass — 전국 + hub 시군구 필터 (--keyword-only면 생략)
  if (!keywordOnly) {
    const dbRows = await loadDbRows(sb);
    console.log(`[fill-scenic-contentId] DB rows=${dbRows.length}`);
    for (const spot of targets) {
      const hub = hubById.get(String(spot.hubId).toLowerCase()) || {
        hubId: spot.hubId,
        name: spot.hubId,
      };
      const sig = byHubSig[String(spot.hubId).toLowerCase()];
      const scoped =
        sig?.areaCode != null && sig.sigunguCode != null
          ? dbRows.filter(
              (r) =>
                r.areaCode === String(sig.areaCode) &&
                r.sigunguCode === String(sig.sigunguCode),
            )
          : dbRows;
      const best =
        pickBest(spot, hub, scoped) ||
        (scoped !== dbRows ? pickBest(spot, hub, dbRows) : null);
      if (best) {
        hits.set(spot.id, { ...best, src: 'db' });
        console.log(`OK  DB  ${spot.name} → ${best.contentId} ${best.tourTitle} (${best.score})`);
      }
    }
  }

  // 2) areaBased LIVE per hub (--db-only / --keyword-only면 생략)
  if (!dbOnly && !keywordOnly) {
    const byHub = new Map();
    for (const spot of targets) {
      if (hits.has(spot.id)) continue;
      const hid = String(spot.hubId).toLowerCase();
      if (!byHub.has(hid)) byHub.set(hid, []);
      byHub.get(hid).push(spot);
    }

    for (const [hubId, spots] of byHub) {
      const sig = byHubSig[hubId];
      if (!sig?.areaCode || sig.sigunguCode == null) {
        console.warn(`[skip-hub] no sigungu ${hubId}`);
        continue;
      }
      const hub = hubById.get(hubId) || { hubId, name: hubId };
      process.stdout.write(
        `LIVE area ${hubId} (${sig.areaCode}/${sig.sigunguCode}) spots=${spots.length} … `,
      );
      const items = await fetchAreaItems(sig.areaCode, sig.sigunguCode);
      console.log(`items=${items.length}`);
      for (const spot of spots) {
        const best = pickBest(spot, hub, items);
        if (!best) continue;
        const confirmed = await confirmDetail(best.contentId);
        if (!confirmed) {
          console.log(`MISS detail empty ${spot.name} (${best.contentId})`);
          continue;
        }
        hits.set(spot.id, {
          ...best,
          tourTitle: confirmed.tourTitle || best.tourTitle,
          src: 'areaBased',
        });
        console.log(
          `OK  AREA ${spot.name} → ${best.contentId} ${confirmed.tourTitle || best.tourTitle} (${best.score})`,
        );
      }
    }
  }

  // 3) searchKeyword — areaBased에 없는 본명(유네스코·사찰 등). 잔여만 · 429면 중단
  if (!dbOnly) {
    const remain = targets.filter((s) => !hits.has(s.id));
    console.log(`[fill-scenic-contentId] keyword pass remain=${remain.length}`);
    let rateLimited = false;
    for (const spot of remain) {
      if (rateLimited) break;
      const hub = hubById.get(String(spot.hubId).toLowerCase()) || {
        hubId: spot.hubId,
        name: spot.hubId,
      };
      const queries = spotQueries(spot, hub);
      /** @type {{ contentId: string, tourTitle: string, score: number, query: string } | null} */
      let best = null;
      for (const q of queries) {
        if (rateLimited) break;
        const res = await fetchKeywordItems(q);
        if (res.rateLimited) {
          console.warn(`[keyword] 429 — stop keyword pass at ${spot.name}`);
          rateLimited = true;
          break;
        }
        if (!res.ok || !res.items.length) continue;
        const hit = pickBest(spot, hub, res.items);
        if (hit && (!best || hit.score > best.score)) best = hit;
      }
      if (!best) {
        console.log(`MISS KW  ${spot.name}`);
        continue;
      }
      const confirmed = await confirmDetail(best.contentId);
      if (!confirmed) {
        console.log(`MISS detail empty ${spot.name} (${best.contentId})`);
        continue;
      }
      hits.set(spot.id, {
        ...best,
        tourTitle: confirmed.tourTitle || best.tourTitle,
        src: 'keyword',
      });
      console.log(
        `OK  KW   ${spot.name} → ${best.contentId} ${confirmed.tourTitle || best.tourTitle} (${best.score})`,
      );
    }
  }

  console.log(
    `\nsummary hits=${hits.size}/${targets.length} (remain null ≈ ${nulls.length - hits.size})`,
  );
  if (dryRun) {
    console.log('dry-run: overrides not written');
    for (const [id, h] of hits) {
      console.log(`  ${id} ${h.contentId} ${h.tourTitle} [${h.src}]`);
    }
    return;
  }
  if (!hits.size) {
    console.log('no hits — nothing to write');
    return;
  }

  const src = overridesSrc;
  const { text, applied } = applyOverrides(src, hits);
  if (applied !== hits.size) {
    console.warn(`[write] applied=${applied} expected=${hits.size}`);
  }
  writeFileSync(OVERRIDES_PATH, text, 'utf8');
  console.log(`wrote ${applied} contentId → ${OVERRIDES_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
