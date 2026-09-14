/**
 * 무드/의도 검색 — 지오코딩보다 AI 큐레이션을 우선할 질의 판별.
 * 지명 exact(허브·정착지·여행지)는 호출 측에서 먼저 처리한다.
 * 시설 판별은 geocoding.isFacilityQuery와 같은 계열(휴게소·호텔 등)이며,
 * 분위기+여행명사 결합(조용한 해변)은 시설보다 앞선다.
 */

const normalizeSearchKey = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();

const FACILITY_OR_LANDMARK_RE =
  /휴게소|rest\s*area|\bsa\b|터미널|기차역|지하철역|공항|항구|나들목|톨게이트|\bic\b|박물관|미술관|사찰|성당|교회|리조트|호텔|콘도|펜션|댐|저수지|폭포|해변|해수욕장|시장|마트|카페|공원|타워|전망대|온천|스키장|골프장|캠핑장|유원지|테마파크|에펠\s*탑|타임\s*스퀘어|콜로세움|콜로세오|피라미드|eiffel|times\s*square|colosseum|coliseum|pyramid/i;

function looksLikeFacilityQuery(text) {
  return FACILITY_OR_LANDMARK_RE.test(String(text || ''));
}

export const MOOD_HINT_KEYWORDS = [
  '감정', '기분', '마음', '분위기', '무드',
  '우울', '우울해', '울적', '침울', '슬픔', '슬퍼', '눈물',
  '외로', '쓸쓸', '적적', '공허', '허무', '허전',
  '번아웃', '지침', '지쳤', '피곤', '피폐', '무기력', '탈진', '현타', '현실자각',
  '스트레스', '압박', '불안', '초조', '답답', '갑갑', '멘붕', '멘탈',
  '화남', '화나', '짜증', '분노', '빡침',
  '설렘', '설레', '두근', '흥분', '떨림', '신남', '행복',
  '그리움', '향수', '추억', '보고싶', '회상',
  '힐링', '위로', '치유', '회복', '휴식', '쉼', '충전', '리프레시',
  '도망가고 싶다', '떠나고 싶다', '어디론가 가고 싶다', '바람 쐬고 싶다', '잠깐 쉬고 싶다',
  '놀고 싶다', '재밌는 데', '감성', '센치', '낭만', '로맨틱',
  '따뜻한', '조용한', '한적한', '가성비', '낭만적인',
  '아이와', '아이랑', '가족과', '가족끼리',
  'burnout', 'lonely', 'sad', 'angry', 'anxious', 'stressed', 'overwhelmed', 'tired',
  'excited', 'nostalgic', 'healing', 'rest', 'calm', 'refresh', 'escape',
  'quiet', 'peaceful', 'romantic', 'warm', 'sunny', 'relaxing', 'cozy', 'tropical',
];

const MOOD_ADJECTIVES = [
  'quiet', 'peaceful', 'romantic', 'warm', 'sunny', 'relaxing', 'cozy', 'tropical',
  'hidden', 'secluded', 'chill', 'serene', 'budget', 'affordable',
  '따뜻한', '조용한', '한적한', '낭만적인', '로맨틱', '가성비',
  '평화로운', '포근한', '아늑한', '힐링', '감성', '센치', '낭만',
];

const MOOD_TRAVEL_NOUNS = [
  'beaches', 'beach', 'islands', 'island', 'getaway', 'getaways',
  'resort', 'resorts', 'vacation', 'vacations', 'escape', 'paradise',
  '휴양지', '바다', '섬', '힐링', '여행지', '해변', '코스', '리조트',
];

const MOOD_FAMILY_PREFIXES = [
  '아이와', '아이랑', '가족과', '가족끼리', 'withkids', 'withkid', 'family',
];

const MOOD_STANDALONE_GENERIC = [
  '휴양지', 'getaway', 'getaways', 'beaches', '가성비',
];

const STREETISH_LABEL_RE =
  /\b(street|st\.|road|rd\.|avenue|ave\.|lane|ln\.|drive|dr\.|blvd|boulevard|highway|way)\b|(?:거리|도로|로)$/i;

const WEAK_PLACE_TYPES = new Set(['address', 'street']);
const PLACE_LIKE_TYPES = new Set([
  'place',
  'region',
  'country',
  'district',
  'locality',
  'neighborhood',
  'city',
]);
const WEAK_OSM_CLASS = new Set(['highway', 'shop', 'office', 'amenity', 'building']);

function compactIncludesAny(compact, list) {
  return list.some((keyword) => compact.includes(normalizeSearchKey(keyword)));
}

export function hasMoodCombination(text) {
  const compact = normalizeSearchKey(text);
  if (!compact) return false;
  const hasAdj = compactIncludesAny(compact, MOOD_ADJECTIVES);
  const hasNoun = compactIncludesAny(compact, MOOD_TRAVEL_NOUNS);
  if (hasAdj && hasNoun) return true;
  if (compactIncludesAny(compact, MOOD_FAMILY_PREFIXES) && hasNoun) return true;
  return compactIncludesAny(compact, MOOD_STANDALONE_GENERIC);
}

export function isLikelyMoodQuery(text) {
  const compact = normalizeSearchKey(text);
  if (!compact) return false;
  if (hasMoodCombination(text)) return true;
  if (compact.length >= 8) return true;
  if (/[?!.]/.test(text || '')) return true;
  return compactIncludesAny(compact, MOOD_HINT_KEYWORDS);
}

/**
 * Mapbox/Nominatim 지오코딩을 건너뛰고 AI 무드 큐레이션으로 보낸다.
 * 시설 검색·테마 키워드(빙하 등)는 기존 경로를 유지한다.
 * 분위기+여행명사 결합은 시설·테마 히트보다 앞선다 (조용한 바다).
 */
export function shouldSkipGeocodeForMood(text, { hasThemeHits = false, isFacility = false } = {}) {
  if (hasMoodCombination(text)) return true;
  if (isFacility || looksLikeFacilityQuery(text)) return false;
  if (hasThemeHits) return false;
  const compact = normalizeSearchKey(text);
  if (!compact) return false;
  if (/[?!.]/.test(text || '')) return true;
  return compactIncludesAny(compact, MOOD_HINT_KEYWORDS);
}

export function isStreetishGeocodeLabel(value) {
  return STREETISH_LABEL_RE.test(String(value || '').trim());
}

/**
 * 무드 질의인데 도로명·상호 POI로 떨어진 지오코딩 결과는 버린다.
 * @param {string} query
 * @param {object|null} coords
 */
export function isWeakGeocodeHitForMood(query, coords) {
  if (!coords) return false;
  if (looksLikeFacilityQuery(query) && !hasMoodCombination(query)) return false;
  const compact = normalizeSearchKey(query);
  const moodish =
    hasMoodCombination(query) ||
    /[?!.]/.test(query || '') ||
    compactIncludesAny(compact, MOOD_HINT_KEYWORDS);
  if (!moodish) return false;

  const types = (Array.isArray(coords.place_types) ? coords.place_types : [])
    .map((t) => String(t || '').toLowerCase());
  if (types.some((t) => WEAK_PLACE_TYPES.has(t))) return true;
  if (isStreetishGeocodeLabel(coords.name) || isStreetishGeocodeLabel(coords.display_name)) {
    return true;
  }
  if (types.includes('poi') && !types.some((t) => PLACE_LIKE_TYPES.has(t))) return true;

  const osmClass = String(coords.osm_class || coords.class || '').toLowerCase();
  if (WEAK_OSM_CLASS.has(osmClass)) return true;
  return false;
}

export function buildMooniMoodAskText(query) {
  const q = String(query || '').trim();
  if (!q) return '여행지 추천해줘';
  return `${q} 여행지 추천해줘`;
}
