/**
 * GATEO 선정 명소 대표 이미지 SSOT 채움.
 * DB(tourapi_attraction) → 없으면 TourAPI detailCommon LIVE.
 *
 *   node scripts/fill-korea-scenic-spot-images.mjs
 *   node scripts/fill-korea-scenic-spot-images.mjs --limit=20
 *   node scripts/fill-korea-scenic-spot-images.mjs --force
 *
 * 산출: scripts/data/korea-scenic-spot-images.json → generate:korea-scenic-spots
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCENIC_PATH = join(__dirname, '../src/pages/Home/data/koreaScenicSpots.json');
const IMAGES_PATH = join(__dirname, 'data/korea-scenic-spot-images.json');

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const args = process.argv.slice(2);
const force = args.includes('--force');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) || 0 : 0;
const concurrency = 4;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return null;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

function loadImagesMap() {
  try {
    const raw = JSON.parse(readFileSync(IMAGES_PATH, 'utf8'));
    return raw?.byId && typeof raw.byId === 'object' ? { ...raw.byId } : {};
  } catch {
    return {};
  }
}

async function fetchDbFirstImages(supabase, contentIds) {
  /** @type {Map<string, string>} */
  const out = new Map();
  const ids = [...new Set(contentIds.filter((id) => /^\d{1,32}$/.test(id)))];
  for (let i = 0; i < ids.length; i += 80) {
    const chunk = ids.slice(i, i + 80);
    const { data, error } = await supabase
      .from('tourapi_attraction')
      .select('content_id, first_image')
      .in('content_id', chunk)
      .eq('active', true);
    if (error) {
      console.warn('[fill-scenic-images] db', error.message || error);
      continue;
    }
    for (const row of data || []) {
      const id = String(row?.content_id || '').trim();
      const url = toHttps(row?.first_image);
      if (id && url) out.set(id, url);
    }
  }
  return out;
}

async function tourEdge(action, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON}`,
      apikey: SUPABASE_ANON,
    },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    console.warn(`[fill-scenic-images] live HTTP ${res.status} ${action}`);
    return null;
  }
  const data = await res.json();
  if (!data?.ok) {
    console.warn(
      `[fill-scenic-images] live not ok ${action}`,
      data?.message || data?.error || '',
    );
    return null;
  }
  return data;
}

/** firstimage 비어 있어도 detailImage 갤러리로 대표 사진을 쓰는 경우가 많음 */
async function fetchLiveFirstImage(contentId) {
  const [common, images] = await Promise.all([
    tourEdge('detailCommon', { contentId }),
    tourEdge('detailImage', { contentId, numOfRows: 8, pageNo: 1 }),
  ]);
  const item = common?.items?.[0] || null;
  const fromCommon = toHttps(
    item?.imageUrl || item?.firstimage || item?.firstimage2,
  );
  if (fromCommon) return fromCommon;
  for (const it of images?.items || []) {
    const url = toHttps(
      it?.imageUrl || it?.originimgurl || it?.smallimageurl || it?.firstimage,
    );
    if (url) return url;
  }
  return null;
}

/**
 * Tour firstimage가 비는 명소 — 동일 장소·인접 대표 경관 contentId로 이미지 폴백.
 * (목록 썸네일용 · 명소 contentId SSOT는 overrides 유지)
 */
const RELATED_IMAGE_CONTENT_IDS = {
  gapjangsan: '126125', // 경천대 — 갑장산 Tour firstimage 부재 시
  jeongdongjin: '128757', // 정동진해변
  'incheon-chinatown': '125519', // 자유공원(인천) — 차이나타운 인접
  'dongpirang-mural-village': '2605111', // 서피랑 마을(통영 벽화 언덕) — 동피랑 Tour 이미지 부재 시
  'ganghwa-peace-observatory': '1254680', // 갑곶돈대 — 제적봉 전망대 Tour firstimage 부재 시
  goryeogungji: '125534', // 전등사 — 고려궁지 Tour firstimage 부재 시(강화 역사권)
  manisan: '3061182', // 마니산국민관광지 — 마니산(강화) Tour firstimage 부재 시
  'alpensia-resort': '3448238', // 알펜시아 스키역사관 — 리조트 본체 Tour type12 부재 시
  'yongpyong-resort': '136089', // 모나용평 — 용평리조트 Tour 본명 부재 시
  'pyeongchang-olympic-plaza': '3448238', // 인근 알펜시아 — 올림픽기념관 Tour 부재 시
  'ansan-culture-plaza': '2615489', // 화랑유원지 — 문화광장 Tour type12 부재 시
  'gureumsan-gwangmyeong': '2736048', // 도덕산공원 — 구름산 Tour firstimage 부재 시
  geomdansan: '529248', // 이성산성 — 검단산 Tour firstimage 부재 시
  'kintex-goyang': '127197', // 일산호수공원 — 킨텍스 Tour type12 부재 시
  'anyangcheon-eco-park-gwangmyeong': '2649975', // 광명동굴 — 안양천생태공원 Tour 부재 시
  'starfield-hanam': '2900511', // 미사한강공원 — 스타필드 Tour type12 부재 시
  'hanam-deokpung-market': '2902497', // 덕풍공원 — 시장 Tour type12 부재 시
  'hanam-gyosan-neighborhood-park': '130726', // 하남역사박물관 — 교산공원 Tour 부재 시
  'neunggok-historic-park': '128109', // 오이도 — 능곡/선사 Tour firstimage 부재 시
  'siheung-soft-town': '756625', // 시흥갯골생태공원 — 소프트타운 Tour 부재 시
  'anyang-central-market': '125514', // 안양예술공원 — 중앙시장 Tour firstimage 부재 시
  myeongseongsan: '125523', // 산정호수 — 명성산 Tour firstimage 부재 시
  yongmunsa: '3537762', // 양평 용문사 은행나무 — 용문사(용문산) Tour firstimage 부재 시
  'uiwang-rail-park': '2546506', // 왕송호수캠핑장 — 레일파크 Tour type12 부재 시
  'yangpyeong-wild-flower-arboretum': '407051', // 세미원 — 들꽃수목원 Tour 부재 시
  'gunpo-sanbon-market': '2751298', // 철쭉동산 — 산본시장 Tour type12 부재 시
  'malgeunnuri-park-gwacheon': '126712', // 서울대공원 — 맑은누리공원 Tour 부재 시
  osancheon: '128986', // 물향기수목원 — 오산천 Tour 부재 시
  'gwacheon-civic-center': '660722', // 국립과천과학관 — 시민회관 Tour firstimage 부재 시
  'daecheongdo-ongjin': '2664266', // 대청도 옥죽동 해안사구 — 대청도 Tour firstimage 부재 시
  'osan-malgeumteo-park': '128986', // 물향기수목원 — 맑음터공원 Tour firstimage 부재 시
  'mihocheon-ecological-park': '127789', // 백곡저수지 — 미호천생태공원 Tour 부재 시
  'yeoju-premium-outlets': '126557', // 신륵사관광지 — 여주아울렛 Tour type12 부재 시
  'cheonan-jungang-market': '126922', // 천안삼거리공원 — 중앙시장 Tour firstimage 부재 시
  'bosan-foreigners-street': '127513', // 소요산국민관광지 — 보산동 거리 Tour 부재 시
  'freedom-protection-peace-museum': '127513', // 소요산국민관광지 — 박물관 Tour firstimage 부재 시
  'starlight-garden-universe': '1624755', // 설봉공원 — 별빛정원우주 Tour 부재 시
  'pyeongtaek-mir-island': '2741612', // 평택호예술공원 — 미르섬 Tour 부재 시
  'garisan-recreation-forest': '2372816', // 가리산 레포츠파크 — 휴양림 Tour firstimage 부재 시
  'yanggu-war-memorial-museum': '130736', // 양구통일관 — 전쟁기념관 Tour firstimage 부재 시(동일 주소)
  'yongbongsan-hongseong': '125427', // 용봉산자연휴양림 — 용봉산 Tour firstimage 부재 시
  'jinaksan-geumsan': '125888', // 보석사 — 진악산 Tour firstimage 부재 시(남이 인근)
};

async function mapPool(items, worker, size) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const i = cursor;
      cursor += 1;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => run()));
  return results;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error('Need VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
  }

  const scenic = JSON.parse(readFileSync(SCENIC_PATH, 'utf8'));
  const spots = Array.isArray(scenic?.spots) ? scenic.spots : [];
  const byId = loadImagesMap();
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

  /** @type {{ id: string, contentId: string, name: string }[]} */
  const need = [];
  for (const spot of spots) {
    const id = String(spot?.id || '').trim();
    const contentId = String(spot?.contentId || '').trim();
    const relatedOnly = RELATED_IMAGE_CONTENT_IDS[id];
    if (!id) continue;
    if (!/^\d{1,32}$/.test(contentId) && !relatedOnly) continue;
    if (!force && toHttps(byId[id] || spot.imageUrl)) continue;
    need.push({
      id,
      contentId: /^\d{1,32}$/.test(contentId) ? contentId : relatedOnly,
      name: String(spot.name || id),
    });
  }

  const targets = limit > 0 ? need.slice(0, limit) : need;
  console.log(
    `[fill-scenic-images] spots=${spots.length} need=${need.length} run=${targets.length} force=${force}`,
  );

  const dbMap = await fetchDbFirstImages(
    supabase,
    targets.map((t) => t.contentId),
  );
  let fromDb = 0;
  let fromLive = 0;
  let miss = 0;

  const stillLive = [];
  for (const t of targets) {
    const url = dbMap.get(t.contentId) || null;
    if (url) {
      byId[t.id] = url;
      fromDb += 1;
    } else {
      stillLive.push(t);
    }
  }

  let fromRelated = 0;
  await mapPool(
    stillLive,
    async (t) => {
      let url = await fetchLiveFirstImage(t.contentId);
      await sleep(120);
      if (url) {
        byId[t.id] = url;
        fromLive += 1;
        console.log(`OK  LIVE ${t.name} (${t.contentId})`);
        return;
      }
      const relatedId = RELATED_IMAGE_CONTENT_IDS[t.id];
      if (relatedId) {
        url = await fetchLiveFirstImage(relatedId);
        await sleep(120);
        if (url) {
          byId[t.id] = url;
          fromRelated += 1;
          console.log(`OK  RELATED ${t.name} ← ${relatedId}`);
          return;
        }
      }
      miss += 1;
      console.warn(`MISS ${t.name} (${t.contentId})`);
    },
    concurrency,
  );

  const withUrl = Object.keys(byId).filter((k) => toHttps(byId[k])).length;
  const payload = {
    meta: {
      version: 1,
      updatedAt: new Date().toISOString(),
      count: withUrl,
      source: 'tourapi_attraction.first_image + tourapi-proxy detailCommon',
    },
    byId,
  };
  writeFileSync(IMAGES_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `[fill-scenic-images] wrote ${IMAGES_PATH} (db=${fromDb} live=${fromLive} related=${fromRelated} miss=${miss} total=${withUrl})`,
  );

  const gen = spawnSync('node', [join(__dirname, 'generate-korea-scenic-spots.mjs')], {
    stdio: 'inherit',
    env: process.env,
  });
  if (gen.status !== 0) {
    process.exit(gen.status || 1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
