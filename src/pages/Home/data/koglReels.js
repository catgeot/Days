import { isGateoKoglReelsEnabled } from '../../../shared/gateoFeatureFlags.js';

// TODO: confirm KOGL recommend sourceUrl for each reel (only v5 is provisional).

const JEJU_PLACE_URL = 'https://www.gateo.kr/place/jeju/';
const SCENIC_THEME_URL = 'https://www.gateo.kr/korea/theme/scenic/';

const JEJU_CREDIT = '출처: 제주콘텐츠진흥원(공공누리 제1유형)';
const CHUNGNAM_CREDIT = '출처: 충남문화관광재단(공공누리 제1유형)';
const HERITAGE_CREDIT = '출처: 국가유산청(공공누리 제1유형)';

function readReelsBase() {
  const raw =
    import.meta.env?.VITE_GATEO_REELS_BASE_URL ?? globalThis.__VITE_ENV__?.VITE_GATEO_REELS_BASE_URL;
  return String(raw || '').trim().replace(/\/+$/, '');
}

/** @typedef {{ type: 'KOGL-1', edited: boolean, sourceUrl: string | null }} KoglReelLicense */

/**
 * @typedef {object} KoglReelRaw
 * @property {string} id
 * @property {string} fileId
 * @property {string} title
 * @property {string} placeUrl
 * @property {string} internalPath
 * @property {string} credit
 * @property {KoglReelLicense} license
 */

/** @type {KoglReelRaw[]} */
export const KOGL_REELS_RAW = [
  {
    id: 'kogl-v5',
    fileId: 'v5',
    title: '제주 닭머르해안',
    placeUrl: JEJU_PLACE_URL,
    internalPath: '/place/jeju/',
    credit: JEJU_CREDIT,
    license: {
      type: 'KOGL-1',
      edited: true,
      sourceUrl:
        'https://www.kogl.or.kr/recommend/recommendDivView.do?division=video&recommendIdx=175283',
    },
  },
  {
    id: 'kogl-v6',
    fileId: 'v6',
    title: '제주 추자도',
    placeUrl: JEJU_PLACE_URL,
    internalPath: '/place/jeju/',
    credit: JEJU_CREDIT,
    license: { type: 'KOGL-1', edited: true, sourceUrl: null },
  },
  {
    id: 'kogl-v7',
    fileId: 'v7',
    title: '제주 형제섬',
    placeUrl: JEJU_PLACE_URL,
    internalPath: '/place/jeju/',
    credit: JEJU_CREDIT,
    license: { type: 'KOGL-1', edited: true, sourceUrl: null },
  },
  {
    id: 'kogl-v2',
    fileId: 'v2',
    title: '무창포 해수욕장 바닷길',
    placeUrl: SCENIC_THEME_URL,
    internalPath: '/korea/theme/scenic/',
    credit: CHUNGNAM_CREDIT,
    license: { type: 'KOGL-1', edited: true, sourceUrl: null },
  },
  {
    id: 'kogl-v8',
    fileId: 'v8',
    title: '해미순교성지',
    placeUrl: SCENIC_THEME_URL,
    internalPath: '/korea/theme/scenic/',
    credit: CHUNGNAM_CREDIT,
    license: { type: 'KOGL-1', edited: true, sourceUrl: null },
  },
  {
    id: 'kogl-v1',
    fileId: 'v1',
    title: '공주 중학동 구 선교사 가옥',
    placeUrl: SCENIC_THEME_URL,
    internalPath: '/korea/theme/scenic/',
    credit: CHUNGNAM_CREDIT,
    license: { type: 'KOGL-1', edited: true, sourceUrl: null },
  },
  {
    id: 'kogl-v4',
    fileId: 'v4',
    title: '안면암',
    placeUrl: SCENIC_THEME_URL,
    internalPath: '/korea/theme/scenic/',
    credit: CHUNGNAM_CREDIT,
    license: { type: 'KOGL-1', edited: true, sourceUrl: null },
  },
  {
    id: 'kogl-v3',
    fileId: 'v3',
    title: '서천 장포리 갯벌 독살',
    placeUrl: SCENIC_THEME_URL,
    internalPath: '/korea/theme/scenic/',
    credit: CHUNGNAM_CREDIT,
    license: { type: 'KOGL-1', edited: true, sourceUrl: null },
  },
  {
    id: 'kogl-v10',
    fileId: 'v10',
    title: '홍성 고산사',
    placeUrl: SCENIC_THEME_URL,
    internalPath: '/korea/theme/scenic/',
    credit: CHUNGNAM_CREDIT,
    license: { type: 'KOGL-1', edited: true, sourceUrl: null },
  },
  {
    id: 'kogl-v9',
    fileId: 'v9',
    title: '신안갯벌(타임랩스)',
    placeUrl: SCENIC_THEME_URL,
    internalPath: '/korea/theme/scenic/',
    credit: HERITAGE_CREDIT,
    license: { type: 'KOGL-1', edited: true, sourceUrl: null },
  },
];

function reelMediaUrls(base, fileId) {
  const prefix = `${base}/kogl/v1/${fileId}`;
  return {
    src: `${prefix}-720x1280.mp4`,
    srcHd: `${prefix}-1080x1920.mp4`,
    poster: `${prefix}-poster.webp`,
  };
}

/** @returns {Array<KoglReelRaw & { src: string, srcHd: string, poster: string }>} */
export function getKoglReels() {
  if (!isGateoKoglReelsEnabled()) return [];
  const base = readReelsBase();
  if (!base) return [];
  return KOGL_REELS_RAW.map((entry) => ({
    ...entry,
    ...reelMediaUrls(base, entry.fileId),
  }));
}

export function isKoglReelsSectionVisible() {
  if (!isGateoKoglReelsEnabled()) return false;
  const base = readReelsBase();
  if (!base) return false;
  return KOGL_REELS_RAW.length > 0;
}
