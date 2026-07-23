/** 제목 기준 — 명소와 무관·상업·행사 위주 강등/제외 */
export const TOURAPI_OFFTOPIC_TITLE_RE =
  /국립민속박물관|민속박물관|교대의식|수문장|기념품|상품관|팝업|아울렛|백화점|나이키|다이소|GS25|카페|펜션|호텔|리조트|맛집|흑돼지|밀면|복국|안경/;

/** 전경·풍경 힌트 */
export const TOURAPI_SCENIC_TITLE_RE =
  /전경|야경|풍경|근정전|경회루|일출|일몰|봄|가을|겨울|여름|해수욕장|백록담|성산|불국|한옥|타워|대교/;

/**
 * searchPhoto 제목 관련도 — 높을수록 앞.
 * @param {string} title
 * @param {string} placeTitle
 * @param {string} keyword
 */
export function scoreTourPhotoTitle(title, placeTitle, keyword) {
  const t = String(title || '').trim();
  const place = String(placeTitle || '').trim();
  const kw = String(keyword || '').trim();
  if (!t) return 0;

  const placeHit = place && t.includes(place);
  const kwCore = kw.split(/\s+/)[0] || kw;
  const kwHit = kwCore && t.includes(kwCore);

  if (TOURAPI_OFFTOPIC_TITLE_RE.test(t) && !placeHit) return -100;

  let score = 10;
  if (t === place || t === kw) score += 50;
  else if (placeHit) score += 35;
  else if (kwHit) score += 20;

  if (TOURAPI_SCENIC_TITLE_RE.test(t)) score += 25;
  if (TOURAPI_OFFTOPIC_TITLE_RE.test(t)) score -= 45;

  if (placeHit && t.length <= place.length + 6) score += 10;

  return score;
}
