/**
 * 국내 여행지 매칭 통합 SSOT 사전 — koreaPlaceMatchDictionary
 *
 * 분산되어 있던 지명 하드코딩 오버라이드·별칭을 단일 파일로 일원화:
 * 1. KOREA_HOMONYM_GROUPS: 전국 동음 지명 다후보 그룹 (종각, 광천, 송암, 강원대 등)
 * 2. KO_STATION_ALIASES: 역명 약칭 (종각 → 종각역)
 * 3. KO_UNIVERSITY_ALIASES: 대학교 본교 좌표/캠퍼스 (강원대 → 춘천캠퍼스)
 * 4. KO_UNIVERSITY_SATELLITE_ALIASES: 캠퍼스/수련원 위성 시설 (강원대 동해수련원 → 양양)
 * 5. KO_EXPLORE_SEARCH_ALIASES: 탐색창 한국 지명/자연명소 별칭 (광천성굴/광천동굴 → 광천선굴)
 * 6. KO_GALLERY_QUERY_OVERRIDES: 한국 장소 갤러리 검색어 오버라이드 (공지천 등)
 * 7. KO_MRT_STAY_KEYWORD_OVERRIDES: 한국 장소 MRT 숙소 검색어 오버라이드
 */

export function normalizePlaceMatchKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export const compactKoPlaceKey = normalizePlaceMatchKey;

export const UNI_CAMPUS_QUALIFIER_RE = /삼척|도계|강릉|수련원|연수원|학술림|연습림|부속병원/;

/**
 * 1. 전국 동음 지명 다후보 사전 (동음이의어 분기용)
 */
export const KOREA_HOMONYM_GROUPS = [
  {
    keys: ['종각'],
    candidates: [
      {
        name: '종각역',
        name_en: 'Jonggak Station',
        region: '서울 종로',
        kind: 'station',
        badge: '역',
        lat: 37.5701,
        lng: 126.9829,
        stayAdmin: {
          neighbourhood: '',
          district: '종로',
          city: '서울',
          cityEn: 'Seoul',
          county: '',
          state: '서울특별시',
        },
        placeCategory: 'STATION',
      },
      {
        name: '종각네거리',
        name_en: 'Jonggak Intersection',
        region: '대구 중구',
        kind: 'landmark',
        badge: '장소',
        lat: 35.8664,
        lng: 128.5936,
        stayAdmin: {
          neighbourhood: '',
          district: '중구',
          city: '대구',
          cityEn: 'Daegu',
          county: '',
          state: '대구광역시',
        },
        placeCategory: 'LANDMARK',
      },
    ],
  },
  {
    keys: ['광천'],
    candidates: [
      {
        name: '광천선굴',
        name_en: 'Gwangcheon Seongul',
        region: '평창군',
        kind: 'attraction',
        badge: '명소',
        lat: 37.518306,
        lng: 128.451361,
        contentId: '2987914',
        hubId: 'pyeongchang',
        stayAdmin: {
          neighbourhood: '',
          district: '',
          city: '평창',
          cityEn: 'Pyeongchang',
          county: '평창군',
          state: '강원특별자치도',
        },
        placeCategory: 'NATURE_SCENIC',
      },
      {
        name: '광천동',
        name_en: 'Gwangcheon-dong',
        region: '광주 서구',
        kind: 'city',
        badge: '동네',
        lat: 35.1597,
        lng: 126.8805,
        stayAdmin: {
          neighbourhood: '광천동',
          district: '서구',
          city: '광주',
          cityEn: 'Gwangju',
          county: '',
          state: '광주광역시',
        },
        placeCategory: 'LANDMARK',
      },
      {
        name: '광천읍',
        name_en: 'Gwangcheon-eup',
        region: '홍성군',
        kind: 'city',
        badge: '동네',
        lat: 36.5,
        lng: 126.628,
        stayAdmin: {
          neighbourhood: '광천읍',
          district: '',
          city: '홍성',
          cityEn: 'Hongseong',
          county: '홍성군',
          state: '충청남도',
        },
        placeCategory: 'LANDMARK',
      },
    ],
  },
  {
    keys: ['송암'],
    candidates: [
      {
        name: '송암스페이스센터',
        name_en: 'Songam Space Center',
        region: '고양',
        kind: 'attraction',
        badge: '명소',
        lat: 37.73355330700013,
        lng: 126.94482605606281,
        contentId: '250376',
        hubId: 'goyang',
        stayAdmin: {
          neighbourhood: '',
          district: '덕양',
          city: '고양',
          cityEn: 'Goyang',
          county: '',
          state: '경기도',
        },
        placeCategory: 'LANDMARK',
      },
      {
        name: '송암스포츠타운',
        name_en: 'Songam Sports Town',
        region: '춘천시',
        kind: 'landmark',
        badge: '장소',
        lat: 37.85578,
        lng: 127.68863,
        hubId: 'chuncheon',
        stayAdmin: {
          neighbourhood: '송암동',
          district: '',
          city: '춘천',
          cityEn: 'Chuncheon',
          county: '',
          state: '강원특별자치도',
        },
        placeCategory: 'LANDMARK',
      },
      {
        name: '송암동',
        name_en: 'Songam-dong',
        region: '광주 남구',
        kind: 'city',
        badge: '동네',
        lat: 35.1113321,
        lng: 126.8768177,
        stayAdmin: {
          neighbourhood: '송암동',
          district: '남구',
          city: '광주',
          cityEn: 'Gwangju',
          county: '',
          state: '광주광역시',
        },
        placeCategory: 'LANDMARK',
      },
    ],
  },
  {
    keys: ['강원대', '강원대학교', 'kangwonnationaluniversity'],
    candidates: [
      {
        name: '강원대학교 춘천캠퍼스',
        name_en: 'Kangwon National University Chuncheon',
        region: '춘천시',
        kind: 'university',
        badge: '대학',
        lat: 37.8695,
        lng: 127.744,
        stayAdmin: {
          neighbourhood: '',
          district: '',
          city: '춘천',
          cityEn: 'Chuncheon',
          county: '',
          state: '강원특별자치도',
        },
        placeCategory: 'UNIVERSITY',
      },
      {
        name: '강원대학교 삼척캠퍼스',
        name_en: 'Kangwon National University Samcheok',
        region: '삼척시',
        kind: 'university',
        badge: '대학',
        lat: 37.44944,
        lng: 129.16556,
        stayAdmin: {
          neighbourhood: '',
          district: '',
          city: '삼척',
          cityEn: 'Samcheok',
          county: '',
          state: '강원특별자치도',
        },
        placeCategory: 'UNIVERSITY',
      },
    ],
  },
  {
    keys: ['봉화산'],
    candidates: [
      {
        name: '중랑 봉화산',
        name_en: 'Jungnang Bonghwasan',
        region: '서울 중랑',
        kind: 'attraction',
        badge: '명소',
        lat: 37.6065,
        lng: 127.0915,
        hubId: 'jungnang',
        stayAdmin: {
          neighbourhood: '',
          district: '중랑',
          city: '서울',
          cityEn: 'Seoul',
          county: '',
          state: '서울특별시',
        },
        placeCategory: 'NATURE_SCENIC',
      },
      {
        name: '양구 봉화산',
        name_en: 'Yanggu Bonghwasan',
        region: '양구군',
        kind: 'attraction',
        badge: '명소',
        lat: 38.0850703267101,
        lng: 127.997401498552,
        hubId: 'yanggu',
        stayAdmin: {
          neighbourhood: '',
          district: '',
          city: '양구',
          cityEn: 'Yanggu',
          county: '양구군',
          state: '강원특별자치도',
        },
        placeCategory: 'NATURE_SCENIC',
      },
    ],
  },
  {
    keys: ['용산'],
    candidates: [
      {
        name: '용산역',
        name_en: 'Yongsan Station',
        region: '서울 용산',
        kind: 'station',
        badge: '역',
        lat: 37.52985,
        lng: 126.96478,
        stayAdmin: {
          neighbourhood: '',
          district: '용산',
          city: '서울',
          cityEn: 'Seoul',
          county: '',
          state: '서울특별시',
        },
        placeCategory: 'STATION',
      },
      {
        name: '용산호',
        name_en: 'Yongsan Lake',
        region: '정읍시',
        kind: 'attraction',
        badge: '명소',
        lat: 35.5312,
        lng: 126.888,
        hubId: 'jeongeup',
        stayAdmin: {
          neighbourhood: '신정동',
          district: '',
          city: '정읍',
          cityEn: 'Jeongeup',
          county: '',
          state: '전북특별자치도',
        },
        placeCategory: 'NATURE_SCENIC',
      },
    ],
  },
  {
    keys: ['대포'],
    candidates: [
      {
        name: '대포항',
        name_en: 'Daepo Port',
        region: '속초시',
        kind: 'attraction',
        badge: '명소',
        lat: 38.1748,
        lng: 128.6065,
        hubId: 'sokcho',
        stayAdmin: {
          neighbourhood: '',
          district: '',
          city: '속초',
          cityEn: 'Sokcho',
          county: '',
          state: '강원특별자치도',
        },
        placeCategory: 'NATURE_SCENIC',
      },
      {
        name: '대포동',
        name_en: 'Daepo-dong',
        region: '서귀포시',
        kind: 'city',
        badge: '동네',
        lat: 33.241,
        lng: 126.412,
        stayAdmin: {
          neighbourhood: '대포동',
          district: '',
          city: '서귀포',
          cityEn: 'Seogwipo',
          county: '',
          state: '제주특별자치도',
        },
        placeCategory: 'LANDMARK',
      },
    ],
  },
  {
    keys: ['대화'],
    candidates: [
      {
        name: '대화역',
        name_en: 'Daehwa Station',
        region: '고양시',
        kind: 'station',
        badge: '역',
        lat: 37.676087,
        lng: 126.747544,
        stayAdmin: {
          neighbourhood: '',
          district: '일산',
          city: '고양',
          cityEn: 'Goyang',
          county: '',
          state: '경기도',
        },
        placeCategory: 'STATION',
      },
      {
        name: '대화면',
        name_en: 'Daehwa-myeon',
        region: '평창군',
        kind: 'city',
        badge: '동네',
        lat: 37.502,
        lng: 128.461,
        stayAdmin: {
          neighbourhood: '대화면',
          district: '',
          city: '평창',
          cityEn: 'Pyeongchang',
          county: '평창군',
          state: '강원특별자치도',
        },
        placeCategory: 'LANDMARK',
      },
      {
        name: '대화동',
        name_en: 'Daehwa-dong',
        region: '대전광역시',
        kind: 'city',
        badge: '동네',
        lat: 36.359,
        lng: 127.415,
        stayAdmin: {
          neighbourhood: '대화동',
          district: '대덕구',
          city: '대전',
          cityEn: 'Daejeon',
          county: '',
          state: '대전광역시',
        },
        placeCategory: 'LANDMARK',
      },
    ],
  },
];

/**
 * 2. 국내 주요 역명 약칭 사전
 * 「종각」단독이 대구 종각네거리 등으로 스냅하지 않도록 종각역·종로 매핑.
 */
export const KO_STATION_ALIASES = {
  종각: {
    station: '종각역',
    district: '종로',
    lat: 37.5701,
    lng: 126.9829,
  },
};

/**
 * 3. 대학교 본교 캠퍼스 별칭 사전
 * Mapbox가 수련원·연수원을 대학 본명으로 주어 타 지역으로 튀는 것을 방지.
 */
export const KO_UNIVERSITY_ALIASES = {
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

/**
 * 4. 대학교 위성 캠퍼스 및 수련원 별칭 사전
 */
export const KO_UNIVERSITY_SATELLITE_ALIASES = {
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

/**
 * 5. 탐색창 국내 지명·자연명소 검색어 별칭
 */
export const KO_EXPLORE_SEARCH_ALIASES = [
  [
    '광천성굴',
    {
      canonical: '광천선굴',
      romanized: 'Gwangcheon Seongul, Pyeongchang',
      also: ['평창 광천선굴'],
    },
  ],
  [
    '광천동굴',
    {
      canonical: '광천선굴',
      romanized: 'Gwangcheon Seongul, Pyeongchang',
      also: ['평창 광천선굴'],
    },
  ],
  [
    '광천선굴',
    {
      canonical: '광천선굴',
      romanized: 'Gwangcheon Seongul, Pyeongchang',
      also: ['평창 광천선굴'],
    },
  ],
  [
    'gwangcheon cave',
    {
      canonical: '광천선굴',
      romanized: 'Gwangcheon Seongul, Pyeongchang',
      also: ['평창 광천선굴'],
    },
  ],
];

/**
 * 6. 국내 장소 갤러리 검색어 오버라이드
 */
export const KO_GALLERY_QUERY_OVERRIDES = {
  /** TourAPI searchPhoto가 404·오매칭(춘천 벚꽃)만 줌 → Unsplash 쿼리 보강 */
  gongjicheon: {
    primary: 'Gongjicheon Chuncheon',
    backup: 'Chuncheon cherry blossom riverside park Korea',
  },
};

/**
 * 7. 국내 장소 MRT 숙소 검색어 오버라이드
 */
export const KO_MRT_STAY_KEYWORD_OVERRIDES = {};

/* ============================================================
 * Helper Resolution Functions
 * ============================================================ */

const KO_EXPLORE_SEARCH_ALIAS_MAP = new Map(
  KO_EXPLORE_SEARCH_ALIASES.map(([k, v]) => [normalizePlaceMatchKey(k), v]),
);

/**
 * @param {string} raw
 * @returns {{ station: string, district: string, lat: number, lng: number } | null}
 */
export function resolveKoStationAlias(raw) {
  const s = normalizePlaceMatchKey(raw).split(/[,/]/)[0];
  if (!s || s.length < 2) return null;
  if (KO_STATION_ALIASES[s]) return KO_STATION_ALIASES[s];
  const stripped = s.replace(/역$/, '');
  if (stripped !== s && KO_STATION_ALIASES[stripped]) return KO_STATION_ALIASES[stripped];
  return null;
}

/**
 * @param {string} raw
 * @returns {{ campus: string, nameEn: string, city: string, lat: number, lng: number } | null}
 */
export function resolveKoUniversityAlias(raw) {
  const s = normalizePlaceMatchKey(raw).split(/[,/]/)[0];
  if (!s || s.length < 2) return null;
  if (UNI_CAMPUS_QUALIFIER_RE.test(s)) return null;
  if (KO_UNIVERSITY_ALIASES[s]) return KO_UNIVERSITY_ALIASES[s];
  const lower = s.toLowerCase();
  if (KO_UNIVERSITY_ALIASES[lower]) return KO_UNIVERSITY_ALIASES[lower];
  return null;
}

/**
 * @param {string} raw
 * @returns {{ name: string, nameEn: string, city: string, lat: number, lng: number } | null}
 */
export function resolveKoUniversitySatelliteAlias(raw) {
  const s = normalizePlaceMatchKey(raw).split(/[,/]/)[0];
  if (!s || s.length < 4) return null;
  if (KO_UNIVERSITY_SATELLITE_ALIASES[s]) return KO_UNIVERSITY_SATELLITE_ALIASES[s];
  for (const [key, alias] of Object.entries(KO_UNIVERSITY_SATELLITE_ALIASES)) {
    if (s.includes(key)) return alias;
  }
  return null;
}

/**
 * @param {string} raw
 * @returns {boolean}
 */
export function isUniversitySatelliteStayQuery(raw) {
  return Boolean(resolveKoUniversitySatelliteAlias(raw));
}

/**
 * @param {string} query
 * @returns {{ canonical: string, romanized?: string, also?: string[] } | null}
 */
export function resolveKoExploreSearchAlias(query) {
  const k = normalizePlaceMatchKey(query);
  if (!k) return null;
  return KO_EXPLORE_SEARCH_ALIAS_MAP.get(k) || null;
}

/**
 * @param {string} slug
 * @returns {{ primary: string, backup: string } | null}
 */
export function resolveKoGalleryQueryOverride(slug) {
  const k = String(slug || '').trim().toLowerCase();
  if (!k) return null;
  return KO_GALLERY_QUERY_OVERRIDES[k] || null;
}

/**
 * 단일 질의 통합 매칭 리졸버
 * @param {string} query
 * @returns {{ type: string, query: string, standardName?: string, coords?: { lat: number, lng: number }, mrtRegionHint?: Record<string, string>, category?: string, [key: string]: any } | null}
 */
export function resolveKoreaPlaceMatch(query) {
  const q = normalizePlaceMatchKey(query);
  if (!q) return null;

  const station = resolveKoStationAlias(q);
  if (station) {
    return {
      type: 'station',
      query: q,
      standardName: station.station,
      coords: { lat: station.lat, lng: station.lng },
      mrtRegionHint: { district: station.district, city: '서울' },
      category: 'STATION',
      raw: station,
    };
  }

  const satellite = resolveKoUniversitySatelliteAlias(q);
  if (satellite) {
    return {
      type: 'university_satellite',
      query: q,
      standardName: satellite.name,
      coords: { lat: satellite.lat, lng: satellite.lng },
      mrtRegionHint: { city: satellite.city },
      category: 'UNIVERSITY',
      raw: satellite,
    };
  }

  const university = resolveKoUniversityAlias(q);
  if (university) {
    return {
      type: 'university',
      query: q,
      standardName: university.campus,
      coords: { lat: university.lat, lng: university.lng },
      mrtRegionHint: { city: university.city },
      category: 'UNIVERSITY',
      raw: university,
    };
  }

  const searchAlias = resolveKoExploreSearchAlias(q);
  if (searchAlias) {
    return {
      type: 'search_alias',
      query: q,
      standardName: searchAlias.canonical,
      canonical: searchAlias.canonical,
      romanized: searchAlias.romanized,
      also: searchAlias.also,
      raw: searchAlias,
    };
  }

  for (const group of KOREA_HOMONYM_GROUPS) {
    if ((group.keys || []).map(normalizePlaceMatchKey).includes(q)) {
      return {
        type: 'homonym_group',
        query: q,
        keys: group.keys,
        candidates: group.candidates,
        raw: group,
      };
    }
  }

  return null;
}

/**
 * @param {string} query
 * @returns {boolean}
 */
export function isKoreaPlaceMatchQuery(query) {
  return Boolean(resolveKoreaPlaceMatch(query));
}
