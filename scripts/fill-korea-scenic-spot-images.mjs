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
  'gobok-nature-park-yeongi': '1946955', // 세종호수공원 — 고복자연공원 Tour type12 부재 시
  'yeongi-battle-memorial-park': '1954976', // 연기향교 — 연기대첩비공원 Tour type12 부재 시
  'yesan-holy-site': '2771833', // 여사울성지 — 예산성지 Tour type12 부재 시
  'samnye-culture-village': '2615341', // 삼례책마을 — 문화예술촌 Tour type12 부재 시
  'gokseong-simcheong-hanok-village': '128578', // 섬진강기차마을 — 심청한옥마을 Tour 부재 시
  dongaksan: '128083', // 도림사 계곡 — 동악산 Tour firstimage 부재 시
  'jangsu-nuri-park': '2787949', // 장수물빛공원 — 누리파크 Tour type12 부재 시
  'jangsu-horse-riding-ranch': '606203', // 논개생가마을 — 승마장 Tour type12 부재 시
  jangansan: '1623888', // 방화동자연휴양림 — 장안산 Tour type12 부재 시
  'maryang-camellia-forest': '2782229', // 마량포구 — 마량리동백숲 Tour type12 부재 시
  'munheon-seowon-seocheon': '1954666', // 서천향교 — 문헌서원 Tour type12 부재 시
  'seocheon-specialty-market': '3036904', // 국립생태원에코리움 — 특화시장 Tour 부재 시
  'hansan-mosi-center': '605616', // 달고개모시마을 — 한산모시관 Tour type12 부재 시
  'gaudo-island': '126645', // 강진만 — 가우도 Tour type12 부재 시
  'gangjin-bay-ecological-park': '126645', // 강진만 — 생태공원 Tour type12 부재 시
  dasanchodang: '2515265', // 강진 백운동별서정원 — 다산초당 Tour type12 부재 시
  'gochang-eupseong': '2690525', // 고창읍성 도예체험장 — 읍성 본체 Tour 부재 시
  seonunsa: '126236', // 선운산 — 선운사 Tour type12 부재 시
  'namyeol-sunrise-beach': '129097', // 남열마을 — 남열해돋이 해변 Tour 부재 시
  'nokdong-port': '2674017', // 팔영대교 — 녹동항 Tour type12 부재 시
  'sorokdo-island': '127799', // 다도해해상국립공원(고흥) — 소록도 Tour 부재 시
  'naro-space-center': '2379568', // 고흥우주천문과학관 — 나로우주센터 Tour 부재 시
  'sangrim-park': '893974', // 개평한옥마을 — 상림공원 Tour type12 부재 시
  'hamyang-jianjae': '128629', // 오도재·지리산조망공원 — 지안재 Tour 부재 시
  'manyeonsan-healing-forest': '128990', // 만연산 — 치유숲 Tour type12 부재 시
  unjusa: '2614841', // 운주사 층상응회암 — 운주사 firstimage 부재 시
  'hwasun-jeokbyeok': '128991', // 물염적벽 — 화순적벽 Tour type12 부재 시
  'hwasun-hot-spring': '127932', // 도곡 원네스 스파·리조트 — 화순온천 Tour 부재 시
  seongsusan: '317571', // 상이암(임실) — 성수산 Tour type12 부재 시
  'jangheung-saturday-market': '2783151', // 수문항 — 토요시장 Tour type12 부재 시
  'jangheung-woodland': '125421', // 유치자연휴양림 — 편백숲 우드랜드 Tour 부재 시
  baegyangsa: '126261', // 남창계곡 — 백양사 Tour type12 부재 시(백암산 권역)
  'jangseong-cornus-village': '2990185', // 금곡영화마을 — 산수유마을 Tour 부재 시
  'pyeongnim-dam': '2633951', // 장성호 수변길 — 평림댐 Tour type12 부재 시
  'hwangryong-river': '2741622', // 황금빛 출렁다리 — 황룡강 Tour type12 부재 시
  unlimsanbang: '127251', // 쌍계사(진도) — 운림산방 Tour type12 부재 시
  'naju-pear-museum': '2737308', // 빛가람 호수공원 — 나주배박물관 Tour type12 부재 시
  'naju-hyanggyo': '126412', // 나주 금성관 — 향교 Tour type12 부재 시
  'cheonsa-bridge': '2750939', // 압해도선착장 — 천사대교 Tour type12 부재 시
  'purple-island': '127758', // 암태도 — 퍼플섬(반월·박지) Tour type12 부재 시
  gangcheonsa: '1625118', // 강천사계곡 — 강천사 Tour type12 부재 시
  gangcheonsan: '1625118', // 강천사계곡 — 강천산 Tour type12 부재 시
  'baeksajang-beach': '2715639', // 백수해안공원 — 백사장해수욕장 Tour 부재 시
  bulgapsa: '126415', // 내산서원 — 불갑사 Tour type12 부재 시
  'bulgap-reservoir': '2675000', // 물무산 행복숲 — 불갑저수지 Tour 부재 시
  'chilsan-tower': '2751332', // 백암해안전망대 — 칠산타워 Tour type12 부재 시
  'gimje-old-downtown': '1599176', // 김제동헌 — 구도심 Tour type12 부재 시
  byeokgolje: '228895', // 김제평야 — 벽골제 Tour type12 부재 시
  daeheungsa: '126241', // 두륜산도립공원 — 대흥사 Tour type12 본명 부재 시(대흥사길)
  'hampyeong-expo-park': '129235', // 함평자연생태공원 — 엑스포공원 Tour type12 부재 시
  'mireuksa-temple-site': '1314389', // 미륵사지 당간지주 — 미륵사지 본체 Tour 부재 시
  'ungpo-tourist-site': '1935998', // 산들강웅포마을 — 웅포관광지 Tour type12 부재 시
  hamrasan: '1046086', // 함라산길 — 함라산 Tour type12 부재 시
  'muju-deogyusan-resort': '126238', // 덕유산국립공원 — 리조트 Tour type12 부재 시
  taekwondowon: '127031', // 무주 구천동 33경 — 태권도원 Tour type12 부재 시
  'gichan-land': '2732489', // 가야금산조테마공원 — 기찬랜드 Tour type12 부재 시
  'ganwoljae-pass': '128213', // 간월산 — 간월재 Tour type12 부재 시
  'yangsan-naewonsa': '347224', // 원효암(양산) — 내원사 Tour type12 부재 시(천성산)
  'hongryong-falls': '347224', // 원효암(양산) — 홍룡폭포 Tour type12 부재 시
  'eden-valley-resort': '127193', // 신흥사(양산) — 에덴밸리 Tour type12 부재 시
  'tongdo-fantasia': '2784332', // 통도사 자장암 — 환타지아 Tour type12 부재 시
  cheonseongsan: '347224', // 원효암(양산) — 천성산 Tour type12 부재 시
  'changwon-junam-reservoir': '2606218', // 창원단감테마공원 — 주남저수지 Tour type12 부재 시
  'jinhae-jehwangsan-park': '2614911', // 군항마을 역사길 — 제황산공원 Tour type12 부재 시
  'masan-gagopa-twisting-path': '1905110', // 창동예술촌 — 가고파꼬부랑길 Tour type12 부재 시
  'changwon-jinhae-gunhangje': '2614911', // 군항마을 역사길 — 군항제 Tour type12 부재 시
  'unmunsa-cheongdo': '2753971', // 사리암 — 운문사 Tour type12 부재 시
  'yudeung-yeonji-cheongdo': '2729992', // 청도 프로방스 — 유등연지 Tour type12 부재 시
  'ilgwang-beach': '2775565', // 학리항 — 일광해수욕장 Tour type12 부재 시
  'imrang-beach': '2758498', // 은진사 — 임랑해수욕장 Tour type12 부재 시
  'osiria-tourism-complex': '2815627', // 롯데월드 어드벤처 부산 — 오시리아 Tour type12 부재 시
  'goseong-dinosaur-museum': '2759606', // 고성 솔섬 — 공룡박물관 Tour type12 부재 시
  'sangjokam-county-park': '2759606', // 고성 솔섬 — 상족암군립공원 Tour type12 부재 시
  'geumo-land': '1118806', // 금오산성 — 금오랜드 Tour type12 부재 시
  'nakdong-river-sports-park-gumi': '1119452', // 동락공원 — 낙동강체육공원 Tour type12 부재 시
  'agyangnu-haman': '2663204', // 악양생태공원 — 악양루 Tour type12 부재 시
  'haman-museum': '2754745', // 함안 연꽃테마파크 — 박물관 Tour type12 부재 시
  'yeongnamnu-pavilion': '2793042', // 천진궁 — 영남루 Tour type12 부재 시(밀양 읍치)
  'wiyangji-reservoir': '2742647', // 금시당유원지 — 위양지 Tour type12 부재 시
  'pyochungsa-temple': '1960069', // 표충서원 — 표충사 Tour type12 부재 시
  'miryang-eupseong-fortress': '2793042', // 천진궁 — 밀양읍성 Tour type12 부재 시
  neukdo: '127181', // 삼천포유람선 — 늑도 Tour type12 부재 시
  'sacheon-nosan-park': '2785763', // 삼천포 팔포항 — 노산공원 Tour type12 부재 시
  'samcheonpo-bridge': '127181', // 삼천포유람선 — 삼천포대교 Tour type12 부재 시
  'sacheon-waryongsan': '2785763', // 삼천포 팔포항 — 와룡산 Tour firstimage 부재 시
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
