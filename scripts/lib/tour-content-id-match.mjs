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
  두타모종: ['영수사'],
  농암모설: ['진천 농다리'],
  불국영지: ['경주 불국사'],
  계림황엽: ['경주 계림'],
  백율송순: ['백률사'],
  금장낙안: ['금장대'],
  압지부평: ['경주 동궁과 월지'],
  문천도사: ['월정교'],
  남산부석: ['경주 남산'],
  서암석불: ['서암정사', '함양 서암정사'],
  개암고적: ['개암사', '부안 개암사'],
  안면송림: ['안면해수욕장'],
  양도낙안: ['양섬', '여주 양섬'],
  신륵모종: ['신륵사(여주)'],
  소사모종: ['내소사(부안)'],
  삼도귀범: ['고군산군도'],
  웅연조대: ['곰소항'],
  이릉두견: ['여주 영릉과 영릉', '영릉과 녕릉'],
  평사낙안: ['선유도해수욕장'],
  무릉반석: ['무릉계곡 용추폭포(강원)', '무릉계곡 용추폭포'],
  미륵불상: ['구룡사'],
  용추비경: ['기백산 용추계곡과 용추폭포'],
  해상분수: ['춤추는바다분수', '목포 춤추는바다분수', '춤추는 바다분수'],
  장자어화: ['군산 새만금', '새만금'],
  월명무애: ['내소사(부안)'],
  남양황라: ['제부도해수욕장'],
  서문시장: ['대구 서문시장 & 서문시장 야시장'],
  금대지리: ['금대암'],
  남양성지: ['남양성모성지'],
  제암만세: ['화성 제암리 3·1운동 순국 유적'],
  삽교평야: ['예산 삽교읍 석조보살입상'],
  적대청람: ['적대봉'],
  덕유운해: ['남덕유산', '덕유산'],
  우담제월: ['우암사적공원'],
  어은계석: ['어은돌항', '어은정'],
  백제고도: ['백제문화단지', '백제문화체험박물관'],
  청자단지: ['강진 고려청자박물관'],
  지포신경: ['채석강 (전북 서해안 국가지질공원)'],
  마암어등: ['여주 황포돛배'],
  연탄귀범: ['강천섬유원지'],
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

const SIGUNGU_DISAMBIG_RE =
  /천연|기념|세계|문화|유산|탐방|코스|정상|입구|휴양|야영|캠핑|주차|매표|관광|명승|유네스코|생태|습지|봉우리|정계|계곡|동굴|폭포|사찰|서원|향교/;

export function looksLikeSigunguDisambiguator(s) {
  const raw = String(s || '').trim();
  if (!raw || raw.length < 2) return false;
  if (/[시군구]$/.test(raw)) return true;
  if (
    /^(경기|경남|경북|전남|전북|충남|충북|강원|제주|서울|부산|대구|인천|광주|대전|울산|세종)\s/.test(
      raw,
    )
  ) {
    return true;
  }
  if (SIGUNGU_DISAMBIG_RE.test(raw)) return false;
  const bare = raw
    .replace(/^(경기|경남|경북|전남|전북|충남|충북|강원|제주)\s*/, '')
    .trim();
  const n = norm(bare);
  if (n.length === 2 && /^[가-힣]{2}$/.test(bare)) return true;
  return false;
}

export function memberCoords(member, hub) {
  if (Number.isFinite(member?.lat) && Number.isFinite(member?.lng)) {
    return { lat: member.lat, lng: member.lng };
  }
  const nameKey = normalizeKey(member?.attractionName || member?.name || '');
  const attr = (hub?.attractions || []).find((a) => normalizeKey(a.name) === nameKey);
  if (attr && Number.isFinite(attr.lat) && Number.isFinite(attr.lng)) {
    return { lat: attr.lat, lng: attr.lng };
  }
  if (Number.isFinite(hub?.lat) && Number.isFinite(hub?.lng)) {
    return { lat: hub.lat, lng: hub.lng };
  }
  return { lat: undefined, lng: undefined };
}

export function memberForMatch(member, hub) {
  const { lat, lng } = memberCoords(member, hub);
  return { ...member, lat, lng };
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

export const POETIC_TAIL_RE =
  /(일출|야경|사계|설경|여명|낙조|단풍|복사꽃|벚꽃길|들녘)$/;
export const PLACE_TAIL_RE =
  /(산|강|봉|굴|정|루|암|폭포|계곡|산성|주막|해수욕장|수목원|사찰|서원|향교|유원지|마을|공원|댐|다리|바위|저수지|천문대|생태원)$/;

export const CLOSE_BUCKETS = ['siho', 'poetic', 'prefix', 'short', 'other'];

export function classifyScenicMember(member, hub) {
  const name = String(member?.attractionName || member?.name || '').trim();
  if (!name) return 'other';
  const compact = name.replace(/\s+/g, '');
  if (POETIC_TAIL_RE.test(compact) || /\s(일출|야경|사계|여명|낙조|설경)$/.test(name)) {
    return 'poetic';
  }
  if (/\s/.test(name)) return 'prefix';
  if (/^[가-힣]{4}$/.test(compact) && !PLACE_TAIL_RE.test(compact)) return 'siho';
  if (/^[가-힣]{2,5}$/.test(compact)) return 'short';
  return 'other';
}

export function namesToCover(member, hub) {
  const name = String(member?.attractionName || member?.name || '').trim();
  const names = new Set([name].filter(Boolean));
  for (const alias of KEYWORD_ALIASES[name] || []) names.add(alias);
  const token = hubToken(hub);
  if (token && name.startsWith(`${token} `)) names.add(name.slice(token.length).trim());
  return [...names].filter((n) => {
    const k = norm(n);
    return k.length >= 2 && !GENERIC_RE.test(k);
  });
}

export function strategyQueries(member, hub) {
  const queries = new Set(memberQueries(member, hub));
  const name = String(member?.attractionName || member?.name || '').trim();
  const token = hubToken(hub);
  if (token && name && !name.startsWith(token)) {
    queries.add(`${token} ${name}`);
  }
  const compact = name.replace(/\s+/g, '');
  if (POETIC_TAIL_RE.test(compact)) {
    const stripped = compact.replace(POETIC_TAIL_RE, '').trim();
    if (stripped.length >= 2 && !GENERIC_RE.test(norm(stripped))) {
      queries.add(stripped);
      if (token && !stripped.startsWith(token)) queries.add(`${token} ${stripped}`);
    }
  }
  return [...queries].filter((q) => q && !GENERIC_RE.test(norm(q)));
}

export function titleCoversName(title, name) {
  const t = norm(title);
  const n = norm(name);
  if (!t || !n || n.length < 2 || GENERIC_RE.test(n)) return false;
  if (t === n) return true;
  if (t.endsWith(n) || t.includes(n)) {
    return t.length / n.length <= 2.6;
  }
  if (n.startsWith(t) && t.length >= 3 && n.length - t.length <= 4) return true;
  return false;
}

export function hubAddrMatches(item, hub) {
  const addr = String(item?.addr1 || item?.addr || '');
  const title = String(item?.title || '');
  const hints = hubHints(hub).filter((h) => /[가-힣]/.test(h) && h.length >= 2);
  if (!hints.length) return false;
  return hints.some((h) => addr.includes(h) || title.includes(h));
}

export function acceptUniqueLiveHit(member, hub, items) {
  const names = namesToCover(member, hub);
  const covered = [];
  for (const item of items || []) {
    const contentId = String(item.contentId || item.contentid || item.content_id || '').trim();
    if (!/^\d{1,32}$/.test(contentId)) continue;
    const title = String(item.title || '');
    const type = String(item.contentTypeId || item.contenttypeid || item.content_type_id || '');
    const isMarket = /시장|마켓/.test(title);
    if (type && !['12', '14', '28'].includes(type) && !(type === '38' && isMarket)) {
      continue;
    }
    if (COMMERCIAL_RE.test(title) && !isMarket) continue;
    if (!names.some((n) => titleCoversName(title, n))) continue;
    covered.push({
      contentId,
      tourTitle: title.trim(),
      hubOk: hubAddrMatches(item, hub),
    });
  }
  const hubHits = covered.filter((c) => c.hubOk);
  const uniqueIds = [...new Set(hubHits.map((c) => c.contentId))];
  if (uniqueIds.length === 1) {
    const hit = hubHits.find((c) => c.contentId === uniqueIds[0]);
    return { status: 'unique_hit', contentId: hit.contentId, tourTitle: hit.tourTitle };
  }
  if (uniqueIds.length > 1) {
    return { status: 'ambiguous', contentIds: uniqueIds };
  }
  if (covered.length) {
    return {
      status: 'hub_mismatch',
      titles: [...new Set(covered.map((c) => c.tourTitle))],
    };
  }
  return { status: 'tour_missing' };
}

export function scoreHit(query, item, hub, member) {
  const scoped = memberForMatch(member, hub);
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
  else if (Number.isFinite(scoped.lat) && Number.isFinite(scoped.lng)) {
    const lat = Number(item.mapy ?? item.lat);
    const lng = Number(item.mapx ?? item.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const km = haversineKm(scoped.lat, scoped.lng, lat, lng);
      if (km <= 2.5) score += 2;
      else return 0;
    } else return 0;
  } else return 0;

  const paren = title.match(/\(([^)]+)\)/);
  if (paren && looksLikeSigunguDisambiguator(paren[1])) {
    const inside = norm(paren[1]);
    const hints = hubHints(hub).map((h) => norm(h)).filter(Boolean);
    const token = hubToken(hub);
    const hubMatch =
      hints.some((h) => inside.includes(h) || h.includes(inside)) ||
      (token && inside.includes(norm(token).slice(0, 2))) ||
      q.includes(inside);
    if (!hubMatch) return 0;
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
