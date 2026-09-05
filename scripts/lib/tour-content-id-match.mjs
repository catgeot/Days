/**
 * TourAPI contentId 매칭 — DB/searchKeyword 공통 스코어링.
 * scenic overrides · 팔경 멤버 fill 공유.
 */
import { createClient } from '@supabase/supabase-js';

export const GENERIC_RE =
  /^(성지|적벽|공원|시장|해변|해수욕장|폭포|산|강|댐|섬|마을|박물관|기념관|타워|다리|온천|리조트|숲|계곡|체육공원)$/;
export const COMMERCIAL_RE =
  /점$|매장|올리브영|다이소|편의점|카페|식당|호텔|펜션|모텔|콘도|약국|병원|은행|마트|백화점|아울렛|휴대폰|치킨|버거|피자|양조장|체험장|도예|케이블카|유람선|모과나무|석등|하대석|당간/;

export const KEYWORD_ALIASES = {
  작천정: ['작괘천', '작천정계곡', '작괘천(작천정계곡)'],
  '고성 공룡박물관': ['고성공룡박물관', '고성 공룡박물관'],
  진남교반: ['진남교반(문경)', '문경 진남교반'],
};

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function normalizeKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function stripAnnotations(s) {
  return String(s || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/유네스코\s*세계유산/g, ' ')
    .replace(/국립공원|도립공원|군립공원/g, ' ')
    .trim();
}

export function norm(s) {
  return stripAnnotations(s)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[·.,()/\[\]]/g, '')
    .replace(/관광지|국민관광지|일대$/g, '');
}

export function hubToken(hub) {
  return String(hub?.name || hub?.hubId || '')
    .replace(/\s+/g, '')
    .replace(/(특별자치시|특별시|광역시|특별자치도|시|군|구)$/g, '');
}

export function hubHints(hub) {
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
  if (/캠핑|야영|오토캠핑|캠프존/.test(title) && !/캠핑|야영/.test(query)) return true;
  return COMMERCIAL_RE.test(title);
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function memberQueries(member, hub) {
  const name = member.attractionName || member.name || '';
  const queries = new Set([name].filter(Boolean));
  for (const alias of KEYWORD_ALIASES[name] || []) queries.add(alias);
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

export function scoreHit(query, item, hub, member) {
  const title = String(item?.title || '');
  const addr = String(item?.addr1 || item?.addr || '');
  const type = String(item?.contentTypeId || item?.contenttypeid || item?.content_type_id || '');
  const q = norm(query);
  const t = norm(title);
  if (!q || !t || q.length < 2 || GENERIC_RE.test(q)) return 0;
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
    if (ratio > 2.6) return 0;
    score = 88;
  } else if (t.includes(q)) {
    if (t.length / q.length > 2.6) return 0;
    score = 74;
  } else if (q.includes(t) && t.length >= 4) {
    if (q.length / t.length > 1.75) return 0;
    score = 70;
  } else return 0;

  if (t.length > q.length + 2) score -= Math.min(20, (t.length - q.length) * 2);
  if (/스키|눈썰매|루지|콘도|호텔|오션|역사관/.test(title) && !/스키|눈썰매/.test(query)) {
    return 0;
  }
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

  const hints = hubHints(hub);
  const addrOk = hints.some((h) => addr.includes(h));
  if (addrOk) score += 8;
  else if (hints.some((h) => title.includes(h))) score += 4;
  else if (Number.isFinite(member.lat) && Number.isFinite(member.lng)) {
    const lat = Number(item.mapy ?? item.lat);
    const lng = Number(item.mapx ?? item.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const km = haversineKm(member.lat, member.lng, lat, lng);
      if (km <= 2.5) score += 2;
      else return 0;
    } else return 0;
  } else return 0;

  const paren = title.match(/\(([^)]+)\)/);
  if (paren) {
    const inside = norm(paren[1]);
    const token = hubToken(hub);
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

export function pickBest(member, hub, items) {
  let best = null;
  const queries = memberQueries(member, hub);
  for (const item of items || []) {
    const contentId = String(item.contentId || item.contentid || item.content_id || '').trim();
    if (!/^\d{1,32}$/.test(contentId)) continue;
    for (const q of queries) {
      const sc = scoreHit(q, item, hub, member);
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

export async function tourEdge(supabaseUrl, supabaseAnon, action, body) {
  const res = await fetch(`${supabaseUrl}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnon}`,
      apikey: supabaseAnon,
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

export async function fetchKeywordItems(supabaseUrl, supabaseAnon, keyword) {
  const res = await tourEdge(supabaseUrl, supabaseAnon, 'searchKeyword', {
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

export async function loadDbRows(sb) {
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

export function createSupabaseClient(url, anon) {
  return createClient(url, anon);
}
