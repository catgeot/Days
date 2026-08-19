import {
  mergeTourApiFestivalFields,
  mergeTourApiFestivalInfoRows,
} from './mergeTourApiFestivalDetail.js';

function hasText(value) {
  return String(value ?? '').trim().length > 0;
}

function pickText(enValue, koValue) {
  if (hasText(enValue)) return enValue;
  return koValue ?? null;
}

function mergeGalleryUrls(enUrls, koUrls) {
  const en = Array.isArray(enUrls) ? enUrls : [];
  const ko = Array.isArray(koUrls) ? koUrls : [];
  const out = [];
  const seen = new Set();
  for (const url of [...en, ...ko]) {
    const s = String(url || '').trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/**
 * EngService2 + KorService2 attraction detail 병합 (본문 EN 우선 · KO 폴백).
 * @param {Record<string, unknown> | null | undefined} enDetail
 * @param {Record<string, unknown> | null | undefined} koDetail
 */
export function mergeTourApiAttractionDetail(enDetail, koDetail) {
  if (!koDetail && !enDetail) return null;
  if (!enDetail) return koDetail ?? null;
  if (!koDetail) return enDetail ?? null;

  const galleryUrls = mergeGalleryUrls(enDetail.galleryUrls, koDetail.galleryUrls);
  const imageUrl =
    pickText(enDetail.imageUrl, koDetail.imageUrl) ||
    galleryUrls[0] ||
    null;

  return {
    contentId: enDetail.contentId || koDetail.contentId,
    title: pickText(enDetail.title, koDetail.title),
    overview: pickText(enDetail.overview, koDetail.overview),
    addr1: pickText(enDetail.addr1, koDetail.addr1),
    addr2: pickText(enDetail.addr2, koDetail.addr2),
    tel: pickText(enDetail.tel, koDetail.tel),
    homepage: pickText(enDetail.homepage, koDetail.homepage),
    imageUrl,
    galleryUrls,
    intro: mergeTourApiFestivalFields(enDetail.intro, koDetail.intro),
    infoItems: mergeTourApiFestivalInfoRows(enDetail.infoItems, koDetail.infoItems),
    localeMerged: true,
  };
}
