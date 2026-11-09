import {
  attractionToPlacePin,
  attractionToSuggestion,
  resolveCityAttractionHub,
  resolveHubAttraction,
} from './cityAttractionHubs.js';
import { getKoreaScenicSpotRecordById } from './koreaScenicSpots.js';
import { lookupLocalScenicPhotoByContentId } from './koreaLocalScenicLists.js';
import { getPlaceUrlParam, koreaTourContentPlaceParam } from './formatUrlName.js';
import {
  resolveHubPlaceFromSlug,
} from './cityAttractionHubs.js';

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const COLLECTIVE_GROUP_TITLE = '유네스코 세계문화유산 · 조선 왕릉';

const COLLECTIVE_QUERY_KEYS = new Set([
  '조선왕릉',
  '조선왕릉군',
  '조선왕릉축전',
  '중부지구',
  '조선왕릉중부지구',
  '조선왕릉중부',
  '서부지구',
  '조선왕릉서부지구',
  '서부왕릉',
]);

const UMBRELLA_QUERY_KEYS = new Set(['조선왕릉', '조선왕릉군', '조선왕릉축전', '왕릉']);

const CENTRAL_QUERY_KEYS = new Set([
  '중부지구',
  '조선왕릉중부지구',
  '조선왕릉중부',
]);

const WEST_QUERY_KEYS = new Set(['서부지구', '조선왕릉서부지구', '서부왕릉', '서오릉']);

const ROUTABLE_TOMBS = [
  {
    scenicId: 'donggureung-royal-tombs',
    attractionName: '동구릉',
    displayPrefix: '조선왕릉',
    region: 'central',
  },
  {
    scenicId: 'hongyureung-royal-tombs',
    attractionName: '홍유릉',
    displayPrefix: '조선왕릉',
    region: 'central',
  },
  {
    scenicId: 'sareung-royal-tomb',
    attractionName: '사릉',
    displayPrefix: '조선왕릉',
    region: 'central',
  },
  {
    scenicId: null,
    attractionName: '서오릉',
    displayPrefix: '조선왕릉',
    region: 'west',
    hubId: 'goyang',
    name_en: 'Seooreung Royal Tombs',
    placeSlug: 'seooreung-royal-tombs',
    contentId: '125549',
    lat: 37.6592,
    lng: 126.8934,
    imageUrl: 'https://tong.visitkorea.or.kr/cms/resource/20/3527720_image2_1.jpg',
    galleryUrls: [
      'https://tong.visitkorea.or.kr/cms/resource/20/3527720_image2_1.jpg',
      'https://tong.visitkorea.or.kr/cms/resource/20/3527720_image2_2.jpg',
    ],
  },
];

export const JOSEON_ROYAL_TOMB_GALLERY_SLUGS = new Set(
  ROUTABLE_TOMBS.flatMap((row) => {
    const spot = row.scenicId ? getKoreaScenicSpotRecordById(row.scenicId) : null;
    const slug = String(row.placeSlug || spot?.placeSlug || '').trim().toLowerCase();
    return slug ? [slug] : [];
  }),
);

export function isJoseonRoyalTombGallerySlug(slug) {
  const key = String(slug || '').trim().toLowerCase();
  return key.length > 0 && JOSEON_ROYAL_TOMB_GALLERY_SLUGS.has(key);
}

const MANAGEMENT_OFFICE_NEEDLE_RE =
  /(?:궁능유적본부|국가유산청).{0,24}조선왕릉.{0,12}관리소|조선왕릉(?:중부|서부)지구관리소/;

function scenicTombPin(spec, spot) {
  const hit = resolveHubAttraction(spec.attractionName);
  if (!hit && !spec.hubId) return null;
  const hub = hit?.hub || resolveCityAttractionHub(spec.hubId);
  if (!hub) return null;

  const base = hit
    ? attractionToPlacePin(hit.hub, hit.attraction)
    : {
        id: `hub-attr-${hub.hubId}-${normalizeKey(spec.attractionName)}`,
        slug: spec.placeSlug,
        canonical_slug: spec.placeSlug,
        name: spec.attractionName,
        name_en: spec.name_en || spec.attractionName,
        name_ko: spec.attractionName,
        country: hub.country || '대한민국',
        country_en: hub.country_en || 'South Korea',
        lat: spec.lat ?? hub.lat,
        lng: spec.lng ?? hub.lng,
        type: 'temp-base',
        uiPlace: true,
        hubId: hub.hubId,
        parentCity: hub.name,
        source: 'hub',
      };

  const contentId = String(spot?.contentId || spec.contentId || '').trim();
  const placeSlug = String(spot?.placeSlug || spec.placeSlug || base.slug || '').trim();
  const overlay = /^\d{1,32}$/.test(contentId)
    ? lookupLocalScenicPhotoByContentId(contentId)
    : null;

  return {
    ...base,
    hubId: spot?.hubId || base.hubId,
    parentCity: hub.name,
    slug: placeSlug || base.slug,
    canonical_slug: placeSlug || base.canonical_slug,
    contentId: contentId || undefined,
    imageUrl: spot?.imageUrl || overlay?.imageUrl || spec.imageUrl || base.imageUrl,
    thumbUrl: spot?.imageUrl || overlay?.imageUrl || spec.imageUrl,
    galleryUrls:
      overlay?.galleryUrls ||
      (Array.isArray(spec.galleryUrls) && spec.galleryUrls.length
        ? spec.galleryUrls
        : spec.imageUrl
          ? [spec.imageUrl]
          : undefined),
    addr1: spot?.attractionName ? undefined : '경기도 고양시 덕양구 서오릉로 334-32',
    source: placeSlug ? 'hub' : contentId ? 'tourapi' : base.source,
  };
}

function tombSuggestion(spec) {
  const spot = spec.scenicId ? getKoreaScenicSpotRecordById(spec.scenicId) : null;
  const pin = scenicTombPin(spec, spot);
  if (!pin) return null;

  const hit = resolveHubAttraction(spec.attractionName);
  let item = hit
    ? attractionToSuggestion(hit.hub, hit.attraction)
  : {
        id: pin.id,
        kind: 'attraction',
        badge: '명소',
        name: pin.name,
        name_en: pin.name_en,
        country: pin.country,
        country_en: pin.country_en,
        lat: pin.lat,
        lng: pin.lng,
        slug: pin.slug,
        hubId: pin.hubId,
        parentCity: pin.parentCity,
        source: 'hub',
        uiPlace: true,
      };

  const displayName = spec.displayPrefix
    ? `${spec.displayPrefix} ${spec.attractionName}`.replace(/\s+/g, ' ').trim()
    : pin.name;

  item = {
    ...item,
    name: displayName,
    name_ko: pin.name,
    name_en: spot?.attractionNameEn || pin.name_en || hit?.attraction?.name_en || item.name_en,
    slug: pin.slug,
    canonical_slug: pin.canonical_slug,
    hubId: pin.hubId,
    parentCity: pin.parentCity,
    contentId: pin.contentId,
    source: 'hub',
    uiPlace: true,
    imageUrl: pin.imageUrl,
    thumbUrl: pin.thumbUrl,
    groupTitle: COLLECTIVE_GROUP_TITLE,
    searchOverlayDesc:
      spot?.blurb ||
      `${spec.attractionName} — 유네스코 조선 왕릉. 입장·해설은 궁능유적본부 안내를 따르세요.`,
  };
  return item;
}

export function isJoseonRoyalTombsCollectiveQuery(query) {
  const key = normalizeKey(query);
  return COLLECTIVE_QUERY_KEYS.has(key) || key === '왕릉' || WEST_QUERY_KEYS.has(key);
}

export function isJoseonRoyalTombsManagementOfficeName(name) {
  return MANAGEMENT_OFFICE_NEEDLE_RE.test(String(name || '').trim());
}

export function buildJoseonRoyalTombsCollectiveSuggestions(query) {
  const key = normalizeKey(query);
  if (!isJoseonRoyalTombsCollectiveQuery(query)) return [];

  let specs = ROUTABLE_TOMBS;
  if (CENTRAL_QUERY_KEYS.has(key)) {
    specs = ROUTABLE_TOMBS.filter((row) => row.region === 'central');
  } else if (WEST_QUERY_KEYS.has(key)) {
    specs = ROUTABLE_TOMBS.filter((row) => row.region === 'west');
  } else if (UMBRELLA_QUERY_KEYS.has(key)) {
    specs = ROUTABLE_TOMBS;
  }

  const out = [];
  const seen = new Set();
  for (const spec of specs) {
    const item = tombSuggestion(spec);
    if (!item) continue;
    const dedupe = normalizeKey(item.slug || item.name);
    if (!dedupe || seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push(item);
  }
  return out;
}

function resolveOfficeTargetSpec(officeName) {
  const name = String(officeName || '');
  if (/서부|서오릉/.test(name)) {
    return ROUTABLE_TOMBS.find((row) => row.region === 'west');
  }
  if (/중부|동구릉|홍유/.test(name)) {
    return ROUTABLE_TOMBS.find((row) => row.scenicId === 'donggureung-royal-tombs');
  }
  return null;
}

/**
 * Mapbox 관리소 POI → 대표 왕릉 /place slug (search- 좌표·서울 허브 회피).
 */
export function resolveJoseonRoyalTombsOfficePlaceRoute(pin) {
  if (!pin || typeof pin !== 'object') return null;
  const name = String(pin.name || pin.name_ko || '').trim();
  if (!isJoseonRoyalTombsManagementOfficeName(name)) return null;

  const spec = resolveOfficeTargetSpec(name);
  if (!spec) return null;
  const spot = spec.scenicId ? getKoreaScenicSpotRecordById(spec.scenicId) : null;
  const routed = scenicTombPin(spec, spot);
  if (!routed) return null;

  const param = getPlaceUrlParam(routed);
  if (!param || param.startsWith('search-')) return null;
  return { spot: routed, param };
}

export function correctJoseonRoyalTombsHub(pin) {
  if (!pin || typeof pin !== 'object') return pin;
  const name = String(pin.name || pin.name_ko || '');
  if (!isJoseonRoyalTombsManagementOfficeName(name)) return pin;

  const spec = resolveOfficeTargetSpec(name);
  if (!spec) return pin;

  const hub = resolveCityAttractionHub(spec.hubId || (spec.region === 'west' ? 'goyang' : 'guri'));
  if (!hub?.hubId) return pin;

  const wrongSeoul =
    String(pin.hubId || '').toLowerCase() === 'seoul' ||
    String(pin.parentCity || '').trim() === '서울';
  if (!wrongSeoul && String(pin.hubId || '') === hub.hubId) return pin;

  return {
    ...pin,
    hubId: hub.hubId,
    parentCity: hub.name,
    slug: pin.slug?.startsWith?.('search-') ? pin.slug : pin.slug,
  };
}

/**
 * 새로고침 시 sessionStorage 미스 — search- 좌표 또는 관리소 캐시 복원.
 */
export function resolveJoseonRoyalTombsSearchSlugHydratePin(targetSlug, lat, lng) {
  const slug = String(targetSlug || '').trim().toLowerCase();
  if (!slug.startsWith('search-')) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  for (const spec of ROUTABLE_TOMBS) {
    const spot = spec.scenicId ? getKoreaScenicSpotRecordById(spec.scenicId) : null;
    const pin = scenicTombPin(spec, spot);
    if (!pin) continue;
    const param = getPlaceUrlParam(pin);
    if (param === slug) return pin;
  }

  const officeLike =
    Math.abs(lat - 37.4768) < 0.02 && Math.abs(lng - 127.0045) < 0.02
      ? '조선왕릉중부지구관리소'
      : Math.abs(lat - 37.6589) < 0.02 && Math.abs(lng - 126.8321) < 0.02
        ? '조선왕릉서부지구관리소'
        : null;

  if (officeLike) {
    const route = resolveJoseonRoyalTombsOfficePlaceRoute({
      name: officeLike,
      lat,
      lng,
      source: 'mapbox',
      uiPlace: true,
    });
    if (route?.spot) {
      return {
        ...route.spot,
        id: slug,
        slug,
        canonical_slug: slug,
      };
    }
  }

  return null;
}

export function resolveJoseonRoyalTombsCatalogSlugPin(slug) {
  const normalized = String(slug || '').trim().toLowerCase();
  if (!normalized) return null;

  for (const spec of ROUTABLE_TOMBS) {
    const spot = spec.scenicId ? getKoreaScenicSpotRecordById(spec.scenicId) : null;
    const placeSlug = String(spot?.placeSlug || spec.placeSlug || '').trim().toLowerCase();
    if (!placeSlug || placeSlug !== normalized) continue;
    const pin = scenicTombPin(spec, spot);
    if (pin) return pin;
  }

  const hubPin = resolveHubPlaceFromSlug(normalized);
  if (hubPin && /릉/.test(String(hubPin.name || ''))) {
    const spec = ROUTABLE_TOMBS.find(
      (row) => normalizeKey(row.attractionName) === normalizeKey(hubPin.name),
    );
    if (spec) {
      const spot = spec.scenicId ? getKoreaScenicSpotRecordById(spec.scenicId) : null;
      return scenicTombPin(spec, spot) || hubPin;
    }
  }

  return null;
}

export function mergeJoseonRoyalTombsGalleryFields(pin) {
  if (!pin || typeof pin !== 'object') return pin;
  const contentId = String(pin.contentId || '').replace(/^tour-/, '').trim();
  if (!/^\d{1,32}$/.test(contentId)) return pin;
  const overlay = lookupLocalScenicPhotoByContentId(contentId);
  if (!overlay?.imageUrl) return pin;
  return {
    ...pin,
    contentId,
    imageUrl: pin.imageUrl || overlay.imageUrl,
    galleryUrls: pin.galleryUrls || overlay.galleryUrls,
    homepage: pin.homepage || overlay.homepage,
  };
}

export function shouldDemoteJoseonManagementOfficeSearchHit(query, item) {
  if (!isJoseonRoyalTombsCollectiveQuery(query)) return false;
  const name = String(item?.name || item?.name_ko || '').trim();
  return isJoseonRoyalTombsManagementOfficeName(name);
}
