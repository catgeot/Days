/**
 * MRT 숙소 검색 쿼리 해석 (순수) — Edge `fetch-mrt-stays` body 구성.
 * supabase 클라이언트 의존 없음 → Node 스모크·단위 테스트 가능.
 */
import { isPlaceholderCountry } from './travelSpotResolve.js';

/**
 * 동명·오탐·미매칭 slug — 1차 키워드·대안·(선택) 국가 힌트 덮어쓰기.
 * countryHint/countryHintAlts: gateo country가 MRT subName과 다를 때(홍콩 country=중국 등).
 * ignoreStayAdmin: 역지오 stayAdmin(관문 도시 등)이 키워드·cityHints에 섞이지 않게 — 오지·외부영토.
 * @type {Record<string, { keyword?: string, altKeywords?: string[], countryHint?: string, countryHintAlts?: string[], ignoreStayAdmin?: boolean }>}
 */
const MRT_STAY_KEYWORD_OVERRIDES = {
  palau: { keyword: '코로르', altKeywords: ['Koror', '팔라우'] },
  /** MRT「괌」CITY(망길라오)는 재고 0 — 투몬·타무닝 호텔 밀집 */
  guam: { keyword: '투몬', altKeywords: ['Tumon', '괌', 'Guam', '타무닝'] },
  /** 인도「발리」(라자스탄) 동명 — 덴파사르·우붓으로 인도네시아 고정 */
  bali: { keyword: '덴파사르', altKeywords: ['Denpasar', '우붓', 'Ubud', '발리', 'Bali'] },
  /** 「파타고니아 박물관」POI 가로채기 → 바릴로체 CITY */
  patagonia: {
    keyword: '바릴로체',
    altKeywords: ['Bariloche', '산 카를로스 데 바릴로체', '파타고니아'],
  },
  hawaii: { keyword: '하와이', altKeywords: ['호놀룰루', 'Honolulu', 'Hawaii', '와이키키'] },
  honolulu: { keyword: '호놀룰루', altKeywords: ['Honolulu', '하와이', 'Hawaii', '와이키키'] },
  'la-reunion': {
    keyword: '레위니옹',
    altKeywords: ['La Reunion', 'Reunion', 'Réunion', '생드니', 'Saint-Denis'],
  },
  /**
   * 「버뮤다」→세인트조지스 CITY는 재고 0.
   * 패짓(Paget) CITY에 호텔 재고 — 1차 키워드를 패짓으로.
   */
  bermuda: {
    keyword: '패짓',
    altKeywords: ['Paget', '해밀턴', 'Hamilton', '버뮤다', 'Bermuda'],
  },
  saipan: { keyword: '사이판', altKeywords: ['Saipan', '가란', 'Garapan'] },
  /** 「우유니 소금사막」autocomplete 미매칭 — CITY「우유니」 */
  'uyuni-salt-flat': {
    keyword: '우유니',
    altKeywords: ['Uyuni', '우유니 소금사막', 'Uyuni Salt Flat'],
  },
  /**
   * 「라자 암팟」공백·미매칭 — 섬 허브 와이사이 우선(리조트), 관문 소롱 대안.
   */
  'raja-ampat': {
    keyword: '와이사이',
    altKeywords: ['Waisai', '라자암팟', '라자 암팟', 'Raja Ampat', '소롱', 'Sorong'],
  },
  /** gateo country「중국」↔ MRT「홍콩 특별행정구」 */
  'hong-kong': {
    keyword: '홍콩',
    altKeywords: ['Hong Kong', '침사추이', '코우룬', 'Kowloon'],
    countryHint: '홍콩',
    countryHintAlts: ['홍콩 특별행정구', 'Hong Kong'],
  },
  /** 「마카오」한글 → 포르투갈 지명 오탐 — 영문 Macau + 특별행정구 */
  macau: {
    keyword: 'Macau',
    altKeywords: ['마카오', 'Macao'],
    countryHint: '마카오',
    countryHintAlts: ['마카오 특별행정구', 'Macau', 'Macao'],
  },
  /** 「대마도」미매칭 — MRT CITY「쓰시마」 */
  tsushima: { keyword: '쓰시마', altKeywords: ['Tsushima', '이즈하라', 'Izuhara', '대마도'] },
  /** 바티칸 단독 region 없음 → 로마 + 이탈리아 */
  vatican: {
    keyword: '로마',
    altKeywords: ['Rome', '바티칸', 'Vatican'],
    countryHint: '이탈리아',
    countryHintAlts: ['Italy', '바티칸', 'Vatican'],
  },
  /** 터키↔튀르키예는 country alts · 키워드 보강 */
  bodrum: { keyword: '보드룸', altKeywords: ['Bodrum'] },
  'phi-phi-islands': {
    keyword: '톤사이',
    altKeywords: ['피피동', 'Phi Phi Don', '크라비', 'Krabi', '피피'],
  },
  'similan-islands': {
    keyword: '카오락',
    altKeywords: ['Khao Lak', '시밀란', 'Similan'],
  },
  'andaman-islands': {
    keyword: '포트블레어',
    altKeywords: ['Port Blair', '안다만', 'Andaman'],
  },
  'easter-island': {
    keyword: '앙가로아',
    altKeywords: ['Hanga Roa', '이스터', 'Easter Island'],
  },
  galapagos: {
    keyword: '푸에르토아요라',
    altKeywords: ['Puerto Ayora', '갈라파고스', 'Galapagos'],
  },
  fez: { keyword: '페스', altKeywords: ['Fes', 'Fez', '페즈'] },
  hampi: { keyword: '호스펫', altKeywords: ['Hospet', '함피', 'Hampi'] },
  'angkor-thom': {
    keyword: '시엠립',
    altKeywords: ['Siem Reap', '씨엠립', '앙코르'],
  },
  'annapurna-circuit': {
    keyword: '포카라',
    altKeywords: ['Pokhara', '안나푸르나', 'Annapurna'],
  },
  'kala-patthar': {
    keyword: '루클라',
    altKeywords: ['Lukla', '나체바자르', 'Namche'],
  },
  'inca-trail': {
    keyword: '쿠스코',
    altKeywords: ['Cusco', 'Cuzco', '잉카'],
  },
  'amazon-rainforest': {
    keyword: '마나우스',
    altKeywords: ['Manaus', '아마존', 'Amazon'],
  },
  aconcagua: {
    keyword: '멘도사',
    altKeywords: ['Mendoza', '아콩카과', 'Aconcagua'],
  },
  denali: {
    keyword: '앵커리지',
    altKeywords: ['Anchorage', '페어뱅크스', 'Fairbanks', '데날리'],
  },
  'carstensz-pyramid': {
    keyword: '티미카',
    altKeywords: ['Timika', '팀카', '카르스텐츠'],
  },
  'kamchatka-peninsula': {
    keyword: '페트로파블롭스크',
    altKeywords: ['Petropavlovsk', '캄차카', 'Kamchatka'],
  },
  /** 사하라 허브로 마라케시(모로코) — gateo country「사하라」는 MRT 미매칭 */
  'sahara-desert': {
    keyword: '마라케시',
    altKeywords: ['Marrakech', 'Marrakesh', '사하라'],
    countryHint: '모로코',
    countryHintAlts: ['Morocco', '사하라'],
  },
  /**
   * 호주령 크리스마스섬 — 항공 관문 PER이 stayAdmin/cityHints에 섞이면 퍼스 숙소 오탐.
   * 섬 정착지 Flying Fish Cove만 검색 · 미매칭 시 empty(공식 안내 SSOT).
   */
  'christmas-island': {
    keyword: 'Flying Fish Cove',
    altKeywords: ['플라잉피시코브', '크리스마스섬', 'Christmas Island'],
    countryHint: '호주',
    countryHintAlts: ['Australia', 'Christmas Island', '크리스마스섬'],
    ignoreStayAdmin: true,
  },
  /**
   * 호주령 코코스(킬링) — 동일하게 PER 관문 오탐 방지 · 웨스트 아일랜드 허브.
   */
  'cocos-islands': {
    keyword: 'West Island',
    altKeywords: ['웨스트아일랜드', '코코스제도', 'Cocos Keeling', 'Cocos Islands'],
    countryHint: '호주',
    countryHintAlts: ['Australia', 'Cocos', '코코스'],
    ignoreStayAdmin: true,
  },
  /**
   * 「아이슬란드」국가 검색보다 MRT CITY「레이캬비크」재고가 홈과 동일하게 풍부.
   */
  iceland: {
    keyword: '레이캬비크',
    altKeywords: ['Reykjavik', 'Reykjavík', '아이슬란드', 'Iceland'],
  },
  /**
   * 라로통가 — CITY「라로통가」(홈 total≈143) 우선.
   * 아바루아/아로랑기는 NEIGHBORHOOD로 좁혀져 재고·홈 괴리(8·36)가 큼.
   */
  rarotonga: {
    keyword: '라로통가',
    altKeywords: ['Rarotonga', '아바루아', 'Avarua', '아로랑기', 'Arorangi'],
    countryHint: '쿡 제도',
    countryHintAlts: ['Cook Islands', '쿡제도'],
  },
};

/**
 * gateo 여행 표기(하와이·영토) → MRT subName head/세그먼트와 맞출 주권·별칭.
 * @type {Record<string, string[]>}
 */
const MRT_COUNTRY_HINT_ALTS = {
  하와이: ['미국', 'USA', 'United States', 'Hawaii'],
  hawaii: ['미국', 'USA', 'United States', '하와이'],
  괌: ['Guam'],
  guam: ['괌'],
  '북마리아나 제도': ['북마리아나제도', 'Northern Mariana Islands', 'Saipan', '사이판'],
  'northern mariana islands': ['북마리아나제도', '북마리아나 제도', 'Saipan'],
  '프랑스령 레위니옹': ['레위니옹', 'Reunion', 'La Reunion', 'Réunion'],
  'la reunion': ['레위니옹', 'Reunion', 'Réunion', '프랑스령 레위니옹'],
  reunion: ['레위니옹', 'La Reunion', 'Réunion'],
  '미크로네시아 연방': ['미크로네시아연방', 'Micronesia', 'Federated States of Micronesia', 'FSM'],
  'federated states of micronesia': ['미크로네시아 연방', '미크로네시아연방', 'Micronesia'],
  버뮤다: ['Bermuda'],
  bermuda: ['버뮤다'],
  '쿡 제도': ['Cook Islands', '쿡제도'],
  'cook islands': ['쿡 제도', '쿡제도'],
  /** MRT subName head는「튀르키예」— gateo「터키」 */
  터키: ['튀르키예', 'Turkey', 'Türkiye'],
  turkey: ['튀르키예', '터키', 'Türkiye'],
  튀르키예: ['터키', 'Turkey', 'Türkiye'],
  /** 홍콩·마카오 — spot country가「중국」인 경우 slug override와 병행 */
  홍콩: ['홍콩 특별행정구', 'Hong Kong', '중국'],
  'hong kong': ['홍콩', '홍콩 특별행정구', '중국'],
  마카오: ['마카오 특별행정구', 'Macau', 'Macao', '중국'],
  macau: ['마카오', '마카오 특별행정구', 'Macao'],
};

const OVERSEAS_PREFIX_RE = /^(프랑스령|영국령|미국령|네덜란드령|덴마크령|포르투갈령)\s+/u;

const KO_ADMIN_SUFFIX_RE =
  /(특별자치시|특별자치도|광역시|특별시|자치시|자치군|시|군|구|읍|면|동)$/;

/** 국내 동·리·읍·면 — 세밀 행정(시·군보다 아래) */
const KO_FINE_ADMIN_RE = /[동읍면리]$/;
/** 국내 읍·면·리 — OSM town/village→city 시 MRT CITY 선두 금지(대화면→일산 대화 · 이평리→리 단독) */
const KO_TOWNSHIP_RE = /[읍면리]$/;
/**
 * 역·길·터미널 등 MRT CITY가 아닌 지점 라벨.
 * 「종각역」을 1차 키워드로 두면 autocomplete POI·빈 목록이 되고 서울 CITY에 못 닿음.
 * 무역·번역 등 역으로 끝나는 일반 명사는 제외.
 */
const KO_STAY_POINT_RE = /(지하철역|기차역|고속터미널|터미널|정류장|역|길|대학교)$/;
/** 역이 아닌 일반 명사 — 전체 일치만. 「연신내역」「신대방역」접미 오탐 금지 */
const KO_STAY_POINT_FALSE_EXACT = new Set([
  '무역',
  '검역',
  '방역',
  '용역',
  '영역',
  '번역',
  '이력',
  '내역',
  '현역',
  '대역',
]);
const EN_STAY_POINT_RE = /\b(station|subway|metro|terminal)\b|-gil\b/i;
/**
 * 역명 약칭. 「종각」단독이 대구 종각 광장으로 떨어지지 않게.
 * district = MRT NEIGHBORHOOD 키워드 (종로 632건).
 */
const KO_STATION_ALIASES = {
  종각: { station: '종각역', district: '종로', lat: 37.5701, lng: 126.9829 },
};

/**
 * 본교 좌표. Mapbox가 수련원·연수원을 대학 본명으로 주면 양양 호텔이 붙는다.
 * 삼척·도계·수련원 등 한정 검색은 별칭을 쓰지 않는다.
 */
const KO_UNIVERSITY_ALIASES = {
  강원대학교: {
    campus: '강원대학교 춘천캠퍼스',
    nameEn: 'Kangwon National University',
    city: '춘천',
    lat: 37.8695,
    lng: 127.744,
  },
  강원대: {
    campus: '강원대학교 춘천캠퍼스',
    nameEn: 'Kangwon National University',
    city: '춘천',
    lat: 37.8695,
    lng: 127.744,
  },
  kangwonnationaluniversity: {
    campus: '강원대학교 춘천캠퍼스',
    nameEn: 'Kangwon National University',
    city: '춘천',
    lat: 37.8695,
    lng: 127.744,
  },
};

/** 본교가 아닌 캠퍼스·수련원 — compactKoPlaceKey(query)로 조회 */
const KO_UNIVERSITY_SATELLITE_ALIASES = {
  강원대학교동해수련원: {
    name: '강원대학교 동해수련원',
    nameEn: 'Kangwon National University Donghae Training Center',
    city: '양양',
    lat: 38.0866,
    lng: 128.6486,
  },
  강원대동해수련원: {
    name: '강원대학교 동해수련원',
    nameEn: 'Kangwon National University Donghae Training Center',
    city: '양양',
    lat: 38.0866,
    lng: 128.6486,
  },
};

const UNI_CAMPUS_QUALIFIER_RE = /삼척|도계|강릉|수련원|연수원|학술림|연습림|부속병원/;
const UNI_SATELLITE_LABEL_RE = /수련원|연수원|학술림|연습림|부속병원/;

/** 본교에서 이 거리 밖이면 수련원 오탐으로 본다 */
export const UNIVERSITY_CAMPUS_MAX_KM = 20;

function haversineKmSimple(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

const STREETISH_STAY_LABEL_RE =
  /-gil\b|(?:길|거리|도로|로)$/i;
const STREETISH_STAY_EN_RE =
  /\b(street|st\.|road|rd\.|avenue|ave\.|lane|ln\.|drive|dr\.|blvd|boulevard|highway|way)\b/i;

function compactKoPlaceKey(raw) {
  return String(raw || '').trim().replace(/\s+/g, '');
}

function isKoFineAdminName(name) {
  return KO_FINE_ADMIN_RE.test(String(name || '').trim());
}

function isKoTownshipName(name) {
  return KO_TOWNSHIP_RE.test(String(name || '').trim());
}

/** 「종각」→ 종각역·종로. 「종각역」도 동일 district. */
export function resolveKoStationAlias(raw) {
  const s = compactKoPlaceKey(raw).split(/[,/]/)[0];
  if (!s || s.length < 2) return null;
  if (KO_STATION_ALIASES[s]) return KO_STATION_ALIASES[s];
  const stripped = s.replace(/역$/, '');
  if (stripped !== s && KO_STATION_ALIASES[stripped]) return KO_STATION_ALIASES[stripped];
  return null;
}

/** 「강원대학교」→ 춘천 본교. 「강원대학교 동해수련원」은 null. */
export function resolveKoUniversityAlias(raw) {
  const s = compactKoPlaceKey(raw).split(/[,/]/)[0];
  if (!s || s.length < 2) return null;
  if (UNI_CAMPUS_QUALIFIER_RE.test(s)) return null;
  if (KO_UNIVERSITY_ALIASES[s]) return KO_UNIVERSITY_ALIASES[s];
  const lower = s.toLowerCase();
  if (KO_UNIVERSITY_ALIASES[lower]) return KO_UNIVERSITY_ALIASES[lower];
  return null;
}

/** 「강원대학교 동해수련원」→ 양양 금강리. 본교 alias와 별도. */
export function resolveKoUniversitySatelliteAlias(raw) {
  const s = compactKoPlaceKey(raw).split(/[,/]/)[0];
  if (!s || s.length < 4) return null;
  if (KO_UNIVERSITY_SATELLITE_ALIASES[s]) return KO_UNIVERSITY_SATELLITE_ALIASES[s];
  for (const [key, alias] of Object.entries(KO_UNIVERSITY_SATELLITE_ALIASES)) {
    if (s.includes(key)) return alias;
  }
  return null;
}

export function isUniversitySatelliteStayQuery(raw) {
  return Boolean(resolveKoUniversitySatelliteAlias(raw));
}

function universityAliasFromLocation(location) {
  const oq = String(location?.originalQuery || '').trim();
  if (oq && UNI_CAMPUS_QUALIFIER_RE.test(compactKoPlaceKey(oq))) return null;
  return (
    resolveKoUniversityAlias(oq) ||
    resolveKoUniversityAlias(location?.name) ||
    resolveKoUniversityAlias(location?.name_ko) ||
    resolveKoUniversityAlias(location?.name_en)
  );
}

export { universityAliasFromLocation };

export function isUniversityStayQuery(raw) {
  const s = compactKoPlaceKey(raw).split(/[,/]/)[0];
  if (!s) return false;
  if (resolveKoUniversityAlias(s)) return true;
  return /대학교$/.test(s);
}

function universityHitBlob(item) {
  const admin = item?.stayAdmin && typeof item.stayAdmin === 'object' ? item.stayAdmin : {};
  return [
    item?.name,
    item?.name_en,
    item?.name_ko,
    item?.place_formatted,
    item?.display_name,
    item?.parentCity,
    admin.city,
    admin.neighbourhood,
    admin.district,
    admin.county,
    admin.state,
  ]
    .map((v) => String(v || ''))
    .join(' ');
}

/** 수련원·본교에서 먼 핀일수록 큼. 검색 히트·지오코딩 순위에 사용. */
export function universitySearchHitPenalty(query, item) {
  const q = compactKoPlaceKey(query).split(/[,/]/)[0];
  const alias = resolveKoUniversityAlias(q);
  const uniQuery = Boolean(alias) || /대학교$/.test(q);
  if (!uniQuery) return 0;

  const blob = universityHitBlob(item);
  const queryWantsSatellite = UNI_CAMPUS_QUALIFIER_RE.test(q);
  let penalty = 0;
  if (!queryWantsSatellite && UNI_SATELLITE_LABEL_RE.test(blob)) penalty += 100;
  if (alias) {
    if (alias.city && blob.includes(alias.city)) penalty -= 40;
    if (/금강리|geumgang|양양|yangyang/i.test(blob) && !(alias.city && blob.includes(alias.city))) {
      penalty += 80;
    }
    const lat = Number(item?.lat);
    const lng = Number(item?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const km = haversineKmSimple(lat, lng, alias.lat, alias.lng);
      if (km > UNIVERSITY_CAMPUS_MAX_KM) penalty += 80;
      else if (km < 5) penalty -= 30;
    }
  }
  return penalty;
}

export function rankUniversitySearchHits(query, hits) {
  const list = Array.isArray(hits) ? hits.filter(Boolean) : [];
  if (!isUniversityStayQuery(query) || list.length < 2) return list;
  return list
    .map((item, index) => ({
      item,
      index,
      penalty: universitySearchHitPenalty(query, item),
    }))
    .sort((a, b) => a.penalty - b.penalty || a.index - b.index)
    .map((row) => row.item);
}

const UNI_TOWNSHIP_NAME_EN_RE = /(-ri|-eup|-myeon|-dong)\b|금강리|geumgang/i;

function universityPlaceHasTownshipEnglish(item) {
  const nameEn = String(item?.name_en || '').trim();
  if (!nameEn) return false;
  if (/university|kangwon|chuncheon/i.test(nameEn)) return false;
  return UNI_TOWNSHIP_NAME_EN_RE.test(nameEn);
}

function sameUniversityPlaceCenter(a, b) {
  const lat1 = Number(a?.lat);
  const lng1 = Number(a?.lng);
  const lat2 = Number(b?.lat);
  const lng2 = Number(b?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return false;
  return Math.abs(lat1 - lat2) <= 0.08 && Math.abs(lng1 - lng2) <= 0.08;
}

function universityQueryDisplayName(query, alias) {
  const head = String(query || '').trim().split(/[,/]/)[0].trim();
  if (head && !UNI_CAMPUS_QUALIFIER_RE.test(compactKoPlaceKey(head))) return head;
  return alias?.campus || head;
}

/** 본교에서 멀거나 수련원·금강리 핀이면 장소카드 원점도 춘천으로 바꿔야 함 */
export function universityPlaceNeedsCampusSnap(query, item) {
  const alias = resolveKoUniversityAlias(query);
  if (!alias || !item) return false;
  if (universitySearchHitPenalty(query, item) >= 50) return true;
  const lat = Number(item.lat);
  const lng = Number(item.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return haversineKmSimple(lat, lng, alias.lat, alias.lng) > UNIVERSITY_CAMPUS_MAX_KM;
  }
  return false;
}

/** 금강리 같은 리·읍·면 name_en을 본교 영문명으로. 좌표가 양양이면 본교로 스냅 */
export function applyUniversityCampusPlace(query, place) {
  const alias = resolveKoUniversityAlias(query);
  if (!alias || !place) return place;
  const needsSnap = universityPlaceNeedsCampusSnap(query, place);
  const townshipEn = universityPlaceHasTownshipEnglish(place);
  if (!needsSnap && !townshipEn) return place;
  const next = {
    ...place,
    name_en: alias.nameEn || place.name_en,
  };
  const admin =
    place.stayAdmin && typeof place.stayAdmin === 'object' ? { ...place.stayAdmin } : {};
  admin.city = alias.city;
  if (needsSnap) {
    next.lat = alias.lat;
    next.lng = alias.lng;
    next.mapboxId = undefined;
    next.id = `campus-${alias.lat}-${alias.lng}`;
    admin.neighbourhood = '';
  }
  next.stayAdmin = admin;
  return next;
}

function syntheticUniversityCampusPlace(query, alias) {
  const name = universityQueryDisplayName(query, alias);
  return {
    id: `campus-${alias.lat}-${alias.lng}`,
    kind: 'poi',
    badge: '장소',
    name,
    name_ko: name,
    name_en: alias.nameEn || name,
    country: '대한민국',
    country_en: 'South Korea',
    lat: alias.lat,
    lng: alias.lng,
    stayAdmin: { city: alias.city },
    source: 'campus-alias',
    uiPlace: true,
    originalQuery: query,
  };
}

/** 수련원·연수원 SSOT — Mapbox/AI 폴백 전에 바로 핀 */
export function syntheticUniversitySatellitePlace(query, alias) {
  const name = String(alias?.name || query || '').trim();
  return {
    id: `satellite-${alias.lat}-${alias.lng}`,
    kind: 'poi',
    badge: '장소',
    name,
    name_ko: name,
    name_en: alias.nameEn || name,
    country: '대한민국',
    country_en: 'South Korea',
    lat: alias.lat,
    lng: alias.lng,
    stayAdmin: { city: alias.city },
    source: 'satellite-alias',
    uiPlace: true,
    originalQuery: query,
  };
}

/** 검색 카드에서 양양 수련원 핀을 빼고 춘천 본교만 남긴다 */
export function resolveUniversitySearchHits(query, hits) {
  const list = Array.isArray(hits) ? hits.filter(Boolean) : [];
  const satelliteAlias = resolveKoUniversitySatelliteAlias(query);
  if (satelliteAlias) {
    const ranked = rankUniversitySearchHits(query, list);
    const out = [];
    for (const hit of ranked) {
      if (out.some((row) => sameUniversityPlaceCenter(row, hit))) continue;
      out.push({ ...hit, originalQuery: hit.originalQuery || query });
    }
    if (out.length) return out;
    return [syntheticUniversitySatellitePlace(query, satelliteAlias)];
  }
  const alias = resolveKoUniversityAlias(query);
  if (!alias) return rankUniversitySearchHits(query, list);
  const ranked = rankUniversitySearchHits(query, list);
  const out = [];
  for (const hit of ranked) {
    if (universityPlaceNeedsCampusSnap(query, hit)) continue;
    const labeled = applyUniversityCampusPlace(query, hit);
    if (!universityAliasFitsPlace(alias, labeled, query)) continue;
    if (out.some((row) => sameUniversityPlaceCenter(row, labeled))) continue;
    out.push({ ...labeled, originalQuery: labeled.originalQuery || query });
  }
  if (out.length) return out;
  return [syntheticUniversityCampusPlace(query, alias)];
}

export function universityAliasFitsPlace(alias, item, query = '') {
  if (!alias) return true;
  if (!item) return false;
  const q = String(query || '').trim();
  if (q && resolveKoUniversityAlias(q)) {
    return universitySearchHitPenalty(q, item) < 50;
  }
  const lat = Number(item.lat);
  const lng = Number(item.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return haversineKmSimple(lat, lng, alias.lat, alias.lng) <= UNIVERSITY_CAMPUS_MAX_KM;
  }
  const blob = universityHitBlob(item);
  return Boolean(alias.city && blob.includes(alias.city));
}

export function nominatimUniversityScoreDelta(query, result) {
  if (!isUniversityStayQuery(query)) return 0;
  const name = String(result?.name || '');
  const type = String(result?.type || '');
  const cls = String(result?.class || '');
  const blob = `${name} ${JSON.stringify(result?.address || {})}`;
  const q = compactKoPlaceKey(query).split(/[,/]/)[0];
  let delta = 0;
  if (cls === 'amenity' && (type === 'university' || type === 'college')) delta += 80;
  if (!UNI_CAMPUS_QUALIFIER_RE.test(q) && UNI_SATELLITE_LABEL_RE.test(name)) delta -= 100;
  const alias = resolveKoUniversityAlias(q);
  if (alias?.city && blob.includes(alias.city)) delta += 40;
  const lat = Number(result?.lat);
  const lng = Number(result?.lon ?? result?.lng);
  if (alias && Number.isFinite(lat) && Number.isFinite(lng)) {
    const km = haversineKmSimple(lat, lng, alias.lat, alias.lng);
    if (km > UNIVERSITY_CAMPUS_MAX_KM) delta -= 80;
    else if (km < 5) delta += 40;
  }
  return delta;
}

export function stationNameMatchesQuery(query, resultName) {
  const q = compactKoPlaceKey(query).split(/[,/]/)[0];
  const n = compactKoPlaceKey(resultName);
  if (!q || !n || q.length < 2) return false;
  if (n === q || n === `${q}역`) return true;
  const alias = resolveKoStationAlias(q);
  return Boolean(alias?.station && n === compactKoPlaceKey(alias.station));
}

export function isNominatimRailwayHit(result) {
  const type = String(result?.type || '');
  const cls = String(result?.class || '');
  const category = String(result?.category || '');
  return (
    type === 'station' ||
    type === 'subway' ||
    type === 'halt' ||
    type === 'tram_stop' ||
    cls === 'railway' ||
    category === 'railway'
  );
}

/** 약칭·역 검색은 철도역 가산. 아니면 railway 페널티(기존). */
export function nominatimStationScoreDelta(query, result) {
  if (!isNominatimRailwayHit(result)) return 0;
  if (queryLooksLikeStayPoint(query) || stationNameMatchesQuery(query, result?.name)) return 80;
  return -40;
}

export function nominatimSquarePenalty(query, result) {
  const cls = String(result?.class || '');
  const type = String(result?.type || '');
  if (cls === 'place' && type === 'square' && queryLooksLikeStayPoint(query)) return -60;
  return 0;
}

/** 종로구·종로1가·약칭 district → MRT NEIGHBORHOOD 키워드 */
export function mrtNeighborhoodKeyword(admin = {}, location = {}) {
  const uni = universityAliasFromLocation(location);
  if (uni?.city) return uni.city;
  const alias =
    resolveKoStationAlias(location?.originalQuery) ||
    resolveKoStationAlias(location?.name) ||
    resolveKoStationAlias(location?.name_ko);
  if (alias?.district) return alias.district;
  const strippedDistrict = stripKoAdminSuffix(admin?.district);
  if (strippedDistrict) return strippedDistrict;
  const rawDistrict = String(admin?.district || '').trim();
  if (rawDistrict.length >= 2 && rawDistrict !== String(admin?.city || '').trim()) {
    if (!/(특별시|광역시|특별자치시|특별자치도)$/.test(rawDistrict)) return rawDistrict;
  }
  const nb = String(admin?.neighbourhood || '').trim();
  const m = nb.match(/^([가-힣]{2,})(?:\d+가|\d+동)$/u);
  return m ? m[1] : '';
}

/** 역·길·터미널·station — 숙소 검색은 시·군을 선두 */
export function isMrtStayPointLabel(raw) {
  const s = String(raw || '').trim();
  if (!s || s.length < 2) return false;
  if (EN_STAY_POINT_RE.test(s)) return true;
  const compact = compactKoPlaceKey(s);
  if (KO_STAY_POINT_FALSE_EXACT.has(compact)) return false;
  if (KO_STATION_ALIASES[compact]) return true;
  if (resolveKoUniversityAlias(compact) || /대학교$/.test(compact)) return true;
  return KO_STAY_POINT_RE.test(s);
}

export function isStreetishStayLabel(raw) {
  const s = String(raw || '').trim();
  if (!s) return false;
  return STREETISH_STAY_LABEL_RE.test(s) || STREETISH_STAY_EN_RE.test(s);
}

export function stayPointDisambiguationPenalty(query, item) {
  const name = String(item?.name || '');
  const nameEn = String(item?.name_en || '');
  let penalty = 0;
  if (isStreetishStayLabel(nameEn) || isStreetishStayLabel(name)) penalty += 80;
  if (/(-dong\b|ga-dong|가동|neighbourhood|neighborhood)/i.test(nameEn)) penalty += 40;
  if (/^(seoul|서울)$/i.test(nameEn.trim())) penalty += 15;
  if (stationNameMatchesQuery(query, name) && penalty < 40) penalty -= 25;
  penalty += universitySearchHitPenalty(query, item);
  const kind = String(item?.kind || '');
  if (kind === 'attraction' || kind === 'poi') penalty -= 8;
  return penalty;
}

export function rankStayPointDisambiguationCandidates(query, candidates) {
  const list = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
  if (resolveKoUniversityAlias(query)) {
    return resolveUniversitySearchHits(query, list);
  }
  if ((!queryLooksLikeStayPoint(query) && !isUniversityStayQuery(query)) || list.length < 2) {
    return list;
  }
  return list
    .map((item, index) => ({
      item,
      index,
      penalty: stayPointDisambiguationPenalty(query, item),
    }))
    .sort((a, b) => a.penalty - b.penalty || a.index - b.index)
    .map((row) => row.item);
}

/** 「종각역, 대한민국」처럼 국가가 붙은 forward도 역·터미널로 본다 */
export function queryLooksLikeStayPoint(query) {
  const s = String(query || '').trim();
  if (!s) return false;
  if (isMrtStayPointLabel(s)) return true;
  const head = s.split(/[,/]/)[0].trim();
  return Boolean(head) && head !== s && isMrtStayPointLabel(head);
}

function isMrtStayPointLocation(location) {
  return (
    isMrtStayPointLabel(location?.originalQuery) ||
    isMrtStayPointLabel(location?.name) ||
    isMrtStayPointLabel(location?.name_ko) ||
    isMrtStayPointLabel(location?.name_en)
  );
}

/**
 * @param {object} location
 * @returns {boolean}
 */
export function isMrtDomesticLocation(location) {
  const country = String(location?.country || '').trim();
  const countryEn = String(location?.country_en || '').trim().toLowerCase();
  if (!country && !countryEn) return false;
  if (country === '한국' || country === '대한민국' || country.includes('한국')) return true;
  return (
    countryEn === 'korea' ||
    countryEn === 'south korea' ||
    countryEn === 'republic of korea' ||
    countryEn.includes('korea')
  );
}

/** MRT subName head는 「한국」— Nominatim「대한민국」을 맞춰 보냄 */
export function normalizeMrtCountryHint(country, isDomestic = false) {
  const c = String(country || '').trim();
  if (isDomestic) return '한국';
  if (c === '대한민국' || c.includes('한국')) return '한국';
  return c;
}

/**
 * Edge countryHints용 — 공백 제거·해외령 접두 제거·영토→주권 별칭.
 * @param {string} countryHint
 * @param {string[]} [extraAlts]
 * @param {{ isDomestic?: boolean }} [opts]
 * @returns {string[]}
 */
export function expandMrtCountryHintAlts(countryHint, extraAlts = [], opts = {}) {
  const isDomestic = Boolean(opts.isDomestic);
  const primary = normalizeMrtCountryHint(countryHint, isDomestic);
  const out = [];
  const seen = new Set();
  const push = (raw) => {
    const k = String(raw || '').trim();
    if (!k || k.length > 80) return;
    // 공백 유무는 별도 힌트로 유지 — MRT head「북마리아나제도」↔ gateo「북마리아나 제도」
    const key = k.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(k);
  };

  push(primary);
  const stripped = primary.replace(OVERSEAS_PREFIX_RE, '').trim();
  if (stripped && stripped !== primary) push(stripped);
  const noSpace = primary.replace(/\s+/g, '');
  if (noSpace && noSpace !== primary) push(noSpace);
  if (stripped) {
    const strippedNoSpace = stripped.replace(/\s+/g, '');
    if (strippedNoSpace && strippedNoSpace !== stripped) push(strippedNoSpace);
  }

  const mapKeys = [primary, stripped, String(countryHint || '').trim()];
  for (const mk of mapKeys) {
    if (!mk) continue;
    for (const alt of MRT_COUNTRY_HINT_ALTS[mk] || []) push(alt);
    for (const alt of MRT_COUNTRY_HINT_ALTS[mk.toLowerCase()] || []) push(alt);
  }

  for (const raw of extraAlts || []) {
    push(raw);
    const s = String(raw || '').trim();
    if (!s) continue;
    const t = s.replace(OVERSEAS_PREFIX_RE, '').trim();
    if (t && t !== s) push(t);
    const ns = s.replace(/\s+/g, '');
    if (ns && ns !== s) push(ns);
    for (const alt of MRT_COUNTRY_HINT_ALTS[s] || []) push(alt);
    for (const alt of MRT_COUNTRY_HINT_ALTS[s.toLowerCase()] || []) push(alt);
  }

  // primary는 countryHint로 따로 보내므로 alts만 반환
  return out.filter((c) => c.toLowerCase() !== primary.toLowerCase()).slice(0, 8);
}

function pushUnique(list, seen, raw) {
  const k = String(raw || '').trim().slice(0, 100);
  if (!k) return;
  const key = k.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push(k);
}

/** 숙박·리조트 uiPlace — MRT 키워드를 브랜드·지역으로 고정 (부산 오탐·신라스테이 혼동 완화) */
function pushLodgingStayKeywords(ladder, seen, location) {
  const blob = [
    location?.originalQuery,
    location?.name,
    location?.name_ko,
    location?.name_en,
  ]
    .map((s) => String(s || ''))
    .join(' ');

  if (/비발디|vivaldi|대명\s*콘도|소노\s*펠리체|sono\s*felice/i.test(blob)) {
    pushUnique(ladder, seen, '비발디파크');
    pushUnique(ladder, seen, '소노펠리체');
    pushUnique(ladder, seen, '홍천');
  }

  if (/신라\s*호텔|호텔\s*신라|the\s*shilla/i.test(blob) && !/신라\s*스테이|shilla\s*stay/i.test(blob)) {
    if (/제주|jeju/i.test(blob)) {
      pushUnique(ladder, seen, '호텔신라 제주');
      pushUnique(ladder, seen, '중문');
    } else if (/서울|seoul/i.test(blob)) {
      pushUnique(ladder, seen, '호텔신라');
      pushUnique(ladder, seen, '장충동');
    } else {
      pushUnique(ladder, seen, '호텔신라');
    }
  }
}

/** 춘천시 → 춘천 등 — MRT CITY 매칭용 */
export function stripKoAdminSuffix(name) {
  const s = String(name || '').trim();
  if (!s || s.length < 3) return '';
  const stripped = s.replace(KO_ADMIN_SUFFIX_RE, '').trim();
  if (!stripped || stripped === s || stripped.length < 2) return '';
  return stripped;
}

/**
 * Edge cityHint용 — 동명 동(퇴계동→안동) 거부.
 * 국내 읍·면·리가 city로 오면 시·군을 앞에 두고, 면명 축약(대화)은 county 있을 때 제외 —
 * cityMatches ANY 매칭이라 「대화」가 고양 대화동 blob에 걸려 평창을 통과시키는 오탐 방지.
 * 해외는 state(Western Division 등)를 넣지 않음 — MRT blob에 없어 탈락 유발.
 * @param {object} admin
 * @param {{ isDomestic?: boolean }} [opts]
 * @returns {string[]}
 */
export function resolveMrtCityHints(admin, opts = {}) {
  const a = admin && typeof admin === 'object' ? admin : {};
  const isDomestic = Boolean(opts.isDomestic);
  const hints = [];
  const seen = new Set();
  const city = a.city;
  const county = a.county;
  const cityIsTownship = isDomestic && isKoTownshipName(city);

  if (cityIsTownship && county) {
    pushUnique(hints, seen, county);
    pushUnique(hints, seen, stripKoAdminSuffix(county));
    pushUnique(hints, seen, city);
    pushUnique(hints, seen, a.cityEn);
  } else {
    pushUnique(hints, seen, city);
    pushUnique(hints, seen, stripKoAdminSuffix(city));
    pushUnique(hints, seen, a.cityEn);
    pushUnique(hints, seen, county);
    pushUnique(hints, seen, stripKoAdminSuffix(county));
  }
  if (isDomestic) {
    pushUnique(hints, seen, a.state);
    pushUnique(hints, seen, stripKoAdminSuffix(a.state));
  }
  return hints.slice(0, 8);
}

/**
 * @param {object} location
 * @returns {{ keyword: string, altKeywords: string[], countryHint: string, countryHintAlts: string[], nameEn: string, cityHints: string[] }}
 */
export function resolveMrtStayQuery(location) {
  const slug = String(location?.slug || '').trim().toLowerCase();
  const override = MRT_STAY_KEYWORD_OVERRIDES[slug];
  const name = String(location?.name || '').trim();
  const nameEn = String(location?.name_en || '').trim();
  const nameKo = String(location?.name_ko || '').trim();
  const isDomestic = isMrtDomesticLocation(location);
  const countryHint = normalizeMrtCountryHint(
    override?.countryHint || location?.country,
    isDomestic,
  );
  const countryEn = String(location?.country_en || '').trim();
  const rawAdmin =
    location?.stayAdmin && typeof location.stayAdmin === 'object'
      ? location.stayAdmin
      : {};
  const uniAlias = universityAliasFromLocation(location);
  /** 오지·외부영토 — 관문 도시(퍼스 등) stayAdmin이 퍼스 숙소로 새지 않게 */
  let admin = override?.ignoreStayAdmin ? {} : { ...rawAdmin };
  if (uniAlias?.city && !override?.ignoreStayAdmin) {
    admin = {
      ...admin,
      city: uniAlias.city,
      cityEn: uniAlias.cityEn || '',
      county: '',
      neighbourhood: '',
      district: uniAlias.district || '',
    };
  }

  const ladder = [];
  const seen = new Set();

  if (override?.keyword) pushUnique(ladder, seen, override.keyword);
  for (const k of override?.altKeywords || []) pushUnique(ladder, seen, k);

  // 숙박 브랜드 키워드 선두 (비발디→홍천, 호텔신라→중문/장충)
  pushLodgingStayKeywords(ladder, seen, location);

  // uiPlace: 검색어(originalQuery)를 선두 — Mapbox name이 시·군만일 때 「홍천 대명 콘도」 숙소 오탐 방지
  // 국내 동·리·읍·면·역·길은 시·군 래더 뒤 — 「대화리」동명 · 「종각역」MRT CITY 미매칭 방지
  const stayPoint = isDomestic && isMrtStayPointLocation(location);
  if (location?.uiPlace) {
    const oq = String(location.originalQuery || '').trim();
    if (!(isDomestic && (isKoFineAdminName(oq) || isMrtStayPointLabel(oq)))) {
      pushUnique(ladder, seen, oq);
    }
  }

  // originalQuery·이름에서 시·군 토큰을 cityHints에 보강 (AI 핀에 stayAdmin 없을 때)
  const cityHintExtras = [];
  const hintBlob = `${location?.originalQuery || ''} ${name} ${nameKo}`;
  for (const m of hintBlob.matchAll(/(홍천|춘천|강릉|속초|제주|중문|서귀포|서울|부산|강원도|평창)/g)) {
    cityHintExtras.push(m[1]);
  }
  if (uniAlias?.city) cityHintExtras.push(uniAlias.city);

  /** hub 명소·정착지 — Nominatim stayAdmin 없이도 상위 도시로 CITY 매칭 (문경새재→문경) */
  const parentCity = String(location?.parentCity || '').trim();

  // 리·읍·면 + OSM town(대화면)이 city인 경우 — 시·군 우선 래더
  const fineGrain =
    isKoFineAdminName(name) ||
    isKoFineAdminName(nameKo) ||
    isKoFineAdminName(admin.neighbourhood) ||
    (isDomestic && isKoTownshipName(admin.city));

  const pushCityLadder = () => {
    const cityIsTownship = isDomestic && isKoTownshipName(admin.city);
    if (cityIsTownship && admin.county) {
      // 평창군 대화면·보은군 이평리 — 군·시 먼저, 면 축약「대화」는 일산 대화동 오탐이라 제외
      pushUnique(ladder, seen, admin.county);
      pushUnique(ladder, seen, stripKoAdminSuffix(admin.county));
      pushUnique(ladder, seen, parentCity);
      pushUnique(ladder, seen, stripKoAdminSuffix(parentCity));
      pushUnique(ladder, seen, admin.city);
      pushUnique(ladder, seen, admin.cityEn);
      return;
    }
    pushUnique(ladder, seen, admin.city);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.city));
    pushUnique(ladder, seen, admin.cityEn);
    pushUnique(ladder, seen, admin.county);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.county));
    pushUnique(ladder, seen, parentCity);
    pushUnique(ladder, seen, stripKoAdminSuffix(parentCity));
  };

  const pushFineLadder = () => {
    pushUnique(ladder, seen, name);
    pushUnique(ladder, seen, nameKo);
    pushUnique(ladder, seen, admin.neighbourhood);
    // 읍·면 축약은 county 있을 때 스킵(대화면→대화→고양)
    const fineBase = admin.neighbourhood || name || nameKo;
    if (!(isDomestic && admin.county && isKoTownshipName(fineBase))) {
      pushUnique(ladder, seen, stripKoAdminSuffix(fineBase));
    }
    pushUnique(ladder, seen, admin.district);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.district));
  };

  // 국내 hub 명소(동·읍·면·리 아님): 상위 도시를 랜드마크보다 앞 — 「문경새재」단독 MRT CITY 미매칭 방지
  // (숙박 브랜드·originalQuery가 이미 선두면 그 다음 alt로만 들어감)
  if (parentCity && isDomestic && !fineGrain) {
    pushUnique(ladder, seen, parentCity);
    pushUnique(ladder, seen, stripKoAdminSuffix(parentCity));
  }

  // 국내 동·리·읍·면·역·길: 시·군 우선 — 「퇴계동」안동 · 「종각역」서울
  // 역·터미널은 생활권(종로) → 축약 시명(서울) — MRT NEIGHBORHOOD「종로」·CITY「서울」
  // 「서울 종각역」단독 CITY는 없음. 해외·비세밀: 세밀 키워드 우선
  if ((fineGrain || stayPoint) && isDomestic) {
    if (stayPoint) {
      pushUnique(ladder, seen, uniAlias?.city);
      pushUnique(ladder, seen, mrtNeighborhoodKeyword(admin, location));
      pushUnique(ladder, seen, stripKoAdminSuffix(admin.city));
      pushUnique(ladder, seen, stripKoAdminSuffix(admin.county));
      pushUnique(ladder, seen, stripKoAdminSuffix(parentCity));
    }
    pushCityLadder();
    pushFineLadder();
  } else if (fineGrain) {
    pushFineLadder();
    pushCityLadder();
  } else {
    pushFineLadder();
    pushUnique(ladder, seen, admin.district);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.district));
    pushCityLadder();
  }

  pushUnique(ladder, seen, nameEn);
  if (isDomestic) {
    pushUnique(ladder, seen, admin.state);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.state));
  }

  const keyword = String(ladder[0] || '').trim();
  const altKeywords = ladder.slice(1, 10);
  const cityHints = resolveMrtCityHints(admin, { isDomestic });
  const citySeen = new Set(cityHints.map((h) => h.toLowerCase()));
  for (const extra of cityHintExtras) {
    pushUnique(cityHints, citySeen, extra);
  }
  pushUnique(cityHints, citySeen, parentCity);
  pushUnique(cityHints, citySeen, stripKoAdminSuffix(parentCity));

  /** MRT subName 한·영·공백·영토 별칭 — Edge countryMatches(compact·세그먼트) */
  const countryHintAlts = expandMrtCountryHintAlts(
    countryHint,
    [countryEn, admin.country, ...(override?.countryHintAlts || [])],
    { isDomestic },
  );

  return { keyword, altKeywords, countryHint, countryHintAlts, nameEn, cityHints };
}

/**
 * 칩·인근 도시 폴백을 1차 키워드와 같이 보냄.
 * 빈 altKeywords 배열로 location 알트를 지우지 않음.
 * cityHints에 폴백 도시명을 넣어 Edge가 인천 CITY를 옹진 힌트로 거부하지 않게 함.
 */
export function mergeMrtStayFetchQuery(location, opts = {}) {
  const query = resolveMrtStayQuery(location);
  const keywordOverride = String(opts.keywordOverride || '').trim();
  const keyword = keywordOverride || query.keyword;
  const extraAlts = Array.isArray(opts.altKeywords)
    ? opts.altKeywords.map((k) => String(k || '').trim()).filter(Boolean)
    : [];
  const altKeywords = [];
  const altSeen = new Set();
  const skip = String(keyword || '').trim().toLowerCase();
  if (skip) altSeen.add(skip);
  for (const raw of [...extraAlts, ...(query.altKeywords || [])]) {
    pushUnique(altKeywords, altSeen, raw);
  }
  const cityHints = [];
  const citySeen = new Set();
  for (const raw of [keyword, ...extraAlts, ...(query.cityHints || [])]) {
    if (isMrtStayPointLabel(raw)) continue;
    pushUnique(cityHints, citySeen, raw);
    pushUnique(cityHints, citySeen, stripKoAdminSuffix(raw));
  }
  return {
    ...query,
    keyword,
    altKeywords: altKeywords.slice(0, 12),
    cityHints: cityHints.slice(0, 8),
  };
}

/** 검색 중심에서 이 거리 밖이고 시·군이 다르면 숙소 배제. 도(강원)는 keep 키가 아님 — 춘천↔양양 */
export const MRT_STAY_GEO_SANITY_MAX_KM = 30;

const KO_SIDO_LEVEL_EXACT = new Set([
  '강원',
  '경기',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '강원도',
  '경기도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '강원특별자치도',
  '전북특별자치도',
  '제주특별자치도',
  '충청북',
  '충청남',
  '전라북',
  '전라남',
  '경상북',
  '경상남',
]);

const KO_GEO_SANITY_CITY_RE =
  /광주|양양|대구|부산|인천|대전|울산|서울|제주|수원|고양|용인|성남|청주|전주|천안|창원|포항|경주|강릉|속초|원주|춘천|평창|정선|홍천|삼척|동해|태백|인제|고성|철원|화천|양구|영월|횡성|여수|순천|목포|군산|익산|김해|진주|구미|안동|세종|울릉|서귀포/;

function isKoSidoLevelName(raw) {
  const s = String(raw || '').trim();
  if (!s) return false;
  if (KO_SIDO_LEVEL_EXACT.has(s)) return true;
  return KO_SIDO_LEVEL_EXACT.has(stripKoAdminSuffix(s) || s);
}

function stayItemCoordPair(item) {
  if (!item || typeof item !== 'object') return null;
  const lat = Number(item.lat ?? item.latitude);
  const lng = Number(item.lng ?? item.longitude ?? item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function stayItemGeoBlob(item) {
  if (!item || typeof item !== 'object') return '';
  return [
    item.itemName,
    item.name,
    item.name_ko,
    item.address,
    item.regionName,
    item.subName,
  ]
    .map((v) => String(v || ''))
    .join(' ');
}

function blobHasAnyToken(blob, tokens) {
  const s = String(blob || '');
  if (!s) return false;
  for (const raw of tokens || []) {
    const t = String(raw || '').trim();
    if (t.length >= 2 && s.includes(t)) return true;
  }
  return false;
}

function blobHasForeignCity(blob, originKeys) {
  const s = String(blob || '');
  if (!s) return false;
  const origin = new Set(
    (originKeys || []).map((k) => String(k || '').trim()).filter((k) => k.length >= 2),
  );
  for (const m of s.matchAll(new RegExp(KO_GEO_SANITY_CITY_RE.source, 'g'))) {
    const city = m[0];
    if (city && !origin.has(city)) return true;
  }
  return false;
}

/**
 * 시·군 keep 키. 도·읍면리는 넣지 않음(강원→양양 유지, 대화→고양 오탐).
 * @param {object} [location]
 * @param {string[]} [extra]
 * @returns {string[]}
 */
export function collectMrtStayGeoSanityKeys(location = {}, extra = []) {
  const admin =
    location?.stayAdmin && typeof location.stayAdmin === 'object' ? location.stayAdmin : {};
  const uni = universityAliasFromLocation(location);
  const station =
    resolveKoStationAlias(location?.originalQuery) ||
    resolveKoStationAlias(location?.name) ||
    resolveKoStationAlias(location?.name_ko);
  const raw = [
    uni?.city,
    station?.district,
    admin.city,
    admin.county,
    admin.district,
    location?.parentCity,
    ...(Array.isArray(extra) ? extra : []),
  ];
  const keys = [];
  const seen = new Set();
  for (const value of raw) {
    const s = String(value || '').trim();
    if (!s || s.length < 2) continue;
    if (isKoTownshipName(s) || isKoFineAdminName(s)) continue;
    const stripped = stripKoAdminSuffix(s) || s;
    if (!stripped || stripped.length < 2) continue;
    if (isKoTownshipName(stripped) || isKoFineAdminName(stripped)) continue;
    if (isKoSidoLevelName(s) || isKoSidoLevelName(stripped)) continue;
    pushUnique(keys, seen, stripped);
  }
  return keys;
}

/**
 * @param {object} item
 * @param {{ lat?: unknown, lng?: unknown } | null | undefined} origin
 * @param {string[]} [originKeys]
 * @returns {boolean}
 */
export function mrtStayPassesGeoSanity(item, origin, originKeys = []) {
  const keys = Array.isArray(originKeys) ? originKeys : [];
  const blob = stayItemGeoBlob(item);
  const originLat = Number(origin?.lat);
  const originLng = Number(origin?.lng);
  const hasOrigin =
    Number.isFinite(originLat) &&
    Number.isFinite(originLng) &&
    !(originLat === 0 && originLng === 0);
  const pt = stayItemCoordPair(item);

  if (hasOrigin && pt) {
    const km = haversineKmSimple(originLat, originLng, pt.lat, pt.lng);
    if (km <= MRT_STAY_GEO_SANITY_MAX_KM) return true;
    if (blobHasAnyToken(blob, keys)) return true;
    return false;
  }

  if (blobHasAnyToken(blob, keys)) return true;
  if (blobHasForeignCity(blob, keys)) return false;
  return true;
}

/**
 * @param {object[] | null | undefined} items
 * @param {{ lat?: unknown, lng?: unknown } | null | undefined} origin
 * @param {{ isDomestic?: boolean, originKeys?: string[] }} [opts]
 */
export function filterMrtStaysByGeoSanity(items, origin, opts = {}) {
  const list = Array.isArray(items) ? items : [];
  if (opts.isDomestic === false) return list;
  const keys = Array.isArray(opts.originKeys) ? opts.originKeys : [];
  const originLat = Number(origin?.lat);
  const originLng = Number(origin?.lng);
  const hasOrigin = Number.isFinite(originLat) && Number.isFinite(originLng);
  if (!hasOrigin && !keys.length) return list;
  return list.filter((item) => mrtStayPassesGeoSanity(item, origin, keys));
}

/**
 * 숙소 토글 노출 — slug SSOT + uiPlace(국가·키워드 있을 때).
 * @param {object} location
 * @param {{ hidden?: boolean }} [opts]
 */
export function canShowMrtStayStrip(location, opts = {}) {
  if (opts.hidden || !location || location.isScanning) return false;
  if (isPlaceholderCountry(location.country) && isPlaceholderCountry(location.country_en)) {
    return false;
  }
  const query = resolveMrtStayQuery(location);
  return Boolean(query.keyword);
}
