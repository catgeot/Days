/** 제목 기준 — 명소와 무관·상업·행사·교통 위주 강등/제외 */
export const TOURAPI_OFFTOPIC_TITLE_RE =
  /국립민속박물관|민속박물관|교대의식|수문장|기념품|상품관|팝업|아울렛|백화점|나이키|다이소|GS25|카페|펜션|호텔|리조트|맛집|흑돼지|밀면|복국|안경|국제공항|공항터미널|세계불꽃|불꽃축제|페스티벌|하이서울|자물쇠|달빛기행|소극장|도서관|한정식/;

/**
 * 열린관광·무장애 시설 컷 — 명소 전경이 아님. placeHit여도 제외.
 * imgname·title 모두에 쓴다 (프록시가 imgname을 버려도 클라 caption으로 재검사).
 */
export const TOURAPI_FACILITY_TITLE_RE =
  /화장실|공중변소|세면대|변기|소변기|휠체어|점자(?:블록)?|점자\s*블록|유도블록|촉지도|무장애|장애인\s*(?:화장실|주차|엘리베이터|출입|리프트)|수유실|기저귀|핸드레일|주차구역|개찰구|소화기|피난안내도|엘리베이터|승강기|리프트|복도/;

/** 전경·풍경 힌트 */
export const TOURAPI_SCENIC_TITLE_RE =
  /전경|야경|풍경|근정전|경회루|일출|일몰|봄|가을|겨울|여름|해수욕장|백록담|성산|불국|한옥|타워|대교|오름|해변|광장|종유석|석순|석주|동굴|내부/;

/**
 * searchPhoto 채택 하한 — 지명/키워드 미포함 기본점(10)만 있는 「춘천 벚꽃」식 오매칭 제외.
 * (placeHit≥45 · kwHit≥30 · 완전일치 더 높음)
 */
export const TOURAPI_MIN_KEEP_SCORE = 20;

/** 이보다 적으면 Tour 우세라도 스톡을 이어서 채움(시설 컷 후 1~2장만 남는 동굴 등) */
export const TOURAPI_MIN_GALLERY_TO_SKIP_STOCK = 4;

export function isTourApiFacilityPhotoTitle(title) {
  return TOURAPI_FACILITY_TITLE_RE.test(String(title || ''));
}

/**
 * detailImage/searchPhoto 캡션 — title이 비고 imgname만 있는 CMS 장 포함.
 * @param {unknown} item
 */
export function tourApiPhotoCaption(item) {
  if (item == null) return '';
  if (typeof item === 'string') return item.trim();
  if (typeof item !== 'object') return String(item || '').trim();
  const rec = /** @type {Record<string, unknown>} */ (item);
  return [
    rec.title,
    rec.galTitle,
    rec.imgname,
    rec.imgName,
    rec.alt_description,
    rec.alt,
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .join(' ');
}

export function normalizeTourImageUrl(url) {
  return String(url || '')
    .trim()
    .replace(/^http:\/\//i, 'https://')
    .replace(/[?#].*$/, '');
}

/**
 * detailImage 채택. 화장실·휠체어·개찰구 등은 제외.
 * 제목 없는 CMS 장은 firstimage(대표)만 — 열린관광 무장애 더미가 갤러리 선두를 먹지 않게.
 */
export function keepTourDetailImage({
  title,
  imgname,
  imageUrl,
  firstimageUrl,
  placeTitle,
  keyword,
}) {
  const t = [title, imgname]
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .join(' ');
  if (isTourApiFacilityPhotoTitle(t)) {
    return { keep: false, score: -100 };
  }
  if (t) {
    const score = scoreTourPhotoTitle(t, placeTitle, keyword);
    if (score < TOURAPI_MIN_KEEP_SCORE) return { keep: false, score };
    return { keep: true, score: Math.max(score, 55) };
  }
  const img = normalizeTourImageUrl(imageUrl);
  const first = normalizeTourImageUrl(firstimageUrl);
  if (img && first && img === first) {
    return { keep: true, score: 70 };
  }
  return { keep: false, score: 0 };
}

function galleryPhotoCaption(img) {
  if (!img || typeof img !== 'object') return '';
  return String(
    img.alt_description || img.tourApi?.title || img.alt || '',
  ).trim();
}

/**
 * Tour 장이 시설·무제 위주이거나 너무 적으면 스톡 폴백.
 * @param {unknown[]} images
 */
export function isSparseTourApiGallery(images) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (list.length === 0) return true;
  const keepers = list.filter(
    (img) => !isTourApiFacilityPhotoTitle(galleryPhotoCaption(img)),
  );
  if (keepers.length < TOURAPI_MIN_GALLERY_TO_SKIP_STOCK) return true;
  const scenicTitled = keepers.filter((img) => galleryPhotoCaption(img).length > 0);
  return list.length <= 6 && scenicTitled.length < 2;
}

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

  if (isTourApiFacilityPhotoTitle(t)) return -100;

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
