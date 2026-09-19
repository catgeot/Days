/**
 * MRT 숙소 쿼리 스모크 — resolveMrtStayQuery (순수) + (옵션) 배포된 Edge 호출.
 *
 *   node scripts/smoke-mrt-stay-queries.mjs
 *   MRT_STAY_SMOKE_LIVE=1 node scripts/smoke-mrt-stay-queries.mjs
 */
import {
  canShowMrtStayStrip,
  collectMrtStayGeoSanityKeys,
  expandMrtCountryHintAlts,
  filterMrtStaysByGeoSanity,
  MRT_STAY_GEO_SANITY_MAX_KM,
  isMrtStayPointLabel,
  isStreetishStayLabel,
  mergeMrtStayFetchQuery,
  mrtNeighborhoodKeyword,
  nominatimSquarePenalty,
  nominatimStationScoreDelta,
  queryLooksLikeStayPoint,
  rankStayPointDisambiguationCandidates,
  resolveKoStationAlias,
  resolveKoStationAliasForLocation,
  resolveKoUniversityAlias,
  resolveKoUniversitySatelliteAlias,
  isUniversitySatelliteStayQuery,
  syntheticUniversitySatellitePlace,
  resolveMrtStayQuery,
  stationNameMatchesQuery,
  universitySearchHitPenalty,
  rankUniversitySearchHits,
  resolveUniversitySearchHits,
  isUniversityStayQuery,
  applyUniversityCampusPlace,
  universityPlaceNeedsCampusSnap,
} from '../src/utils/mrtStayQuery.js';
import {
  attachMrtStayDistances,
  buildNaverNearbyStayMapUrl,
  formatStayDistanceFromPlace,
  formatStayDistanceLabel,
  haversineKm,
  isLodgingOsmValue,
  parseStayCoordPair,
  resolveMrtStayOrigin,
  simplifyStayGeocodeQuery,
  stayDistanceRank,
  stayGeocodeQueries,
  stayNameCompatible,
} from '../src/utils/mrtStayDistance.js';
import {
  MRT_STAY_COORD_CACHE_KEY,
  MRT_STAY_COORD_MISS_TTL_MS,
  MRT_STAY_LISTING_CACHE_PREFIX,
  hydrateMrtStayCoords,
  isCurrentMrtStayFetch,
  itemsNeedingStayGeocode,
  mergeMrtStayCoords,
  mrtStayListingCacheKey,
  orderStayItemsForGeocode,
  persistMrtStayCoords,
  readMrtStayListingCache,
  writeMrtStayListingCache,
} from '../src/utils/mrtStayCache.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CASES = [
  {
    slug: 'hawaii',
    location: { slug: 'hawaii', name: '하와이', name_en: 'Hawaii', country: '하와이', country_en: 'Hawaii' },
    expectKeyword: /하와이|호놀룰루/,
    expectCountryAlt: /미국|USA/i,
  },
  {
    slug: 'honolulu',
    location: { slug: 'honolulu', name: '호놀룰루', name_en: 'Honolulu', country: '하와이', country_en: 'Hawaii' },
    expectKeyword: /호놀룰루/,
    expectCountryAlt: /미국|USA/i,
  },
  {
    slug: 'guam',
    location: { slug: 'guam', name: '괌', name_en: 'Guam', country: '괌', country_en: 'Guam' },
    expectKeyword: /투몬/,
  },
  {
    slug: 'bali',
    location: { slug: 'bali', name: '발리', name_en: 'Bali', country: '인도네시아', country_en: 'Indonesia' },
    expectKeyword: /덴파사르/,
  },
  {
    slug: 'saipan',
    location: {
      slug: 'saipan',
      name: '사이판',
      name_en: 'Saipan',
      country: '북마리아나 제도',
      country_en: 'Northern Mariana Islands',
    },
    expectCountryAlt: /북마리아나제도/,
  },
  {
    slug: 'la-reunion',
    location: {
      slug: 'la-reunion',
      name: '레위니옹',
      name_en: 'La Reunion',
      country: '프랑스령 레위니옹',
      country_en: 'La Reunion',
    },
    expectCountryAlt: /레위니옹|Reunion/i,
  },
  {
    slug: 'patagonia',
    location: {
      slug: 'patagonia',
      name: '파타고니아',
      name_en: 'Patagonia (Northern)',
      country: '아르헨티나',
      country_en: 'Argentina',
    },
    expectKeyword: /바릴로체|Bariloche/,
  },
  {
    slug: 'uyuni-salt-flat',
    location: {
      slug: 'uyuni-salt-flat',
      name: '우유니 소금사막',
      name_en: 'Uyuni Salt Flat',
      country: '볼리비아',
      country_en: 'Bolivia',
    },
    expectKeyword: /우유니|Uyuni/,
  },
  {
    slug: 'raja-ampat',
    location: {
      slug: 'raja-ampat',
      name: '라자 암팟',
      name_en: 'Raja Ampat',
      country: '인도네시아',
      country_en: 'Indonesia',
    },
    expectKeyword: /와이사이|Waisai|소롱/,
  },
  {
    slug: 'bermuda',
    location: {
      slug: 'bermuda',
      name: '버뮤다',
      name_en: 'Bermuda',
      country: '버뮤다',
      country_en: 'Bermuda',
    },
    expectKeyword: /패짓|Paget/,
  },
  {
    slug: 'venezuela',
    location: {
      slug: 'venezuela',
      name: '베네수엘라',
      name_en: 'Venezuela',
      country: '베네수엘라',
      country_en: 'Venezuela',
    },
    expectKeyword: /베네수엘라|Venezuela/,
  },
  {
    slug: 'hong-kong',
    location: {
      slug: 'hong-kong',
      name: '홍콩',
      name_en: 'Hong Kong',
      country: '중국',
      country_en: 'China',
    },
    expectKeyword: /홍콩|Hong Kong/,
    expectCountryAlt: /홍콩/,
  },
  {
    slug: 'macau',
    location: {
      slug: 'macau',
      name: '마카오',
      name_en: 'Macau',
      country: '중국',
      country_en: 'China',
    },
    expectKeyword: /Macau|마카오/,
  },
  {
    slug: 'bodrum',
    location: {
      slug: 'bodrum',
      name: '보드룸',
      name_en: 'Bodrum',
      country: '터키',
      country_en: 'Turkey',
    },
    expectCountryAlt: /튀르키예/,
  },
  {
    slug: 'iceland',
    location: {
      slug: 'iceland',
      name: '아이슬란드',
      name_en: 'Iceland',
      country: '아이슬란드',
      country_en: 'Iceland',
    },
    expectKeyword: /레이캬비크|Reykjavik/,
  },
  {
    slug: 'rarotonga',
    location: {
      slug: 'rarotonga',
      name: '라로통가',
      name_en: 'Rarotonga',
      country: '쿡 제도',
      country_en: 'Cook Islands',
    },
    expectKeyword: /아바루아|Avarua|아로랑기|Arorangi/,
  },
  {
    slug: 'mungyeong',
    location: {
      slug: 'mungyeong',
      name: '문경',
      name_en: 'Mungyeong',
      country: '대한민국',
      country_en: 'South Korea',
      hubId: 'mungyeong',
      uiPlace: true,
    },
    expectKeyword: /문경/,
  },
  {
    slug: 'mungyeong-saejae',
    location: {
      slug: 'mungyeong-saejae',
      name: '문경새재',
      name_en: 'Mungyeong Saejae',
      country: '대한민국',
      country_en: 'South Korea',
      hubId: 'mungyeong',
      parentCity: '문경',
      uiPlace: true,
    },
    expectKeyword: /문경/,
  },
  /**
   * 자연명소 광천선굴 — 명소명을 1차로 두면 MRT가 광주 광천동 호텔로 승격.
   * placeCategory NATURE_SCENIC → 시·군(평창) 선두, 광주·광천 제외.
   */
  {
    slug: 'gwangcheon-seongul-nature',
    location: {
      name: '광천선굴',
      name_ko: '광천선굴',
      name_en: 'Gwangcheon Seongul',
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '광천선굴',
      hubId: 'pyeongchang',
      parentCity: '평창',
      placeCategory: 'NATURE_SCENIC',
      tourCategory: 'NATURE_SCENIC',
      contentId: '2987914',
      stayAdmin: {
        city: '평창',
        cityEn: 'Pyeongchang',
        county: '평창',
        state: '',
      },
    },
    expectPrimaryKeyword: /평창/,
    expectKeyword: /평창/,
    rejectPrimaryKeyword: /광천|광주|Gwangcheon/,
    rejectCityHint: /광천선굴|광주|Gwangcheon/i,
  },
  {
    slug: 'woljeongsa-history',
    location: {
      name: '월정사',
      name_ko: '월정사',
      name_en: 'Woljeongsa',
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '월정사',
      hubId: 'pyeongchang',
      parentCity: '평창',
      placeCategory: 'HISTORY',
      stayAdmin: { city: '평창', cityEn: 'Pyeongchang', county: '평창' },
    },
    expectPrimaryKeyword: /평창/,
    rejectPrimaryKeyword: /월정사|광주|대구/,
  },
  /**
   * GPS 평창군 대화면 대화리 — 「대화」축약이 고양/일산 대화동으로 새면 안 됨.
   * 1차 키워드·cityHints는 시·군(평창) 우선.
   */
  {
    slug: 'pyeongchang-daehwa-ri',
    location: {
      name: '대화리',
      name_ko: '대화리',
      name_en: 'Daehwa-ri',
      country: '한국',
      country_en: 'South Korea',
      uiPlace: true,
      stayAdmin: {
        neighbourhood: '',
        district: '',
        city: '대화면',
        cityEn: 'Daehwa-myeon',
        county: '평창군',
        state: '강원특별자치도',
      },
    },
    expectPrimaryKeyword: /평창/,
    expectKeyword: /평창/,
    rejectCityHint: /^(대화)$/,
    rejectPrimaryKeyword: /대화/,
  },
  {
    slug: 'pyeongchang-daehwa-ri-en-name',
    location: {
      name: 'Daehwa-ri',
      name_ko: '대화리',
      name_en: 'Daehwa-ri',
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: true,
      stayAdmin: {
        city: '대화면',
        county: '평창군',
        state: '강원특별자치도',
      },
    },
    expectPrimaryKeyword: /평창/,
    rejectCityHint: /^(대화)$/,
  },
  /**
   * OSM village→city(이평리)+county(보은군) — plan §5.1 잔여.
   * 1차 키워드가 리면 MRT CITY 미매칭·동명 리스크 → 군 선두.
   */
  {
    slug: 'boeun-ipyeong-ri-city',
    location: {
      name: '보은읍',
      name_ko: '보은읍',
      name_en: 'Boeun-eup',
      country: '한국',
      country_en: 'South Korea',
      parentCity: '보은',
      uiPlace: true,
      stayAdmin: {
        city: '이평리',
        cityEn: 'Ipyeong-ri',
        county: '보은군',
        state: '충청북도',
      },
    },
    expectPrimaryKeyword: /보은/,
    expectKeyword: /보은/,
    rejectPrimaryKeyword: /이평리|^이평$/,
  },
  {
    slug: 'boseong-beolgyo-ri-city',
    location: {
      name: '벌교읍',
      name_ko: '벌교읍',
      country: '한국',
      country_en: 'South Korea',
      parentCity: '보성',
      uiPlace: true,
      stayAdmin: {
        city: '벌교리',
        county: '보성군',
        state: '전라남도',
      },
    },
    expectPrimaryKeyword: /보성/,
    rejectPrimaryKeyword: /벌교리/,
  },
  /**
   * 검색「대화리」진입 — originalQuery가 군보다 선두면 MRT가 동명(천안 등)으로 샐 수 있음.
   * stayAdmin이 평창이면 1차는 평창.
   */
  {
    slug: 'search-daehwa-ri-original-query',
    location: {
      name: '대화리',
      name_ko: '대화리',
      country: '한국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '대화리',
      stayAdmin: {
        city: '대화면',
        county: '평창군',
        state: '강원특별자치도',
      },
    },
    expectPrimaryKeyword: /평창/,
    rejectPrimaryKeyword: /대화리|^대화$/,
  },
  /**
   * 검색「강원대학교」— Mapbox가 양양 동해수련원(금강리)을 잡아도 1차는 춘천 본교.
   * 「강원대학교」에서 강원 토큰만 떼면 강원도 해안 호텔로 샌다.
   */
  {
    slug: 'kangwon-national-university-chuncheon',
    location: {
      name: '강원대학교',
      name_ko: '강원대학교',
      name_en: 'Geumgang-ri',
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '강원대학교',
      lat: 38.0866,
      lng: 128.6486,
      stayAdmin: {
        neighbourhood: '금강리',
        city: '양양군',
        state: '강원특별자치도',
      },
    },
    expectPrimaryKeyword: /춘천/,
    expectKeyword: /춘천/,
    rejectPrimaryKeyword: /양양|금강|Geumgang|강원대학교/,
    rejectCityHint: /양양|금강|Geumgang/,
  },
  /**
   * 지구본 검색「종각역」— 1차 종로 NEIGHBORHOOD, 서울 CITY는 래더 뒤.
   * 역명을 1차로 두면 MRT CITY 미매칭·빈 목록.
   */
  {
    slug: 'jonggak-station',
    location: {
      name: '종각역',
      name_ko: '종각역',
      name_en: 'Jonggak-gil',
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '종각역',
      stayAdmin: {
        neighbourhood: '종로1가',
        city: '서울',
        state: '서울특별시',
      },
    },
    expectPrimaryKeyword: /^종로$/,
    expectKeyword: /서울/,
    rejectPrimaryKeyword: /종각역|Jonggak|서울특별시|^서울$/,
    rejectCityHint: /종각역|Jonggak/i,
  },
  {
    slug: 'jonggak-station-seoul-si',
    location: {
      name: '종각역',
      name_ko: '종각역',
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '종각역',
      stayAdmin: {
        neighbourhood: '종로1가',
        city: '서울특별시',
        state: '서울특별시',
      },
    },
    expectPrimaryKeyword: /^종로$/,
    expectKeyword: /서울/,
    rejectPrimaryKeyword: /종각역|서울특별시|^서울$/,
    rejectCityHint: /종각역/,
  },
  {
    slug: 'jonggak-abbrev-jongno',
    location: {
      name: '종각',
      name_ko: '종각',
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '종각',
      stayAdmin: {
        neighbourhood: '종로1가',
        city: '서울',
        district: '종로구',
        state: '서울특별시',
      },
    },
    expectPrimaryKeyword: /^종로$/,
    expectKeyword: /서울/,
    rejectPrimaryKeyword: /종각역|^서울$|대구/,
  },
  {
    slug: 'seoul-station',
    location: {
      name: '서울역',
      name_en: 'Seoul Station',
      country: '한국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '서울역',
      stayAdmin: {
        city: '서울',
        state: '서울특별시',
      },
    },
    expectPrimaryKeyword: /^서울$/,
    rejectPrimaryKeyword: /서울역|Station/i,
  },
  {
    slug: 'yeonsinnae-eunpyeong',
    location: {
      name: '연신내역',
      name_ko: '연신내역',
      country: '한국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '연신내역',
      lat: 37.6191,
      lng: 126.921,
      stayAdmin: {
        neighbourhood: '갈현동',
        city: '서울',
        district: '은평구',
        state: '서울특별시',
      },
    },
    expectPrimaryKeyword: /^은평$/,
    expectKeyword: /서울/,
    rejectPrimaryKeyword: /연신내역|^서울$|종로/,
  },
  {
    slug: 'daegu-jonggak-intersection',
    location: {
      name: '종각네거리 · 대구 중구',
      name_ko: '종각네거리',
      name_en: 'Jonggak Intersection',
      country: '한국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '종각',
      lat: 35.8664,
      lng: 128.5936,
      parentCity: '대구 중구',
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
    expectKeyword: /대구/,
    rejectPrimaryKeyword: /종로|종각역|^서울$/,
    rejectCityHint: /종로|^서울$/,
  },
  {
    slug: 'chuncheon-songam-sports-town',
    location: {
      name: '송암스포츠타운 · 춘천시',
      name_ko: '송암스포츠타운',
      name_en: 'Songam Sports Town',
      country: '한국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '송암',
      lat: 37.85578,
      lng: 127.68863,
      parentCity: '춘천시',
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
    expectPrimaryKeyword: /춘천/,
    expectKeyword: /춘천/,
    rejectPrimaryKeyword: /^송암$|양주|장흥|광주/,
  },
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  let failed = 0;
  try {
    assert(isMrtStayPointLabel('종각역'), '종각역 is stay point');
    assert(isMrtStayPointLabel('종각'), '종각 alias is stay point');
    assert(isMrtStayPointLabel('서울역'), '서울역 is stay point');
    assert(isMrtStayPointLabel('연신내역'), '연신내역 is stay point (not 내역 false positive)');
    assert(isMrtStayPointLabel('신대방역'), '신대방역 is stay point (not 방역 false positive)');
    assert(!isMrtStayPointLabel('영역'), '영역 is not stay point');
    assert(!isMrtStayPointLabel('내역'), '내역 is not stay point');
    assert(!isMrtStayPointLabel('방역'), '방역 is not stay point');
    assert(!isMrtStayPointLabel('종로'), '종로 is neighborhood not stay point');
    assert(queryLooksLikeStayPoint('종각역'), 'queryLooksLikeStayPoint 종각역');
    assert(queryLooksLikeStayPoint('종각'), 'queryLooksLikeStayPoint 종각');
    assert(queryLooksLikeStayPoint('연신내역'), 'queryLooksLikeStayPoint 연신내역');
    assert(queryLooksLikeStayPoint('연신내역, 대한민국'), 'queryLooksLikeStayPoint 연신내역, 대한민국');
    assert(queryLooksLikeStayPoint('종각역, 대한민국'), 'queryLooksLikeStayPoint 종각역, 대한민국');
    assert(queryLooksLikeStayPoint('종각, 대한민국'), 'queryLooksLikeStayPoint 종각, 대한민국');
    assert(!queryLooksLikeStayPoint('서울'), '서울 is not stay point query');
    assert(isMrtStayPointLabel('강원대학교'), '강원대학교 is stay point');
    assert(queryLooksLikeStayPoint('강원대학교'), 'queryLooksLikeStayPoint 강원대학교');
    assert(isUniversityStayQuery('강원대학교'), 'isUniversityStayQuery 강원대학교');
    assert(!isUniversityStayQuery('강원대학교 동해수련원'), '수련원 query is not campus alias');
    const kangwonAlias = resolveKoUniversityAlias('강원대학교');
    assert(kangwonAlias?.city === '춘천', `강원대 alias city (got ${kangwonAlias?.city})`);
    assert(kangwonAlias?.lat === 37.8695, '강원대 alias Chuncheon lat');
    assert(!resolveKoUniversityAlias('강원대학교 동해수련원'), '수련원 keeps no campus alias');
    assert(!resolveKoUniversityAlias('강원대학교 삼척캠퍼스'), '삼척 keeps no Chuncheon alias');
    const donghaeSatellite = resolveKoUniversitySatelliteAlias('강원대학교 동해수련원');
    assert(donghaeSatellite?.city === '양양', `동해수련원 satellite city (got ${donghaeSatellite?.city})`);
    assert(
      Math.abs(donghaeSatellite?.lat - 38.0866) < 1e-6,
      `동해수련원 satellite lat (got ${donghaeSatellite?.lat})`,
    );
    assert(isUniversitySatelliteStayQuery('강원대학교 동해수련원'), '동해수련원 is satellite query');
    const syntheticTraining = syntheticUniversitySatellitePlace(
      '강원대학교 동해수련원',
      donghaeSatellite,
    );
    assert(
      syntheticTraining.name === '강원대학교 동해수련원',
      `synthetic training name (got ${syntheticTraining.name})`,
    );
    assert(
      syntheticTraining.source === 'satellite-alias',
      `synthetic training source (got ${syntheticTraining.source})`,
    );
    const resolvedTrainingEmpty = resolveUniversitySearchHits('강원대학교 동해수련원', []);
    assert(resolvedTrainingEmpty.length === 1, `empty hits → synthetic (got ${resolvedTrainingEmpty.length})`);
    assert(
      Math.abs(resolvedTrainingEmpty[0]?.lat - 38.0866) < 1e-6,
      `empty hits synthetic lat (got ${resolvedTrainingEmpty[0]?.lat})`,
    );
    const yangyangHit = {
      name: '강원대학교',
      name_en: 'Geumgang-ri',
      lat: 38.0866,
      lng: 128.6486,
      stayAdmin: { neighbourhood: '금강리', city: '양양군' },
    };
    const chuncheonHit = {
      name: '강원대학교 춘천캠퍼스',
      name_en: 'Kangwon National University',
      lat: 37.8695,
      lng: 127.744,
      stayAdmin: { city: '춘천시' },
    };
    assert(
      universitySearchHitPenalty('강원대학교', yangyangHit) >
        universitySearchHitPenalty('강원대학교', chuncheonHit),
      'Yangyang training center ranks below Chuncheon campus',
    );
    const rankedUni = rankUniversitySearchHits('강원대학교', [yangyangHit, chuncheonHit]);
    assert(rankedUni[0] === chuncheonHit, 'rankUniversitySearchHits prefers Chuncheon');
    const resolvedUni = resolveUniversitySearchHits('강원대학교', [yangyangHit, yangyangHit]);
    assert(resolvedUni.length === 1, `campus-only cards (got ${resolvedUni.length})`);
    assert(
      resolvedUni[0]?.name_en === 'Kangwon National University',
      `campus card English (got ${resolvedUni[0]?.name_en})`,
    );
    assert(
      Math.abs(resolvedUni[0]?.lat - 37.8695) < 1e-6,
      `campus card lat (got ${resolvedUni[0]?.lat})`,
    );
    assert(
      !/geumgang|금강/i.test(String(resolvedUni[0]?.name_en || '')),
      'campus card is not Geumgang-ri',
    );
    const labeledTownship = applyUniversityCampusPlace('강원대학교', {
      name: '강원대학교',
      name_en: 'Geumgang-ri',
      lat: 37.8695,
      lng: 127.744,
    });
    assert(
      labeledTownship.name_en === 'Kangwon National University',
      `township English rewritten (got ${labeledTownship.name_en})`,
    );
    assert(
      !universityPlaceNeedsCampusSnap('강원대학교', {
        name: '강원대학교 춘천캠퍼스',
        name_en: 'Kangwon National University',
        lat: 37.8695,
        lng: 127.744,
      }),
      'Chuncheon campus does not snap',
    );
    const trainingCards = resolveUniversitySearchHits('강원대학교 동해수련원', [yangyangHit]);
    assert(
      Math.abs(trainingCards[0]?.lat - yangyangHit.lat) < 1e-6,
      '동해수련원 keeps Yangyang card',
    );
    const disambiguatedUni = rankStayPointDisambiguationCandidates('강원대학교', [
      yangyangHit,
      { ...yangyangHit, id: 'dup' },
    ]);
    assert(
      disambiguatedUni[0]?.name_en === 'Kangwon National University',
      `choice overlay English (got ${disambiguatedUni[0]?.name_en})`,
    );
    const jonggakAlias = resolveKoStationAlias('종각');
    assert(jonggakAlias?.station === '종각역', `종각 alias station (got ${jonggakAlias?.station})`);
    assert(jonggakAlias?.district === '종로', `종각 alias district (got ${jonggakAlias?.district})`);
    assert(jonggakAlias?.lat === 37.5701 && jonggakAlias?.lng === 126.9829, '종각 alias station coords');
    assert(resolveKoStationAlias('종각역')?.district === '종로', '종각역 alias district 종로');
    assert(
      !resolveKoStationAliasForLocation({
        name: '종각네거리 · 대구 중구',
        name_ko: '종각네거리',
        originalQuery: '종각',
        lat: 35.8664,
        lng: 128.5936,
        parentCity: '대구 중구',
        stayAdmin: { city: '대구', district: '중구', state: '대구광역시' },
      }),
      '대구 종각네거리 does not use Seoul 종각 alias',
    );
    assert(
      resolveKoStationAliasForLocation({
        name: '종각역',
        name_ko: '종각역',
        originalQuery: '종각',
        lat: 37.5701,
        lng: 126.9829,
        parentCity: '서울 종로',
        stayAdmin: { city: '서울', district: '종로', state: '서울특별시' },
      })?.district === '종로',
      '서울 종각역 still uses station alias',
    );
    assert(isStreetishStayLabel('Jonggak-gil'), 'Jonggak-gil is streetish');
    assert(!isStreetishStayLabel('종각역'), '종각역 is not streetish');
    const rankedCards = rankStayPointDisambiguationCandidates('종각역', [
      { name: '종각역', name_en: 'Jonggak-gil', kind: 'city' },
      { name: '종각역', name_en: 'Seoul', kind: 'poi' },
      { name: '종각역', name_en: 'Jonggak Station', kind: 'poi' },
    ]);
    assert(
      rankedCards[0]?.name_en === 'Jonggak Station',
      `station card first (got ${rankedCards[0]?.name_en})`,
    );
    assert(
      rankedCards[rankedCards.length - 1]?.name_en === 'Jonggak-gil',
      `gil card last (got ${rankedCards[rankedCards.length - 1]?.name_en})`,
    );
    assert(stationNameMatchesQuery('종각', '종각역'), '종각 matches 종각역 name');
    assert(
      nominatimStationScoreDelta('종각', { class: 'railway', type: 'station', name: '종각역' }) === 80,
      '종각 railway score',
    );
    assert(
      nominatimStationScoreDelta('연신내역', { class: 'railway', type: 'station', name: '연신내역' }) === 80,
      '연신내역 railway score',
    );
    assert(
      nominatimSquarePenalty('종각', { class: 'place', type: 'square', name: '종각' }) === -60,
      '종각 square penalty',
    );
    assert(
      mrtNeighborhoodKeyword({ neighbourhood: '종로1가', city: '서울' }, { name: '종각역' }) === '종로',
      '종로1가 / 종각역 → 종로',
    );
    const jonggakAliases = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../src/pages/Home/lib/geocoding.js'),
      'utf8',
    );
    assert(
      jonggakAliases.includes('resolveKoStationAlias') && jonggakAliases.includes('add(stationAlias.station)'),
      'geocoding expands station alias to 종각역',
    );
    assert(
      jonggakAliases.includes('resolveKoUniversityAlias') &&
        jonggakAliases.includes('universityAlias.campus') &&
        jonggakAliases.includes('applyUniversityCampusPlace'),
      'geocoding expands university alias to 춘천캠퍼스',
    );
    assert(
      jonggakAliases.includes('resolveKoUniversitySatelliteAlias') &&
        jonggakAliases.includes('satelliteAlias.name'),
      'geocoding expands satellite alias to 동해수련원',
    );
    const handlersSrc = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../src/pages/Home/hooks/useHomeHandlers.js'),
      'utf8',
    );
    assert(
      handlersSrc.includes('resolveKoUniversitySatelliteAlias') &&
        handlersSrc.includes('syntheticUniversitySatellitePlace') &&
        handlersSrc.includes('handleLocationSelect(pin)'),
      'smart search pins satellite alias before AI fallback',
    );
    const searchBoxSrc = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../src/pages/Home/lib/mapboxSearchBox.js'),
      'utf8',
    );
    assert(
      searchBoxSrc.includes('resolveUniversitySearchHits') &&
        searchBoxSrc.includes('applyUniversityCampusPlace'),
      'Search Box rewrites campus cards off Geumgang-ri',
    );
    console.log('OK  stay-point labels');
  } catch (err) {
    failed += 1;
    console.error('FAIL stay-point labels:', err.message);
  }
  for (const c of CASES) {
    try {
      assert(canShowMrtStayStrip(c.location), `${c.slug}: strip should show`);
      const q = resolveMrtStayQuery(c.location);
      assert(q.keyword, `${c.slug}: keyword`);
      if (c.expectPrimaryKeyword) {
        assert(
          c.expectPrimaryKeyword.test(q.keyword),
          `${c.slug}: primary keyword ${q.keyword}`,
        );
      }
      if (c.rejectPrimaryKeyword) {
        assert(
          !c.rejectPrimaryKeyword.test(q.keyword),
          `${c.slug}: primary must not be ${q.keyword}`,
        );
      }
      if (c.expectKeyword) {
        const blob = [q.keyword, ...q.altKeywords].join('|');
        assert(c.expectKeyword.test(blob), `${c.slug}: keyword ladder ${blob}`);
      }
      if (c.rejectCityHint) {
        const bad = (q.cityHints || []).find((h) => c.rejectCityHint.test(String(h)));
        assert(!bad, `${c.slug}: cityHints must not include ${bad} (${q.cityHints})`);
      }
      const countryBlob = [q.countryHint, ...q.countryHintAlts].join('|');
      if (c.expectCountryAlt) {
        assert(c.expectCountryAlt.test(countryBlob), `${c.slug}: country alts ${countryBlob}`);
      }
      console.log(`OK  ${c.slug}  kw=${q.keyword}  country=${q.countryHint}  alts=${q.countryHintAlts.join(',')}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${c.slug}:`, err.message);
    }
  }

  const baliAlts = expandMrtCountryHintAlts('인도네시아', ['Indonesia']);
  assert(!baliAlts.some((a) => a === '인도'), 'bali alts must not include bare 인도');

  const ongjinMerge = mergeMrtStayFetchQuery(
    {
      slug: 'ongjin',
      hubId: 'ongjin',
      name: '대청도',
      name_ko: '대청도',
      parentCity: '옹진',
      country: '대한민국',
      country_en: 'South Korea',
    },
    { keywordOverride: '옹진', altKeywords: ['인천', '강화'] },
  );
  assert(ongjinMerge.keyword === '옹진', `ongjin merge keyword (got ${ongjinMerge.keyword})`);
  assert(
    ongjinMerge.altKeywords.includes('인천') && ongjinMerge.altKeywords.includes('강화'),
    `ongjin merge alts include 인천·강화 (got ${ongjinMerge.altKeywords.join(',')})`,
  );
  assert(
    ongjinMerge.cityHints.includes('인천'),
    `ongjin merge cityHints include 인천 so Edge does not reject fallback CITY (got ${ongjinMerge.cityHints.join(',')})`,
  );

  const jonggakMerge = mergeMrtStayFetchQuery({
    name: '종각역',
    name_ko: '종각역',
    name_en: 'Jonggak-gil',
    country: '대한민국',
    country_en: 'South Korea',
    uiPlace: true,
    originalQuery: '종각역',
    stayAdmin: {
      neighbourhood: '종로1가',
      city: '서울',
      state: '서울특별시',
    },
  });
  assert(jonggakMerge.keyword === '종로', `jonggak merge keyword (got ${jonggakMerge.keyword})`);
  assert(
    !jonggakMerge.cityHints.some((h) => /종각역|Jonggak/i.test(String(h))),
    `jonggak merge cityHints must not include station label (got ${jonggakMerge.cityHints.join(',')})`,
  );
  assert(
    jonggakMerge.cityHints.includes('서울'),
    `jonggak merge cityHints include 서울 (got ${jonggakMerge.cityHints.join(',')})`,
  );

  const JONGGAK = { lat: 37.5701, lng: 126.9829 };
  const same = haversineKm(JONGGAK.lat, JONGGAK.lng, JONGGAK.lat, JONGGAK.lng);
  assert(same === 0, `haversine same point (got ${same})`);
  const north350mLat = JONGGAK.lat + 350 / 111_320;
  const d350 = haversineKm(JONGGAK.lat, JONGGAK.lng, north350mLat, JONGGAK.lng);
  assert(d350 > 0.32 && d350 < 0.38, `haversine ~350m (got ${d350})`);
  assert(formatStayDistanceLabel(0.35) === '350m', `350m label (got ${formatStayDistanceLabel(0.35)})`);
  assert(formatStayDistanceLabel(1.14) === '1.1km', `1.1km label (got ${formatStayDistanceLabel(1.14)})`);
  assert(formatStayDistanceLabel(2) === '2km', `2km label (got ${formatStayDistanceLabel(2)})`);
  assert(
    formatStayDistanceFromPlace('종각역', 0.35) === '종각역 350m',
    `badge 종각역 350m (got ${formatStayDistanceFromPlace('종각역', 0.35)})`,
  );
  assert(
    parseStayCoordPair({ lat: 37.5718, lng: 126.9769 })?.lat === 37.5718,
    'parseStayCoordPair lat/lng',
  );
  assert(
    parseStayCoordPair({ location: { latitude: 37.57, longitude: 126.98 } })?.lng === 126.98,
    'parseStayCoordPair nested location',
  );
  assert(parseStayCoordPair({ lat: 0, lng: 0 }) == null, 'parseStayCoordPair rejects 0,0');
  assert(
    parseStayCoordPair({ center: [126.9829, 37.5701] })?.lat === 37.5701,
    'parseStayCoordPair Mapbox center [lng,lat]',
  );
  assert(
    parseStayCoordPair({ lat: 126.9829, lng: 37.5701 })?.lat === 37.5701,
    'parseStayCoordPair swaps inverted lat/lng',
  );
  const gilNoCoord = resolveMrtStayOrigin({
    name: '종각역',
    name_en: 'Jonggak-gil',
    originalQuery: '종각역',
    uiPlace: true,
  });
  assert(
    gilNoCoord?.lat === 37.5701 && gilNoCoord?.lng === 126.9829,
    `gil card without coords uses station origin (got ${gilNoCoord?.lat},${gilNoCoord?.lng})`,
  );
  const farGil = resolveMrtStayOrigin({
    name: '종각역',
    name_en: 'Jonggak-gil',
    lat: 35.87,
    lng: 128.6,
    originalQuery: '종각역',
  });
  assert(
    farGil?.lat === 37.5701,
    `far gil card snaps to station (got ${farGil?.lat})`,
  );
  const daeguJonggakOrigin = resolveMrtStayOrigin({
    name: '종각네거리 · 대구 중구',
    name_ko: '종각네거리',
    originalQuery: '종각',
    lat: 35.8664,
    lng: 128.5936,
    parentCity: '대구 중구',
    stayAdmin: { city: '대구', district: '중구', state: '대구광역시' },
    uiPlace: true,
  });
  assert(
    Math.abs(daeguJonggakOrigin?.lat - 35.8664) < 1e-6 &&
      Math.abs(daeguJonggakOrigin?.lng - 128.5936) < 1e-6,
    `대구 종각네거리 keeps Daegu origin (got ${daeguJonggakOrigin?.lat},${daeguJonggakOrigin?.lng})`,
  );
  const nearStreet = resolveMrtStayOrigin({
    name: '종각역',
    name_en: 'Jonggak-gil',
    lat: 37.5704,
    lng: 126.9831,
    originalQuery: '종각역',
  });
  assert(
    Math.abs(nearStreet?.lat - 37.5704) < 1e-6,
    `near street keeps own coords (got ${nearStreet?.lat})`,
  );
  const yeonsinnaeOrigin = resolveMrtStayOrigin({
    name: '연신내역',
    originalQuery: '연신내역',
    lat: 37.6191,
    lng: 126.921,
    uiPlace: true,
  });
  assert(
    Math.abs(yeonsinnaeOrigin?.lat - 37.6191) < 1e-6 &&
      Math.abs(yeonsinnaeOrigin?.lng - 126.921) < 1e-6,
    `연신내역 keeps station coords not 종각 (got ${yeonsinnaeOrigin?.lat},${yeonsinnaeOrigin?.lng})`,
  );
  const kangwonYangyangOrigin = resolveMrtStayOrigin({
    name: '강원대학교',
    name_en: 'Geumgang-ri',
    originalQuery: '강원대학교',
    lat: 38.0866,
    lng: 128.6486,
    uiPlace: true,
  });
  assert(
    Math.abs(kangwonYangyangOrigin?.lat - 37.8695) < 1e-6 &&
      Math.abs(kangwonYangyangOrigin?.lng - 127.744) < 1e-6,
    `강원대학교 Yangyang pin snaps to Chuncheon (got ${kangwonYangyangOrigin?.lat},${kangwonYangyangOrigin?.lng})`,
  );
  const kangwonCampusOrigin = resolveMrtStayOrigin({
    name: '강원대학교',
    originalQuery: '강원대학교',
    lat: 37.8701,
    lng: 127.745,
    uiPlace: true,
  });
  assert(
    Math.abs(kangwonCampusOrigin?.lat - 37.8701) < 1e-6,
    `Chuncheon campus pin keeps own coords (got ${kangwonCampusOrigin?.lat})`,
  );
  const kangwonTrainingOrigin = resolveMrtStayOrigin({
    name: '강원대학교 동해수련원',
    originalQuery: '강원대학교 동해수련원',
    lat: 38.0866,
    lng: 128.6486,
    uiPlace: true,
  });
  assert(
    Math.abs(kangwonTrainingOrigin?.lat - 38.0866) < 1e-6,
    `동해수련원 query keeps Yangyang coords (got ${kangwonTrainingOrigin?.lat})`,
  );
  const kangwonTrainingNamedUniv = resolveMrtStayOrigin({
    name: '강원대학교',
    originalQuery: '강원대학교 동해수련원',
    lat: 38.0866,
    lng: 128.6486,
    uiPlace: true,
  });
  assert(
    Math.abs(kangwonTrainingNamedUniv?.lat - 38.0866) < 1e-6,
    `수련원 originalQuery does not snap even if name is 강원대학교 (got ${kangwonTrainingNamedUniv?.lat})`,
  );

  const PYEONGCHANG = { lat: 37.3704, lng: 128.3901, label: '평창' };
  const CHUNCHEON = { lat: 37.8695, lng: 127.744, label: '춘천' };
  const pyeongchangLoc = {
    name: '평창',
    country: '대한민국',
    stayAdmin: { city: '평창군', county: '평창군', state: '강원특별자치도' },
  };
  const chuncheonLoc = {
    name: '강원대학교',
    originalQuery: '강원대학교',
    country: '대한민국',
    lat: 37.8695,
    lng: 127.744,
    stayAdmin: { city: '춘천시', state: '강원특별자치도' },
  };
  const pyeongchangKeys = collectMrtStayGeoSanityKeys(pyeongchangLoc);
  assert(
    pyeongchangKeys.includes('평창') && !pyeongchangKeys.includes('강원') && !pyeongchangKeys.some((k) => k === '대화'),
    `평창 geo keys (got ${pyeongchangKeys.join(',')})`,
  );
  const chuncheonKeys = collectMrtStayGeoSanityKeys(chuncheonLoc);
  assert(
    chuncheonKeys.includes('춘천') && !chuncheonKeys.includes('양양') && !chuncheonKeys.includes('강원'),
    `춘천 geo keys (got ${chuncheonKeys.join(',')})`,
  );
  const daeguJonggakLoc = {
    name: '종각네거리 · 대구 중구',
    name_ko: '종각네거리',
    originalQuery: '종각',
    lat: 35.8664,
    lng: 128.5936,
    parentCity: '대구 중구',
    country: '대한민국',
    stayAdmin: { city: '대구', district: '중구', state: '대구광역시' },
  };
  const daeguJonggakKeys = collectMrtStayGeoSanityKeys(daeguJonggakLoc);
  assert(
    daeguJonggakKeys.includes('대구') && !daeguJonggakKeys.includes('종로') && !daeguJonggakKeys.includes('중구'),
    `대구 종각 geo keys (got ${daeguJonggakKeys.join(',')})`,
  );
  const geoMixDaeguJonggak = filterMrtStaysByGeoSanity(
    [
      { itemId: 21, itemName: '나인트리 바이 파르나스 서울 인사동', lat: 37.573, lng: 126.985 },
      { itemId: 22, itemName: '호텔 더 디자이너스 종로', lat: 37.5708, lng: 126.983 },
      { itemId: 23, itemName: '대구 중구 호텔', lat: 35.868, lng: 128.595 },
    ],
    { lat: 35.8664, lng: 128.5936, label: '종각네거리 · 대구 중구' },
    { isDomestic: true, originKeys: daeguJonggakKeys },
  );
  assert(
    geoMixDaeguJonggak.every((it) => it.itemId === 23) && geoMixDaeguJonggak.length === 1,
    `대구 종각 숙소는 서울 종각 호텔 아님 (got ${geoMixDaeguJonggak.map((it) => it.itemId)})`,
  );
  assert(MRT_STAY_GEO_SANITY_MAX_KM === 30, `geo-sanity cap (got ${MRT_STAY_GEO_SANITY_MAX_KM})`);
  const geoMixPyeongchang = filterMrtStaysByGeoSanity(
    [
      { itemId: 1, itemName: '라한호텔 광주', lat: 35.1595, lng: 126.8526 },
      { itemId: 2, itemName: '쏠비치 양양', lat: 38.0866, lng: 128.6486 },
      { itemId: 3, itemName: '용평리조트 평창', lat: 37.645, lng: 128.68 },
      { itemId: 4, itemName: '평창 대화 펜션', lat: 37.3708, lng: 128.391 },
      { itemId: 5, itemName: '라한셀렉트 광주' },
    ],
    PYEONGCHANG,
    { isDomestic: true, originKeys: pyeongchangKeys },
  );
  assert(
    geoMixPyeongchang.every((it) => ![1, 2, 5].includes(it.itemId)),
    `평창 검색 광주/양양 0건 (got ${geoMixPyeongchang.map((it) => it.itemId)})`,
  );
  assert(
    geoMixPyeongchang.some((it) => it.itemId === 4),
    `평창 인근 숙소 유지 (got ${geoMixPyeongchang.map((it) => it.itemId)})`,
  );
  assert(
    geoMixPyeongchang.some((it) => it.itemId === 3),
    `평창 시군 숙소 30km 밖이어도 유지 (got ${geoMixPyeongchang.map((it) => it.itemId)})`,
  );
  const geoMixChuncheon = filterMrtStaysByGeoSanity(
    [
      { itemId: 11, itemName: '유스퀘어 광주', lat: 35.16, lng: 126.85 },
      { itemId: 12, itemName: '낙산 호텔 양양', lat: 38.116, lng: 128.635 },
      { itemId: 13, itemName: '춘천 세종호텔', lat: 37.881, lng: 127.73 },
      { itemId: 14, itemName: '양양 하조대 펜션' },
    ],
    CHUNCHEON,
    { isDomestic: true, originKeys: chuncheonKeys },
  );
  assert(
    geoMixChuncheon.every((it) => ![11, 12, 14].includes(it.itemId)),
    `춘천 검색 광주/양양 0건 (got ${geoMixChuncheon.map((it) => it.itemId)})`,
  );
  assert(
    geoMixChuncheon.some((it) => it.itemId === 13),
    `춘천 인근 숙소 유지 (got ${geoMixChuncheon.map((it) => it.itemId)})`,
  );
  const songamSportsLoc = {
    name: '송암스포츠타운 · 춘천시',
    name_ko: '송암스포츠타운',
    originalQuery: '송암',
    lat: 37.85578,
    lng: 127.68863,
    parentCity: '춘천시',
    country: '한국',
    stayAdmin: { neighbourhood: '송암동', city: '춘천', cityEn: 'Chuncheon', state: '강원특별자치도' },
    placeCategory: 'LANDMARK',
    uiPlace: true,
  };
  const songamSportsKeys = collectMrtStayGeoSanityKeys(songamSportsLoc);
  assert(
    songamSportsKeys.includes('춘천') && !songamSportsKeys.includes('양주'),
    `송암스포츠타운 geo keys (got ${songamSportsKeys.join(',')})`,
  );
  const geoMixSongamSports = filterMrtStaysByGeoSanity(
    [
      { itemId: 41, itemName: '양주 비타민펜션&캠핑장', lat: 37.725, lng: 126.948 },
      { itemId: 42, itemName: '양주 아트시티펜션 (장흥유원지)' },
      { itemId: 43, itemName: '춘천 세종호텔', lat: 37.881, lng: 127.73 },
    ],
    { lat: 37.85578, lng: 127.68863, label: '송암스포츠타운 · 춘천시' },
    { isDomestic: true, originKeys: songamSportsKeys },
  );
  assert(
    geoMixSongamSports.every((it) => it.itemId === 43) && geoMixSongamSports.length === 1,
    `춘천 송암스포츠타운 숙소는 양주 펜션 아님 (got ${geoMixSongamSports.map((it) => it.itemId)})`,
  );
  const overseasKept = filterMrtStaysByGeoSanity(
    [{ itemId: 99, itemName: 'Waikiki Hotel', lat: 21.27, lng: -157.82 }],
    CHUNCHEON,
    { isDomestic: false, originKeys: chuncheonKeys },
  );
  assert(overseasKept.length === 1, 'overseas stays skip geo-sanity');
  const daehwaKeys = collectMrtStayGeoSanityKeys({
    name: '대화리',
    country: '한국',
    stayAdmin: { city: '대화면', county: '평창군', state: '강원특별자치도' },
  });
  assert(
    daehwaKeys.includes('평창') && !daehwaKeys.includes('대화'),
    `대화면 keep 키는 평창 (got ${daehwaKeys.join(',')})`,
  );

  const ranked = attachMrtStayDistances(
    [
      { itemId: 1, lat: 37.4979, lng: 127.0276 },
      { itemId: 2, latitude: north350mLat, longitude: JONGGAK.lng },
      { itemId: 3, itemName: 'no-coords' },
    ],
    { ...JONGGAK, label: '종각역' },
  );
  assert(ranked[1].distanceLabel === '종각역 350m' || ranked[1].distanceLabel?.startsWith('종각역 '), `near badge (got ${ranked[1].distanceLabel})`);
  assert(ranked[1].distanceKm < ranked[0].distanceKm, 'gangnam farther than 350m hotel');
  assert(ranked[2].distanceKm == null, 'missing coords stay unranked');
  const byDist = ranked.slice().sort((a, b) => stayDistanceRank(a) - stayDistanceRank(b));
  assert(byDist[0].itemId === 2 && byDist[2].itemId === 3, `distance rank order (${byDist.map((x) => x.itemId)})`);
  const naver = buildNaverNearbyStayMapUrl({ ...JONGGAK, query: '종각역' });
  assert(naver?.includes('map.naver.com/p/search/'), `naver host (got ${naver})`);
  assert(naver.includes(encodeURIComponent('종각역 숙소')), `naver query (got ${naver})`);
  assert(naver.includes(String(JONGGAK.lng)) && naver.includes(String(JONGGAK.lat)), `naver coords (got ${naver})`);
  assert(buildNaverNearbyStayMapUrl({ query: '' }) == null, 'naver empty query');
  const stripSrc = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../src/pages/Home/components/GlobeStayStrip.jsx'),
    'utf8',
  );
  assert(
    stripSrc.includes('attachMrtStayDistances') &&
      stripSrc.includes('resolveMrtStayOrigin') &&
      stripSrc.includes('buildNaverNearbyStayMapUrl') &&
      stripSrc.includes('naverNearbyStays') &&
      stripSrc.includes('distance_asc'),
    'GlobeStayStrip wires distance + naver chip',
  );
  assert(stripSrc.includes('isCurrentMrtStayFetch'), 'first-entry photon apply is not cancelled by location identity');
  assert(
    stripSrc.includes('inflightKeyRef') && stripSrc.includes('[eligible, expanded, fetchKey]'),
    'stay fetch effect deps are fetchKey not location identity',
  );
  const fetchKeyDeclAt = stripSrc.indexOf('const fetchKey =');
  const fetchKeyRefAssignAt = stripSrc.indexOf('fetchKeyRef.current = fetchKey');
  assert(
    !/useRef\(\s*fetchKey\s*\)/.test(stripSrc),
    'GlobeStayStrip fetchKeyRef must not TDZ-init with fetchKey',
  );
  assert(
    fetchKeyDeclAt !== -1 &&
      fetchKeyRefAssignAt !== -1 &&
      fetchKeyDeclAt < fetchKeyRefAssignAt,
    'GlobeStayStrip assigns fetchKey to ref after it is declared',
  );
  const edgeSrc = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../supabase/functions/fetch-mrt-stays/index.ts'),
    'utf8',
  );
  assert(
    edgeSrc.includes('pickStayCoords') && edgeSrc.includes('lat: coords.lat'),
    'Edge fetch-mrt-stays maps hotel lat/lng',
  );
  assert(
    edgeSrc.includes('photonGeocodeStay') &&
      edgeSrc.includes('attachGeocodedStayCoords') &&
      edgeSrc.includes('originLat') &&
      edgeSrc.includes('stayNameCompatible'),
    'Edge Photon geocode + origin + name guard',
  );
  assert(
    simplifyStayGeocodeQuery('나인트리 바이 파르나스 서울 인사동') === '나인트리 서울 인사동',
    'simplify strips 바이 브랜드',
  );
  assert(
    stayGeocodeQueries('오라카이 대학로 호텔, BW 시그니처 컬렉션')[1] === '오라카이 대학로 호텔',
    'simplify strips BW 시그니처',
  );
  assert(isLodgingOsmValue('hotel') && !isLodgingOsmValue('museum'), 'lodging osm filter');
  assert(
    stayNameCompatible('신라스테이 광화문', '신라스테이 광화문'),
    'name compatible exact',
  );
  assert(
    stayNameCompatible('나인트리 서울 인사동', '나인트리 프리미어 호텔 인사동'),
    'name compatible nine tree insadong',
  );
  assert(
    !stayNameCompatible('오라카이 대학로 호텔', '오라카이 인사동 스위츠'),
    'reject same-brand other neighbourhood',
  );
  assert(
    !stayNameCompatible('오라카이 대학로 호텔', '4월 25일 호텔'),
    'reject unrelated photon hotel',
  );
  const fetchSrc = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../src/utils/fetchMrtStays.js'),
    'utf8',
  );
  assert(fetchSrc.includes('originLat') && fetchSrc.includes('originLng'), 'client sends origin to Edge');
  assert(fetchSrc.includes('resolveMrtStayOrigin'), 'client stay origin helper');
  assert(fetchSrc.includes('onPartialResult'), 'list paints before photon enrich');
  assert(fetchSrc.includes('geocodeItems'), 'photon enrich uses geocodeItems');
  assert(fetchSrc.includes('listingBody'), 'listing invoke omits origin');
  assert(fetchSrc.includes('originAdminKeys'), 'listing sends geo-sanity admin keys');
  assert(fetchSrc.includes('filterMrtStaysByGeoSanity'), 'client listing applies geo-sanity');
  assert(fetchSrc.includes('orderStayItemsForGeocode'), 'photon first page follows priced list order');
  assert(fetchSrc.includes('MRT_STAY_PAGE_SIZE'), 'first photon batch is visible page');
  assert(edgeSrc.includes('geocodeItems') && edgeSrc.includes('geocodeOnly'), 'Edge geocodeItems path');
  assert(edgeSrc.includes('geo:id:'), 'Edge geocode cache by itemId');
  assert(edgeSrc.includes('rememberSearchCoords'), 'Edge search cache keeps photon coords');
  assert(edgeSrc.includes('MRT_STAY_GEO_SANITY_MAX_KM'), 'Edge geo-sanity distance cap');
  assert(edgeSrc.includes('filterMrtStaysByGeoSanity'), 'Edge listing applies geo-sanity');
  assert(
    stripSrc.includes('filterMrtStaysByGeoSanity') && stripSrc.includes('collectMrtStayGeoSanityKeys'),
    'GlobeStayStrip wires geo-sanity',
  );
  console.log('OK  stay distance + naver map');

  class MemoryStorage {
    constructor() {
      this.m = new Map();
    }
    getItem(k) {
      return this.m.has(k) ? this.m.get(k) : null;
    }
    setItem(k, v) {
      this.m.set(k, String(v));
    }
    removeItem(k) {
      this.m.delete(k);
    }
    get length() {
      return this.m.size;
    }
    key(i) {
      return [...this.m.keys()][i] ?? null;
    }
  }

  const listingKey = mrtStayListingCacheKey({
    keyword: '종로',
    isDomestic: true,
    countryHint: '대한민국',
    cityHints: ['서울'],
    checkIn: '2026-10-01',
    checkOut: '2026-10-04',
    adultCount: 2,
    childCount: 0,
  });
  assert(listingKey.startsWith(MRT_STAY_LISTING_CACHE_PREFIX), 'listing cache v23 prefix');
  assert(!listingKey.includes('37.570'), 'listing cache key omits origin');
  const mem = new MemoryStorage();
  const listingPayload = {
    ok: true,
    items: [{ itemId: 101, itemName: '신라스테이 광화문', salePrice: 120000 }],
  };
  writeMrtStayListingCache(listingKey, listingPayload, { storage: mem, now: 1_000 });
  const listingHit = readMrtStayListingCache(listingKey, { storage: mem, now: 1_000 });
  assert(listingHit?.items?.[0]?.itemId === 101, 'listing cache hit');
  assert(
    readMrtStayListingCache(listingKey, { storage: mem, now: 1_000 + 31 * 60 * 1000 }) == null,
    'listing cache expires at 30min',
  );
  persistMrtStayCoords(
    [{ itemId: 101, itemName: '신라스테이 광화문', lat: 37.572, lng: 126.977 }],
    { storage: mem, now: 2_000 },
  );
  const hydrated = hydrateMrtStayCoords(
    [{ itemId: 101, itemName: '신라스테이 광화문' }],
    { storage: mem, now: 2_000 },
  );
  assert(hydrated[0].lat === 37.572 && hydrated[0].lng === 126.977, 'coord cache hydrates itemId');
  persistMrtStayCoords([], {
    storage: mem,
    now: 3_000,
    misses: [{ itemId: 202, itemName: '오라카이 대학로' }],
  });
  const needing = itemsNeedingStayGeocode(
    [
      { itemId: 101, itemName: '신라스테이 광화문' },
      { itemId: 202, itemName: '오라카이 대학로' },
      { itemId: 303, itemName: '나인트리 인사동' },
    ],
    { storage: mem, now: 3_000 },
  );
  assert(
    needing.map((it) => it.itemId).join(',') === '303',
    `need geocode only uncached (${needing.map((it) => it.itemId)})`,
  );
  const geoOrder = orderStayItemsForGeocode(
    [
      { itemId: 1, itemName: 'no-price', salePrice: null },
      { itemId: 2, itemName: 'visible', salePrice: 120000 },
      { itemId: 3, itemName: 'also-priced', salePrice: 90000 },
    ],
    [
      { itemId: 1, itemName: 'no-price' },
      { itemId: 2, itemName: 'visible' },
      { itemId: 3, itemName: 'also-priced' },
    ],
  );
  assert(
    geoOrder.map((it) => it.itemId).join(',') === '2,3,1',
    `geocode priced-first (${geoOrder.map((it) => it.itemId)})`,
  );
  assert(isCurrentMrtStayFetch('a|b', 'a|b'), 'same fetch key is current');
  assert(!isCurrentMrtStayFetch('a|b', 'a|c'), 'stale fetch key ignored');
  assert(!isCurrentMrtStayFetch('a|b', ''), 'empty started key ignored');
  const stillNeedAfterMissTtl = itemsNeedingStayGeocode(
    [{ itemId: 202, itemName: '오라카이 대학로' }],
    { storage: mem, now: 3_000 + MRT_STAY_COORD_MISS_TTL_MS + 1 },
  );
  assert(stillNeedAfterMissTtl[0]?.itemId === 202, 'photon miss retries after 24h');
  const merged = mergeMrtStayCoords(
    [{ itemId: 303, itemName: '나인트리 인사동' }],
    [{ itemId: 303, lat: 37.571, lng: 126.985 }],
  );
  assert(merged[0].lat === 37.571, 'merge coords by itemId');
  assert(mem.getItem(MRT_STAY_COORD_CACHE_KEY), 'coord map persisted');
  const stripSrcCache = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../src/pages/Home/components/GlobeStayStrip.jsx'),
    'utf8',
  );
  assert(stripSrcCache.includes('onPartialResult'), 'GlobeStayStrip paints listing before photon');
  assert(stripSrcCache.includes('isCurrentMrtStayFetch'), 'enrich still applies after first paint');
  console.log('OK  stay listing/coord cache');

  const emptyAltsKeepQuery = mergeMrtStayFetchQuery(
    {
      slug: 'ongjin',
      hubId: 'ongjin',
      name: '대청도',
      parentCity: '옹진',
      country: '대한민국',
    },
    { altKeywords: [] },
  );
  assert(
    emptyAltsKeepQuery.altKeywords.length > 0,
    `empty altKeywords array must not wipe location alts (got ${emptyAltsKeepQuery.altKeywords.join(',')})`,
  );

  if (process.env.MRT_STAY_SMOKE_LIVE === '1') {
    const url = (process.env.VITE_SUPABASE_URL || 'https://phdjnbfitvmrguqzverm.supabase.co').replace(/\/$/, '');
    const anon = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
    if (!anon) {
      console.warn('LIVE skip: no anon key');
    } else {
      for (const c of CASES) {
        const q = resolveMrtStayQuery(c.location);
        const isDomestic = /한국|대한민국/i.test(c.location.country || '');
        const body = {
          keyword: q.keyword,
          isDomestic,
          countryHint: q.countryHint,
          countryHintAlts: q.countryHintAlts,
          altKeywords: q.altKeywords,
          nameEn: q.nameEn,
          size: 5,
        };
        const res = await fetch(`${url}/functions/v1/fetch-mrt-stays`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${anon}`,
            apikey: anon,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        const n = (data.items || []).length;
        const status = n > 0 ? 'LIVE_OK' : data.region ? 'LIVE_EMPTY' : 'LIVE_NO_REGION';
        console.log(`${status} ${c.slug} total=${data.totalCount} n=${n} region=${data.region?.subName || '-'}`);
      }
      const jres = await fetch(`${url}/functions/v1/fetch-mrt-stays`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${anon}`,
          apikey: anon,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: '종로',
          isDomestic: true,
          countryHint: '대한민국',
          cityHints: ['서울'],
          size: 20,
          originLat: 37.5701,
          originLng: 126.9829,
        }),
      });
      const jdata = await jres.json();
      const jn = (jdata.items || []).length;
      const withCoords = Number(
        jdata.withCoords ??
          (jdata.items || []).filter((it) => it?.lat != null && it?.lng != null).length,
      );
      const jstatus = jn > 0 ? 'LIVE_OK' : jdata.region ? 'LIVE_EMPTY' : 'LIVE_NO_REGION';
      console.log(
        `${jstatus} jonggak-distance n=${jn} withCoords=${withCoords} region=${jdata.region?.name || '-'}`,
      );
      if (jn > 0 && withCoords < 1) {
        console.error('LIVE_JONGGAK expected withCoords>0 after Photon geocode');
        failed += 1;
      }
    }
  }

  if (failed) {
    console.error(`\n${failed} case(s) failed`);
    process.exit(1);
  }
  console.log(`\nAll ${CASES.length} query cases passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
