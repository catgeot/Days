/**
 * 축제/좌표 nearby 큐레이션 — 편의시설·일반 교회 등 비명소 제외.
 * scenic 전국 목록에는 적용하지 않음.
 */

/** 화장실·주차장 등 편의/비명소 제목 */
const AMENITY_TITLE_RE =
  /화장실|공중변소|공중화장실|장애인\s*화장실|소변기|공영주차장|노상주차장|임시주차장|버스정류장|관리사무소|매표소$|안내소$/u;

/** 복지·목욕·생활문화 — 관광 볼거리가 아닌 시설 */
const FACILITY_TITLE_RE =
  /사우나|찜질|해수찜|목욕탕|공중목욕|복지관|사회복지|복지센터|노인회|생활문화|주민센터|경로당|행정복지|노인정|마을회관|주민자치|고등학교|중학교|초등학교|강당|학교/u;

const COMPANY_TITLE_RE = /주식회사|㈜|(?:\(|（)주(?:\)|）)/u;

/**
 * TourAPI contentType 12 cat3 — 이색찜질방·터널.
 * 여객터미널은 A02020800(유람선·잠수함)이나 A02040800(산업 기타)에 섞여 있다.
 * 그 코드를 빼면 유람선까지 빠지므로 교통·관공서는 제목으로만 거른다.
 */
/** 이색찜질방·터널 */
const NON_TOURIST_CAT3 = new Set(['A02020400', 'A02050500']);

/** 여객·버스·선착 터미널, 기차역, 읍면사무소·치안·우체국·법원·세무서 */
const TRANSPORT_GOV_PHRASE_RE =
  /여객터미널|터미널|기차역|읍사무소|면사무소|행정복지센터|경찰서|소방서|우체국|법원(?!리)|세무서/u;

/** 시청·군청·구청·도청은 토큰 끝만. 시흥시청소년처럼 경계가 붙은 이름은 통과 */
const OFFICE_SUFFIX_RE = /(?:시청|군청|구청|도청)$/u;

/** OO역. 역사·역사공원은 역 뒤에 글자가 있어 여기 안 걸린다 */
const STATION_SUFFIX_RE = /[가-힣]역$/u;

/** 역으로 끝나도 역사가 아닌 말 */
const NON_STATION_SUFFIX_RE = /(?:지역|권역|광역|무역|통역|번역|구역)$/u;

/**
 * 폐역·등록문화재·구 서울역·화랑대역·전망 터미널은 nearby에 남긴다.
 * 일반 교구 교회 allowlist(CHRISTIAN_LANDMARK_RE)와 같은 방식.
 */
const TRANSPORT_LANDMARK_RE =
  /문화재|사적|등록문화|국보|보물|유적|옛\s*|구\s+|전망대|전망|폐역|화랑대역|문화역/u;

/** 일반 교회·성당 (사찰·성지는 별도) */
const CHRISTIAN_TITLE_RE =
  /교회|성당|성결교회|감리교회|침례교회/u;

/**
 * 문화재·성지·대표 명소로 볼 만한 표기.
 * 일반 교구 성당/교회는 여기 없으면 nearby에서 제외.
 */
const CHRISTIAN_LANDMARK_RE =
  /문화재|사적|성지|유적|주교좌|순교|옛\s*|구\s+|등록문화|국보|보물|향토|순례|약현|명동|공세리|나바위|합덕|감곡|손골|용산신학교|예배당|성모|매괴|제일교회|성공회/u;

function titleTokens(title) {
  return String(title).split(/[\s·,./()[\]【】~～\-]+/u).filter(Boolean);
}

function isTransportOrGovernmentTitle(title) {
  if (TRANSPORT_GOV_PHRASE_RE.test(title)) return true;
  return titleTokens(title).some((token) => {
    if (OFFICE_SUFFIX_RE.test(token)) return true;
    if (!STATION_SUFFIX_RE.test(token)) return false;
    return !NON_STATION_SUFFIX_RE.test(token);
  });
}

/**
 * @param {string | null | undefined} title
 * @returns {boolean} nearby 후보로 쓸지
 */
export function isNearbyTourAttractionTitle(title) {
  const t = String(title || '').trim();
  if (!t) return false;
  if (AMENITY_TITLE_RE.test(t)) return false;
  if (COMPANY_TITLE_RE.test(t)) return false;
  if (FACILITY_TITLE_RE.test(t)) return false;
  if (isTransportOrGovernmentTitle(t) && !TRANSPORT_LANDMARK_RE.test(t)) {
    return false;
  }
  if (CHRISTIAN_TITLE_RE.test(t) && !CHRISTIAN_LANDMARK_RE.test(t)) {
    return false;
  }
  return true;
}

/**
 * @param {string | null | undefined} cat3
 */
export function isNonTouristFacilityCat3(cat3) {
  const code = String(cat3 || '').trim().toUpperCase();
  return NON_TOURIST_CAT3.has(code);
}

/**
 * @param {{ name?: string, title?: string } | null | undefined} spotOrRow
 */
export function isNearbyTourAttractionCandidate(spotOrRow) {
  if (!spotOrRow) return false;
  if (isNonTouristFacilityCat3(spotOrRow.cat3)) return false;
  return isNearbyTourAttractionTitle(spotOrRow.name || spotOrRow.title);
}
