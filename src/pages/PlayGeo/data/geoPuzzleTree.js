/**
 * 범지구적 퍼즐 — 공식 대륙·중분류 트리 (홈 5면 권역과 분리).
 * 캠페인 순서 = 국가 수 오름차순 (쉬움 → 어려움).
 */

/** @typedef {{ id: string, labelKo: string, labelEn: string, countryIds: string[] }} GeoPuzzleSubregion */
/** @typedef {{ id: string, labelKo: string, labelEn: string, subregions: GeoPuzzleSubregion[] }} GeoPuzzleContinent */

/** @type {GeoPuzzleContinent[]} */
export const GEO_PUZZLE_CONTINENTS = [
  {
    id: 'asia',
    labelKo: '아시아',
    labelEn: 'Asia',
    subregions: [
      {
        id: 'east_asia',
        labelKo: '동아시아',
        labelEn: 'East Asia',
        countryIds: ['kr', 'jp', 'cn', 'tw', 'mn', 'kp'],
      },
    ],
  },
  {
    id: 'south_america',
    labelKo: '남아메리카',
    labelEn: 'South America',
    subregions: [
      {
        id: 'south_america_all',
        labelKo: '남아메리카',
        labelEn: 'South America',
        countryIds: [
          'ar', 'bo', 'br', 'cl', 'co', 'ec', 'gy', 'py', 'pe', 'sr', 'uy', 've',
        ],
      },
    ],
  },
  {
    id: 'europe',
    labelKo: '유럽',
    labelEn: 'Europe',
    subregions: [
      {
        id: 'western_europe',
        labelKo: '서유럽·중부',
        labelEn: 'Western & Central Europe',
        countryIds: ['fr', 'de', 'gb', 'it', 'es', 'pt', 'pl', 'nl'],
      },
    ],
  },
];

export const GEO_PUZZLE_SCORE = {
  continent: 1,
  subregion: 2,
  country: 3,
  miss: 1,
};

export const GEO_PUZZLE_STORAGE_KEY = 'gateo_geo_puzzle_v1';

/** @param {GeoPuzzleContinent} continent */
export function listContinentCountryIds(continent) {
  const ids = [];
  const seen = new Set();
  for (const sub of continent.subregions || []) {
    for (const id of sub.countryIds || []) {
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/** 국가 수 오름차순 캠페인 */
export function getCampaignContinents() {
  return [...GEO_PUZZLE_CONTINENTS].sort(
    (a, b) => listContinentCountryIds(a).length - listContinentCountryIds(b).length,
  );
}
