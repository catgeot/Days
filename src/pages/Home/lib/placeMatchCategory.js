/**
 * 국내 지명 카테고리 — First-Pass·MRT 숙소 래더·갤러리 스톡이 같은 값을 쓴다.
 * 광천선굴처럼 hub kind가 landmark여도 이름(선굴)은 자연명소.
 */

export const PLACE_MATCH_CATEGORY = {
  NATURE_SCENIC: 'NATURE_SCENIC',
  HISTORY: 'HISTORY',
  STATION: 'STATION',
  UNIVERSITY: 'UNIVERSITY',
  LANDMARK: 'LANDMARK',
};

const HUB_KIND_TO_CATEGORY = {
  beach: PLACE_MATCH_CATEGORY.NATURE_SCENIC,
  park: PLACE_MATCH_CATEGORY.NATURE_SCENIC,
  viewpoint: PLACE_MATCH_CATEGORY.NATURE_SCENIC,
  temple: PLACE_MATCH_CATEGORY.HISTORY,
  shrine: PLACE_MATCH_CATEGORY.HISTORY,
  museum: PLACE_MATCH_CATEGORY.HISTORY,
  landmark: PLACE_MATCH_CATEGORY.LANDMARK,
  market: PLACE_MATCH_CATEGORY.LANDMARK,
  neighborhood: PLACE_MATCH_CATEGORY.LANDMARK,
};

const NATURE_NAME_RE =
  /선굴|동굴|계곡|폭포|온천|습지|해수욕장|해변|해안|국립공원|도립공원|군립공원|자연휴양림|휴양림|수목원|목장|숲길|올레|선재길|새재|양떼목장|호수|저수지/;
const NATURE_PEAK_RE = /(?:산|봉|악)$/;
const HISTORY_NAME_RE = /사찰|향교|서원|고분|릉|유적|박물관|기념관|민속촌|한옥마을/;
const HISTORY_SUFFIX_RE = /.{2,}(?:사|절)$/;
const STATION_NAME_RE = /(?:지하철역|기차역|역)$/;
const STATION_FALSE_EXACT = new Set([
  '무역',
  '검역',
  '방역',
  '용역',
  '영역',
  '번역',
  '이력',
  '내역',
  '현역',
  '대역',
]);
const UNIVERSITY_NAME_RE = /대학교/;

const KO_METRO_EXACT = new Set(['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종']);
const KO_ADMIN_SUFFIX_RE =
  /(특별자치시|특별자치도|광역시|특별시|자치시|자치군|시|군|구|읍|면|동)$/;

function compactKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function stripKoAdminSuffixForCategory(name) {
  const s = String(name || '').trim();
  if (!s || s.length < 3) return '';
  const stripped = s.replace(KO_ADMIN_SUFFIX_RE, '').trim();
  if (!stripped || stripped === s || stripped.length < 2) return '';
  return stripped;
}

export function isKoMetroStayToken(raw) {
  const s = String(raw || '').trim();
  if (!s) return false;
  if (KO_METRO_EXACT.has(s)) return true;
  const stripped = stripKoAdminSuffixForCategory(s);
  return Boolean(stripped && KO_METRO_EXACT.has(stripped));
}

export function tourCategoryFromTourCats(cat1, cat2) {
  const major = String(cat1 || '')
    .trim()
    .toUpperCase();
  const mid = String(cat2 || '')
    .trim()
    .toUpperCase();
  if (major === 'A01') return PLACE_MATCH_CATEGORY.NATURE_SCENIC;
  if (mid === 'A0201') return PLACE_MATCH_CATEGORY.HISTORY;
  if (major === 'A02') return PLACE_MATCH_CATEGORY.LANDMARK;
  return '';
}

export function tourCategoryFromHubKind(kind) {
  return HUB_KIND_TO_CATEGORY[String(kind || '')] || '';
}

function blobFromInput(input) {
  return [input?.name, input?.name_ko, input?.originalQuery]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(' ');
}

function inferFromNames(input) {
  const name = String(input?.name || '').trim();
  const blob = blobFromInput(input);
  if (!blob) return '';

  if (UNIVERSITY_NAME_RE.test(blob)) return PLACE_MATCH_CATEGORY.UNIVERSITY;

  const stationHead = compactKey(name || input?.originalQuery).split(/[,/]/)[0];
  if (STATION_NAME_RE.test(name || String(input?.originalQuery || '').trim())) {
    if (!STATION_FALSE_EXACT.has(stationHead) && !STATION_FALSE_EXACT.has(stationHead.replace(/역$/, ''))) {
      return PLACE_MATCH_CATEGORY.STATION;
    }
  }

  if (NATURE_NAME_RE.test(blob)) return PLACE_MATCH_CATEGORY.NATURE_SCENIC;
  if (NATURE_PEAK_RE.test(name) && name.length >= 3 && !isKoMetroStayToken(name)) {
    return PLACE_MATCH_CATEGORY.NATURE_SCENIC;
  }
  if (HISTORY_NAME_RE.test(blob) || HISTORY_SUFFIX_RE.test(name)) {
    return PLACE_MATCH_CATEGORY.HISTORY;
  }
  return '';
}

/**
 * @param {{
 *   placeCategory?: string,
 *   tourCategory?: string,
 *   kind?: string,
 *   name?: string,
 *   name_ko?: string,
 *   originalQuery?: string,
 *   cat1?: string,
 *   cat2?: string,
 * }} [input]
 */
export function inferPlaceMatchCategory(input = {}) {
  const fromKind = tourCategoryFromHubKind(input.kind);
  if (fromKind && fromKind !== PLACE_MATCH_CATEGORY.LANDMARK) return fromKind;

  const fromTour = tourCategoryFromTourCats(input.cat1, input.cat2);
  if (fromTour && fromTour !== PLACE_MATCH_CATEGORY.LANDMARK) return fromTour;

  const fromName = inferFromNames(input);
  if (fromName) return fromName;

  const explicit = String(input.placeCategory || input.tourCategory || '').trim();
  if (explicit) return explicit;
  return fromKind || fromTour || '';
}

export function placeCategoryUsesCountyStay(category) {
  return (
    category === PLACE_MATCH_CATEGORY.NATURE_SCENIC || category === PLACE_MATCH_CATEGORY.HISTORY
  );
}

export function placeCategoryUsesStayPoint(category) {
  return category === PLACE_MATCH_CATEGORY.STATION || category === PLACE_MATCH_CATEGORY.UNIVERSITY;
}

export function collectStayRegionAnchors(admin = {}, parentCity = '') {
  const anchors = new Set();
  const push = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return;
    anchors.add(s);
    const stripped = stripKoAdminSuffixForCategory(s);
    if (stripped) anchors.add(stripped);
  };
  push(admin.county);
  if (!/(?:읍|면|리)$/.test(String(admin.city || '').trim())) push(admin.city);
  push(admin.cityEn);
  push(parentCity);
  return anchors;
}

export function isUnanchoredMetroStayToken(raw, anchors) {
  if (!isKoMetroStayToken(raw)) return false;
  const s = String(raw || '').trim();
  const stripped = stripKoAdminSuffixForCategory(s) || s;
  if (anchors instanceof Set) {
    return !anchors.has(s) && !anchors.has(stripped);
  }
  return true;
}

export function isPlacePoiStayLabel(raw, location = {}) {
  const token = compactKey(raw);
  if (!token || token.length < 2) return false;
  const labels = [location.name, location.name_ko, location.originalQuery, location.name_en];
  return labels.some((label) => {
    const key = compactKey(label);
    return Boolean(key) && key === token;
  });
}
