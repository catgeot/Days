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
   * 라로통가 — 아바루아·아로랑기 호텔 밀집(MRT 홈과 동일 권역).
   */
  rarotonga: {
    keyword: '아바루아',
    altKeywords: ['Avarua', '아로랑기', 'Arorangi', '라로통가', 'Rarotonga'],
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
  pushUnique(hints, seen, a.city);
  pushUnique(hints, seen, stripKoAdminSuffix(a.city));
  pushUnique(hints, seen, a.cityEn);
  pushUnique(hints, seen, a.county);
  pushUnique(hints, seen, stripKoAdminSuffix(a.county));
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
  /** 오지·외부영토 — 관문 도시(퍼스 등) stayAdmin이 퍼스 숙소로 새지 않게 */
  const admin = override?.ignoreStayAdmin ? {} : rawAdmin;

  const ladder = [];
  const seen = new Set();

  if (override?.keyword) pushUnique(ladder, seen, override.keyword);
  for (const k of override?.altKeywords || []) pushUnique(ladder, seen, k);

  // 숙박 브랜드 키워드 선두 (비발디→홍천, 호텔신라→중문/장충)
  pushLodgingStayKeywords(ladder, seen, location);

  // uiPlace: 검색어(originalQuery)를 선두 — Mapbox name이 시·군만일 때 「홍천 대명 콘도」 숙소 오탐 방지
  if (location?.uiPlace) {
    pushUnique(ladder, seen, String(location.originalQuery || '').trim());
  }

  // originalQuery·이름에서 시·군 토큰을 cityHints에 보강 (AI 핀에 stayAdmin 없을 때)
  const cityHintExtras = [];
  const hintBlob = `${location?.originalQuery || ''} ${name} ${nameKo}`;
  for (const m of hintBlob.matchAll(/(홍천|춘천|강릉|속초|제주|중문|서귀포|서울|부산|강원)/g)) {
    cityHintExtras.push(m[1]);
  }

  const fineGrain = /[동읍면]$/.test(name) || /[동읍면]$/.test(admin.neighbourhood || '');

  const pushCityLadder = () => {
    pushUnique(ladder, seen, admin.city);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.city));
    pushUnique(ladder, seen, admin.cityEn);
    pushUnique(ladder, seen, admin.county);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.county));
  };

  const pushFineLadder = () => {
    pushUnique(ladder, seen, name);
    pushUnique(ladder, seen, nameKo);
    pushUnique(ladder, seen, admin.neighbourhood);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.neighbourhood || name));
    pushUnique(ladder, seen, admin.district);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.district));
  };

  // 국내 동·읍·면: 시·군 우선 — 「퇴계동」이 안동에 먼저 매칭되던 오탐 방지
  // 해외·비세밀: 세밀 키워드 우선
  if (fineGrain && isDomestic) {
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

  /** MRT subName 한·영·공백·영토 별칭 — Edge countryMatches(compact·세그먼트) */
  const countryHintAlts = expandMrtCountryHintAlts(
    countryHint,
    [countryEn, admin.country, ...(override?.countryHintAlts || [])],
    { isDomestic },
  );

  return { keyword, altKeywords, countryHint, countryHintAlts, nameEn, cityHints };
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
