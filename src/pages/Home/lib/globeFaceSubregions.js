/**
 * 면 안 소권역 — 소분류 칩 SSOT (PC 세로 · 모바일 상단 가로 선택바).
 * 대면(권역≠테마)·면 배타는 [`globeFaceRegions.js`](./globeFaceRegions.js) 유지.
 * 소권역끼리도 배타. 짧은 면(≤ SUBREGION_CHIP_MIN_COUNTRIES)은 칩 생략.
 * 정의에 없는 면 나라는 「기타」로 흡수(누락 숨김 방지 · 「전체」칩 없음).
 * 중분류 나라 목록 순서: 시드·인기 순이 아니라 좌표 nearest-neighbor 연쇄(인접국 느낌).
 */

import { GLOBE_CATEGORY_IDS } from './globeCategoryFocus.js';
import { getFaceRegionsForCategory } from './globeFaceRegions.js';

/** 이 수 미만이면 소분류 칩 숨김 (정확히 N개면 칩 표시) */
export const SUBREGION_CHIP_MIN_COUNTRIES = 12;

function lngDelta(a, b) {
  const abs = Math.abs(a - b);
  return Math.min(abs, 360 - abs);
}

/** 대략적 지리 거리(도 단위) — 경도 wrap 반영 */
export function regionCoordDistance(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const dLat = (Number(a.lat) || 0) - (Number(b.lat) || 0);
  const dLng = lngDelta(Number(a.lng) || 0, Number(b.lng) || 0);
  return Math.hypot(dLat, dLng);
}

/**
 * 중분류 안 나라 나열 — 시작국에서 가장 가까운 미방문국을 이어 붙임(greedy).
 * 국경 그래프가 아니라 카탈로그 좌표 기준이라 섬·해외영토는 근사 hop.
 * @param {{ id: string, labelKo?: string, lat?: number, lng?: number }[]} regions
 * @param {string | null | undefined} preferredStartId 소권역 정의 첫 id (예: 한국·태국·프랑스)
 */
export function orderRegionsByNeighborChain(regions, preferredStartId = null) {
  if (!Array.isArray(regions) || regions.length <= 1) return regions ? [...regions] : [];

  const remaining = [...regions];
  let startIdx = 0;
  if (preferredStartId) {
    const i = remaining.findIndex((r) => r.id === preferredStartId);
    if (i >= 0) startIdx = i;
  }
  const ordered = [remaining.splice(startIdx, 1)[0]];

  while (remaining.length > 0) {
    const cur = ordered[ordered.length - 1];
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < remaining.length; i += 1) {
      const d = regionCoordDistance(cur, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      } else if (d === bestDist) {
        const a = remaining[i]?.labelKo || remaining[i]?.id || '';
        const b = remaining[bestIdx]?.labelKo || remaining[bestIdx]?.id || '';
        if (a.localeCompare(b, 'ko') < 0) bestIdx = i;
      }
    }
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }

  return ordered;
}

/**
 * @typedef {{ id: string, labelKo: string, countryIds: string[] }} GlobeFaceSubregion
 */

/** @type {Record<string, GlobeFaceSubregion[]>} */
export const GLOBE_FACE_SUBREGIONS = {
  paradise: [
    {
      id: 'east_asia',
      labelKo: '동아시아',
      countryIds: ['kr', 'jp', 'tw', 'cn', 'mn', 'ru', 'kp'],
    },
    {
      id: 'se_sasia',
      labelKo: '동남아·남아시아',
      countryIds: [
        'th', 'vn', 'ph', 'id', 'my', 'sg', 'kh', 'la', 'mm', 'bn', 'tl',
        'in', 'np', 'lk', 'mv', 'bd', 'bt', 'pk', 'af',
      ],
    },
    {
      id: 'pacific',
      labelKo: '남태평양·오세아니아',
      countryIds: [
        'au', 'nz', 'hi', 'um', 'fj', 'pf', 'to', 'vu', 'ws', 'ck',
        'nc', 'sb', 'ki', 'pn', 'nr', 'mp', 'gu', 'pw', 'fm',
        'pg', 'mh', 'tv', 'as',
      ],
    },
    {
      id: 'central_west_asia',
      labelKo: '중앙·서아시아',
      countryIds: [
        'ae', 'ir', 'sa', 'qa', 'kw', 'bh', 'om', 'ye', 'iq', 'sy', 'lb', 'ps',
        'kz', 'uz', 'tm', 'tj', 'kg', 'az', 'am', 'ge',
      ],
    },
    {
      id: 'other',
      labelKo: '기타',
      countryIds: [],
    },
  ],
  nature: [
    {
      id: 'east_south',
      labelKo: '동·남아프리카',
      countryIds: [
        'ke', 'tz', 'za', 'na', 'mg', 'et', 'zm', 'mu', 'sc', 're', 'io',
        'ug', 'rw', 'bi', 'ss', 'so', 'dj', 'er', 'mw', 'mz', 'zw', 'bw',
        'ls', 'sz', 'km', 'yt',
      ],
    },
    {
      id: 'north_west',
      labelKo: '북·서아프리카',
      countryIds: [
        'eg', 'ma', 'cv', 'eh', 'ml', 'il', 'jo', 'sh',
        'dz', 'tn', 'ly', 'sd', 'mr', 'sn', 'gm', 'gw', 'gn', 'sl', 'lr',
        'ci', 'gh', 'tg', 'bj', 'ng', 'ne', 'bf', 'td',
      ],
    },
    {
      id: 'central',
      labelKo: '중부 아프리카',
      countryIds: [
        'cd', 'cg', 'cf', 'cm', 'ga', 'gq', 'st', 'ao',
      ],
    },
    {
      id: 'other',
      labelKo: '기타',
      countryIds: ['aq', 'tf'],
    },
  ],
  urban: [
    {
      id: 'west_south',
      labelKo: '서·남유럽',
      countryIds: [
        'fr', 'gb', 'eng', 'sct', 'wls', 'nir', 'it', 'es', 'pt', 'gr', 'ch', 'hr', 'tr', 'be', 'nl',
        'at', 'si', 'va', 'me', 'mt', 'ie',
        'lu', 'mc', 'ad', 'li', 'sm', 'al', 'mk', 'xk', 'rs', 'ba', 'bg', 'ro', 'cy',
      ],
    },
    {
      id: 'north_east',
      labelKo: '북·동유럽',
      countryIds: [
        'no', 'de', 'cz', 'dk', 'se', 'pl', 'hu', 'fi',
        'ee', 'lv', 'lt', 'sk', 'ua', 'by', 'md', 'fo',
      ],
    },
    {
      id: 'arctic',
      labelKo: '북극·도서',
      countryIds: ['gl', 'sj', 'is'],
    },
    {
      id: 'other',
      labelKo: '기타',
      countryIds: [],
    },
  ],
  culture: [
    {
      id: 'north',
      labelKo: '북미',
      countryIds: ['us', 'ca', 'ak'],
    },
    {
      id: 'central',
      labelKo: '중미',
      countryIds: ['mx', 'gt', 'bz', 'hn', 'sv', 'ni', 'cr', 'pa'],
    },
    {
      id: 'caribbean',
      labelKo: '카리브',
      countryIds: [
        'cu', 'jm', 'bs', 'ht', 'do', 'pr', 'tt', 'bb', 'gd', 'lc', 'vc', 'ag', 'kn',
        'dm', 'bm', 'cw', 'sx', 'tc', 'vg', 'vi',
      ],
    },
    {
      id: 'other',
      labelKo: '기타',
      countryIds: [],
    },
  ],
  adventure: [
    {
      id: 'andes',
      labelKo: '안데스·서부',
      countryIds: ['pe', 'ec', 'bo', 'cl', 'co'],
    },
    {
      id: 'atlantic',
      labelKo: '대서양·남부',
      countryIds: ['br', 'ar', 'uy', 'py', 've', 'gy', 'sr', 'gf', 'fk'],
    },
    {
      id: 'other',
      labelKo: '기타',
      countryIds: [],
    },
  ],
};

/**
 * @param {string | null | undefined} category
 * @returns {GlobeFaceSubregion[]}
 */
export function getFaceSubregions(category) {
  if (!category || !GLOBE_CATEGORY_IDS.includes(category)) return [];

  const regions = getFaceRegionsForCategory(category);
  if (regions.length < SUBREGION_CHIP_MIN_COUNTRIES) return [];

  const faceIds = new Set(regions.map((r) => r.id));
  const defs = GLOBE_FACE_SUBREGIONS[category] || [];
  const out = [];
  const covered = new Set();

  for (const def of defs) {
    if (def.id === 'other') continue;
    const countryIds = (def.countryIds || []).filter((id) => faceIds.has(id));
    for (const id of countryIds) covered.add(id);
    if (countryIds.length === 0) continue;
    out.push({ id: def.id, labelKo: def.labelKo, countryIds });
  }

  const otherDef = defs.find((d) => d.id === 'other');
  const orphans = [...faceIds].filter((id) => !covered.has(id));
  const otherIds = [
    ...new Set([...(otherDef?.countryIds || []).filter((id) => faceIds.has(id)), ...orphans]),
  ];
  if (otherIds.length > 0) {
    out.push({ id: 'other', labelKo: otherDef?.labelKo || '기타', countryIds: otherIds });
  }

  return out;
}

/**
 * @param {string | null | undefined} category
 * @param {string | null | undefined} subregionId
 */
export function getFaceRegionsForSubregion(category, subregionId) {
  const regions = getFaceRegionsForCategory(category);
  if (!subregionId) return regions;

  const sub = getFaceSubregions(category).find((s) => s.id === subregionId);
  if (!sub) return regions;

  const allowed = new Set(sub.countryIds);
  const filtered = regions.filter((r) => allowed.has(r.id));
  const preferredStartId = sub.countryIds.find((id) => allowed.has(id)) || null;
  return orderRegionsByNeighborChain(filtered, preferredStartId);
}

/**
 * 소권역 칩을 보여줄지. 짧은 면·미정의 면은 false.
 * @param {string | null | undefined} category
 */
export function shouldShowFaceSubregionChips(category) {
  return getFaceSubregions(category).length > 0;
}

/**
 * 소권역 기본값 — 첫 소권역 id (칩 없으면 null). 「전체」칩 없음.
 * @param {string | null | undefined} category
 * @returns {string | null}
 */
export function getDefaultFaceSubregionId(category) {
  const subs = getFaceSubregions(category);
  return subs[0]?.id ?? null;
}
