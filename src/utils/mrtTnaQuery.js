/**
 * 국내 TNA(투어·티켓) 검색 키워드 SSOT — 해외 GYG와 분기용.
 */
import {
  isMrtDomesticLocation,
  stripKoAdminSuffix,
} from './mrtStayQuery.js';

export { isMrtDomesticLocation };

/** 국내 동·리·읍·면 — 세밀 행정(시·군보다 아래) */
const KO_FINE_ADMIN_RE = /[동읍면리]$/;
/** 국내 읍·면·리 — OSM town/village→city 시 키워드 선두 금지(대화면→일산 · 이평리→리 단독) */
const KO_TOWNSHIP_RE = /[읍면리]$/;

function isKoFineAdminName(name) {
  return KO_FINE_ADMIN_RE.test(String(name || '').trim());
}

function isKoTownshipName(name) {
  return KO_TOWNSHIP_RE.test(String(name || '').trim());
}

/** slug → keyword 하드 오버라이드 (QA 후 최소만) */
const MRT_TNA_KEYWORD_OVERRIDES = {
  // 예: 'seongsan-ilchulbong': { keyword: '성산일출봉', altKeywords: ['제주'] },
};

/** 상위(hub) 관련도 통과 건수가 이 값 이하면 인근 첫 키워드로 보강 */
export const MRT_TNA_NEARBY_EXPAND_MAX = 3;

/**
 * 국내 TNA 인근 연결 SSOT (hubId + 한글명).
 * Phase 0~3 A·B=희소 보강 · Phase 4=일정 확장(풍부 hub도 등재).
 * 순서=자동보강(≤3)→칩/더보기. LIVE n≈0 키워드 제외.
 */
const MRT_TNA_NEARBY_EXPAND = {
  // —— A표 ——
  mungyeong: ['안동', '단양', '상주'],
  문경: ['안동', '단양', '상주'],
  yanggu: ['춘천', '인제', '설악산', '속초'],
  양구: ['춘천', '인제', '설악산', '속초'],
  jecheon: ['단양', '영월', '충주'],
  제천: ['단양', '영월', '충주'],
  andong: ['영주', '의성', '문경'],
  안동: ['영주', '의성', '문경'],
  suncheon: ['여수', '광양', '구례', '보성'],
  순천: ['여수', '광양', '구례', '보성'],
  boseong: ['여수', '장흥', '순천'],
  보성: ['여수', '장흥', '순천'],
  gurye: ['하동', '남원', '지리산', '순천'],
  구례: ['하동', '남원', '지리산', '순천'],
  namwon: ['전주', '구례', '지리산'],
  남원: ['전주', '구례', '지리산'],
  muju: ['대전', '전주', '덕유산'],
  무주: ['대전', '전주', '덕유산'],
  jeongseon: ['평창', '영월', '강릉', '태백'],
  정선: ['평창', '영월', '강릉', '태백'],
  taebaek: ['영월', '삼척', '동해', '정선'],
  태백: ['영월', '삼척', '동해', '정선'],
  yangpyeong: ['가평', '남이섬', '이천', '여주'],
  양평: ['가평', '남이섬', '이천', '여주'],
  pocheon: ['가평', '남이섬', '연천', '동두천'],
  포천: ['가평', '남이섬', '연천', '동두천'],
  boryeong: ['부여', '태안', '대천', '서산'],
  보령: ['부여', '태안', '대천', '서산'],
  taean: ['보령', '당진', '서산'],
  태안: ['보령', '당진', '서산'],
  ulleung: ['울릉도', '독도', '포항', '경주'],
  울릉: ['울릉도', '독도', '포항', '경주'],
  wando: ['여수', '해남', '목포'],
  완도: ['여수', '해남', '목포'],
  hapcheon: ['대구', '산청', '해인사'],
  합천: ['대구', '산청', '해인사'],
  geochang: ['산청', '대구', '합천'],
  거창: ['산청', '대구', '합천'],
  hamyang: ['산청', '지리산', '남원'],
  함양: ['산청', '지리산', '남원'],
  wonju: ['제천', '횡성', '충주', '여주'],
  원주: ['제천', '횡성', '충주', '여주'],
  chungju: ['단양', '음성', '제천'],
  충주: ['단양', '음성', '제천'],
  hwacheon: ['춘천', '인제'],
  화천: ['춘천', '인제'],
  cheorwon: ['춘천', '포천', '연천', '화천'],
  철원: ['춘천', '포천', '연천', '화천'],
  // —— B표 (희소 확장 · 교차 보완) ——
  hoengseong: ['홍천', '평창', '제천'],
  횡성: ['홍천', '평창', '제천'],
  yecheon: ['영주', '상주', '안동', '문경'],
  예천: ['영주', '상주', '안동', '문경'],
  bonghwa: ['영주', '영월', '안동', '울진'],
  봉화: ['영주', '영월', '안동', '울진'],
  uljin: ['삼척', '강릉', '영덕'],
  울진: ['삼척', '강릉', '영덕'],
  yeoju: ['이천', '양평', '충주'],
  여주: ['이천', '양평', '충주'],
  boeun: ['대전', '청주'],
  보은: ['대전', '청주'],
  okcheon: ['대전', '청주'],
  옥천: ['대전', '청주'],
  gochang: ['영광', '변산', '군산', '부안'],
  고창: ['영광', '변산', '군산', '부안'],
  buan: ['변산', '고창', '군산'],
  부안: ['변산', '고창', '군산'],
  haenam: ['목포', '완도', '여수'],
  해남: ['목포', '완도', '여수'],
  gangjin: ['해남', '장흥', '보성', '완도'],
  강진: ['해남', '장흥', '보성', '완도'],
  jangheung: ['보성', '여수', '완도', '순천'],
  장흥: ['보성', '여수', '완도', '순천'],
  goheung: ['여수', '남해', '보성', '순천'],
  고흥: ['여수', '남해', '보성', '순천'],
  gokseong: ['담양', '구례', '남원', '순천'],
  곡성: ['담양', '구례', '남원', '순천'],
  jindo: ['해남', '목포', '완도'],
  진도: ['해남', '목포', '완도'],
  sinan: ['목포', '해남', '여수'],
  신안: ['목포', '해남', '여수'],
  jinan: ['전주', '무주', '남원'],
  진안: ['전주', '무주', '남원'],
  jeongeup: ['전주', '내장산', '고창', '부안'],
  정읍: ['전주', '내장산', '고창', '부안'],
  sunchang: ['담양', '남원'],
  순창: ['담양', '남원'],
  imsil: ['전주', '남원'],
  임실: ['전주', '남원'],
  gunsan: ['전주', '부여', '부안', '고창'],
  군산: ['전주', '부여', '부안', '고창'],
  mokpo: ['여수', '해남', '나주'],
  목포: ['여수', '해남', '나주'],
  yeoncheon: ['파주', '포천', '동두천'],
  연천: ['파주', '포천', '동두천'],
  gumi: ['대구', '상주', '안동'],
  구미: ['대구', '상주', '안동'],
  gimcheon: ['대구', '상주', '구미'],
  김천: ['대구', '상주', '구미'],
  miryang: ['대구', '부산', '경주', '창원'],
  밀양: ['대구', '부산', '경주', '창원'],
  changwon: ['부산', '통영', '거제', '김해'],
  창원: ['부산', '통영', '거제', '김해'],
  cheongsong: ['영양', '안동', '의성', '영덕'],
  청송: ['영양', '안동', '의성', '영덕'],
  yeongdeok: ['포항', '경주', '울진'],
  영덕: ['포항', '경주', '울진'],
  uiseong: ['안동', '구미'],
  의성: ['안동', '구미'],
  seosan: ['태안', '당진', '보령', '예산'],
  서산: ['태안', '당진', '보령', '예산'],
  asan: ['천안', '공주', '예산', '서산'],
  아산: ['천안', '공주', '예산', '서산'],
  nonsan: ['공주', '부여', '대전'],
  논산: ['공주', '부여', '대전'],
  yesan: ['공주', '아산', '당진', '서산'],
  예산: ['공주', '아산', '당진', '서산'],
  hongseong: ['당진', '보령', '예산', '서산'],
  홍성: ['당진', '보령', '예산', '서산'],
  seocheon: ['부여', '보령', '논산', '군산'],
  서천: ['부여', '보령', '논산', '군산'],
  dangjin: ['태안', '아산', '서산', '예산'],
  당진: ['태안', '아산', '서산', '예산'],
  geumsan: ['대전', '논산', '무주'],
  금산: ['대전', '논산', '무주'],
  yeongdong: ['대전', '금산'],
  영동: ['대전', '금산'],
  // —— C표 (풍부 hub · 일정 연결 · 자동보강 미발동·칩만) ——
  gyeongju: ['포항', '울산', '부산', '대구'],
  경주: ['포항', '울산', '부산', '대구'],
  danyang: ['제천', '영월', '충주', '문경'],
  단양: ['제천', '영월', '충주', '문경'],
  chuncheon: ['가평', '홍천', '인제', '화천'],
  춘천: ['가평', '홍천', '인제', '화천'],
  tongyeong: ['거제', '남해', '부산', '창원'],
  통영: ['거제', '남해', '부산', '창원'],
  geoje: ['통영', '부산', '창원', '남해'],
  거제: ['통영', '부산', '창원', '남해'],
  gapyeong: ['춘천', '남이섬', '양평', '포천'],
  가평: ['춘천', '남이섬', '양평', '포천'],
  jeju: ['서귀포', '성산', '중문', '애월'],
  제주: ['서귀포', '성산', '중문', '애월'],
  yeongwol: ['제천', '단양', '평창', '정선'],
  영월: ['제천', '단양', '평창', '정선'],
  namhae: ['통영', '여수', '진주', '사천'],
  남해: ['통영', '여수', '진주', '사천'],
  damyang: ['광주', '순천', '곡성', '전주'],
  담양: ['광주', '순천', '곡성', '전주'],
  gangneung: ['속초', '양양', '동해', '평창'],
  강릉: ['속초', '양양', '동해', '평창'],
  pyeongchang: ['강릉', '정선', '영월', '홍천'],
  평창: ['강릉', '정선', '영월', '홍천'],
  hongcheon: ['춘천', '평창', '횡성', '인제'],
  홍천: ['춘천', '평창', '횡성', '인제'],
  yeongju: ['안동', '문경', '울진', '영월'],
  영주: ['안동', '문경', '울진', '영월'],
  inje: ['춘천', '속초', '설악산', '양양'],
  인제: ['춘천', '속초', '설악산', '양양'],
  hadong: ['구례', '진주', '남해', '산청'],
  하동: ['구례', '진주', '남해', '산청'],
  yangyang: ['속초', '강릉', '인제', '설악산'],
  양양: ['속초', '강릉', '인제', '설악산'],
  samcheok: ['동해', '강릉', '울진', '태백'],
  삼척: ['동해', '강릉', '울진', '태백'],
  donghae: ['강릉', '삼척', '속초', '평창'],
  동해: ['강릉', '삼척', '속초', '평창'],
  busan: ['경주', '울산', '거제', '통영'],
  부산: ['경주', '울산', '거제', '통영'],
  sangju: ['문경', '안동', '구미', '대구'],
  상주: ['문경', '안동', '구미', '대구'],
  sancheong: ['진주', '하동', '합천', '지리산'],
  산청: ['진주', '하동', '합천', '지리산'],
  gongju: ['부여', '논산', '대전', '천안'],
  공주: ['부여', '논산', '대전', '천안'],
  buyeo: ['공주', '보령', '논산', '대전'],
  부여: ['공주', '보령', '논산', '대전'],
  icheon: ['여주', '양평', '수원', '가평'],
  이천: ['여주', '양평', '수원', '가평'],
  jinju: ['사천', '남해', '하동', '통영'],
  진주: ['사천', '남해', '하동', '통영'],
  sacheon: ['진주', '남해', '통영', '거제'],
  사천: ['진주', '남해', '통영', '거제'],
  paju: ['강화', '김포', '포천', '연천'],
  파주: ['강화', '김포', '포천', '연천'],
  ganghwa: ['인천', '파주', '김포'],
  강화: ['인천', '파주', '김포'],
  goseong: ['속초', '양양', '인제', '설악산'],
  고성: ['속초', '양양', '인제', '설악산'],
  yeongyang: ['안동', '영주', '울진', '영덕'],
  영양: ['안동', '영주', '울진', '영덕'],
  cheonan: ['아산', '공주', '대전', '예산'],
  천안: ['아산', '공주', '대전', '예산'],
};

function pushUnique(list, seen, raw) {
  const k = String(raw || '').trim();
  if (!k || k.length > 100) return;
  const key = k.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push(k);
}

/** 한글 hub명 긴 것 우선 — 「문경석탄박물관」→ 문경 */
const NEARBY_HUB_KO_NAMES = Object.keys(MRT_TNA_NEARBY_EXPAND)
  .filter((k) => /[가-힣]/.test(k))
  .sort((a, b) => b.length - a.length);

function inferHubKoFromText(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  for (const hub of NEARBY_HUB_KO_NAMES) {
    if (text === hub || text.startsWith(hub)) return hub;
  }
  return '';
}

function resolveNearbyExpand(location) {
  const hubId = String(location?.hubId || '').trim().toLowerCase();
  const parent = String(location?.parentCity || '').trim();
  const slug = String(location?.slug || '').trim().toLowerCase();
  const name = String(location?.name || '').trim();
  const nameKo = String(location?.name_ko || '').trim();
  const originalQuery = String(location?.originalQuery || '').trim();
  const admin =
    location?.stayAdmin && typeof location.stayAdmin === 'object'
      ? location.stayAdmin
      : {};
  const county = String(admin.county || '').trim();
  const countyBare = stripKoAdminSuffix(county);
  const inferred =
    inferHubKoFromText(parent) ||
    inferHubKoFromText(county) ||
    inferHubKoFromText(countyBare) ||
    inferHubKoFromText(name) ||
    inferHubKoFromText(nameKo) ||
    inferHubKoFromText(originalQuery);
  return (
    MRT_TNA_NEARBY_EXPAND[hubId] ||
    MRT_TNA_NEARBY_EXPAND[slug] ||
    MRT_TNA_NEARBY_EXPAND[parent] ||
    MRT_TNA_NEARBY_EXPAND[county] ||
    MRT_TNA_NEARBY_EXPAND[countyBare] ||
    MRT_TNA_NEARBY_EXPAND[name] ||
    (inferred ? MRT_TNA_NEARBY_EXPAND[inferred] : null) ||
    []
  );
}

/**
 * @param {object} location
 * @returns {{ keyword: string, altKeywords: string[], nearbyKeywords: string[] }}
 */
export function resolveMrtTnaQuery(location) {
  const slug = String(location?.slug || '').trim().toLowerCase();
  const override = MRT_TNA_KEYWORD_OVERRIDES[slug];
  const name = String(location?.name || '').trim();
  const nameEn = String(location?.name_en || '').trim();
  const nameKo = String(location?.name_ko || '').trim();
  const parentCity = String(location?.parentCity || '').trim();
  const admin =
    location?.stayAdmin && typeof location.stayAdmin === 'object'
      ? location.stayAdmin
      : {};

  const ladder = [];
  const seen = new Set();
  const originalQuery = String(location?.originalQuery || '').trim();
  const countyBare = stripKoAdminSuffix(admin.county);
  const inferredHubKo =
    inferHubKoFromText(parentCity) ||
    inferHubKoFromText(admin.county) ||
    inferHubKoFromText(countyBare) ||
    inferHubKoFromText(name) ||
    inferHubKoFromText(nameKo) ||
    inferHubKoFromText(originalQuery);

  if (override?.keyword) pushUnique(ladder, seen, override.keyword);
  for (const k of override?.altKeywords || []) pushUnique(ladder, seen, k);

  const isDomestic = isMrtDomesticLocation(location);
  const fineGrain =
    isKoFineAdminName(name) ||
    isKoFineAdminName(nameKo) ||
    isKoFineAdminName(admin.neighbourhood) ||
    (isDomestic && isKoTownshipName(admin.city));

  const pushPlace = () => {
    pushUnique(ladder, seen, name);
    pushUnique(ladder, seen, nameKo);
  };

  const pushCity = () => {
    const cityIsTownship = isDomestic && isKoTownshipName(admin.city);
    if (cityIsTownship && admin.county) {
      // 평창군 대화면·보은군 이평리 — 군 우선, 면 축약「대화」제외(일산 대화동 오탐)
      pushUnique(ladder, seen, admin.county);
      pushUnique(ladder, seen, stripKoAdminSuffix(admin.county));
      pushUnique(ladder, seen, parentCity);
      pushUnique(ladder, seen, stripKoAdminSuffix(parentCity));
      pushUnique(ladder, seen, inferredHubKo);
      pushUnique(ladder, seen, admin.city);
      return;
    }
    pushUnique(ladder, seen, parentCity);
    pushUnique(ladder, seen, stripKoAdminSuffix(parentCity));
    pushUnique(ladder, seen, inferredHubKo);
    pushUnique(ladder, seen, admin.city);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.city));
    pushUnique(ladder, seen, admin.county);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.county));
  };

  // 국내 hub 명소·동읍면리: 상위 시·군 우선 (문경석탄박물관→문경 · 대화리→평창). originalQuery는 뒤로.
  if ((parentCity || inferredHubKo) && !fineGrain) {
    pushUnique(ladder, seen, parentCity);
    pushUnique(ladder, seen, stripKoAdminSuffix(parentCity));
    pushUnique(ladder, seen, inferredHubKo);
    pushPlace();
    pushCity();
  } else if (fineGrain) {
    pushCity();
    pushPlace();
    pushUnique(ladder, seen, admin.neighbourhood);
    const fineBase = admin.neighbourhood || name || nameKo;
    if (!(isDomestic && admin.county && isKoTownshipName(fineBase))) {
      pushUnique(ladder, seen, stripKoAdminSuffix(fineBase));
    }
  } else {
    pushPlace();
    pushCity();
  }

  if (location?.uiPlace) {
    pushUnique(ladder, seen, originalQuery);
  }

  // 국내 TNA는 한글 키워드 우선 — 영문 name_en(Valley 등)은 해외 와인투어 오탐
  if (!isDomestic) {
    pushUnique(ladder, seen, nameEn);
  }
  pushUnique(ladder, seen, admin.state);
  pushUnique(ladder, seen, stripKoAdminSuffix(admin.state));

  // 인근은 상위 래더와 분리 — Edge가 ≤3일 때만 첫 인근으로 보강(Phase 2 더보기)
  const nearbyKeywords = isDomestic ? resolveNearbyExpand(location) : [];

  const keyword = String(ladder[0] || '').trim();
  const altKeywords = ladder.slice(1, 12);
  return { keyword, altKeywords, nearbyKeywords };
}

/**
 * keywordUsed가 인근 확장 키워드인지 (UI 안내 문구용).
 * @param {object} location
 * @param {string} keywordUsed
 */
export function isMrtTnaNearbyKeyword(location, keywordUsed) {
  const used = String(keywordUsed || '').trim();
  if (!used) return false;
  const nearby = resolveNearbyExpand(location);
  return nearby.some((k) => k === used);
}

/**
 * Phase 2: Edge가 nearbyKeywords[0] 자동보강한 뒤 다음 더보기 인덱스.
 * @param {string[]} nearbyKeywords
 * @param {string} keywordUsed
 * @returns {number}
 */
export function nextNearbyExpandIndex(nearbyKeywords, keywordUsed) {
  const list = Array.isArray(nearbyKeywords) ? nearbyKeywords : [];
  const used = String(keywordUsed || '').trim();
  if (!used || list.length === 0) return 0;
  const idx = list.findIndex((k) => k === used);
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * @param {string[]} nearbyKeywords
 * @param {number} nextIndex
 */
export function hasMoreNearbyExpand(nearbyKeywords, nextIndex) {
  const list = Array.isArray(nearbyKeywords) ? nearbyKeywords : [];
  const i = Math.max(0, Number(nextIndex) || 0);
  return i < list.length;
}

/**
 * Phase 3: 인근 칩 — SSOT 길이 ≥2이면 본지 투어 충분 여부와 무관하게 표시.
 * @param {string[]} nearbyKeywords
 */
export function canShowNearbyChips(nearbyKeywords) {
  const list = Array.isArray(nearbyKeywords) ? nearbyKeywords : [];
  return list.length >= 2;
}

/**
 * SSOT 순서상 아직 섹션에 없는 다음 인근 키워드 (더보기·칩 공통).
 * @param {string[]} nearbyKeywords
 * @param {Iterable<string>|string[]} loadedKeywords
 * @returns {string|null}
 */
export function nextUnloadedNearbyKeyword(nearbyKeywords, loadedKeywords) {
  const list = Array.isArray(nearbyKeywords) ? nearbyKeywords : [];
  const loaded = new Set(
    [...(loadedKeywords || [])].map((k) => String(k || '').trim()).filter(Boolean),
  );
  for (const kw of list) {
    const k = String(kw || '').trim();
    if (k && !loaded.has(k)) return k;
  }
  return null;
}

/**
 * 국내 「투어 찾기」탭 — 키워드 있을 때.
 * @param {object} location
 * @param {{ hidden?: boolean }} [opts]
 */
export function canShowMrtTnaStrip(location, opts = {}) {
  if (opts.hidden || !location || location.isScanning) return false;
  if (!isMrtDomesticLocation(location)) return false;
  const query = resolveMrtTnaQuery(location);
  return Boolean(query.keyword);
}
