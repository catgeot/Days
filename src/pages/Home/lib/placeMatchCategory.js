/**
 * 국내 지명 카테고리 — First-Pass·MRT 숙소 래더·갤러리 스톡이 같은 값을 쓴다.
 * 광천선굴처럼 hub kind가 landmark여도 이름(선굴)은 자연명소.
 */

import hubsJson from '../data/cityAttractionHubs.json' with { type: 'json' };
import koreaAreaCodes from '../data/koreaAreaCodes.json' with { type: 'json' };

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

export const NATURE_NAME_RE =
  /선굴|동굴|계곡|폭포|온천|습지|해수욕장|해변|해안|국립공원|도립공원|군립공원|자연휴양림|휴양림|수목원|목장|숲길|올레|선재길|새재|양떼목장|호수|저수지/;
export const NATURE_PEAK_RE = /(?:산|봉|악)$/;
/** @deprecated scan baseline — bare `릉` matched city names (강릉·울릉) */
export const LEGACY_HISTORY_NAME_RE =
  /사찰|향교|서원|고분|릉|유적|박물관|기념관|민속촌|한옥마을/;
export const HISTORY_NAME_RE =
  /사찰|향교|서원|고분|유적|박물관|기념관|민속촌|한옥마을|왕릉|능원|릉원/;
export const HISTORY_SUFFIX_RE = /.{2,}(?:사|절)$/;
export const STATION_NAME_RE = /(?:지하철역|기차역|역)$/;
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
export const UNIVERSITY_NAME_RE = /대학교/;

const KO_METRO_EXACT = new Set(['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종']);
const KO_ADMIN_SUFFIX_RE =
  /(특별자치시|특별자치도|광역시|특별시|자치시|자치군|시|군|구|읍|면|동)$/;

const HUB_ID_SET = new Set();
/** @type {Set<string>} */
const KO_LOCALITY_NAMES = new Set();

function addLocalityName(raw) {
  const s = String(raw || '').trim();
  if (!s) return;
  KO_LOCALITY_NAMES.add(s);
  const bare = stripKoAdminSuffixForCategory(s);
  if (bare) KO_LOCALITY_NAMES.add(bare);
}

for (const hub of Array.isArray(hubsJson) ? hubsJson : []) {
  const hubId = String(hub?.hubId || '').trim().toLowerCase();
  if (hubId) HUB_ID_SET.add(hubId);
  addLocalityName(hub?.name);
  for (const alias of hub?.aliases || []) addLocalityName(alias);
}
for (const area of Object.values(koreaAreaCodes?.areas || {})) {
  addLocalityName(area?.name);
}
for (const metro of KO_METRO_EXACT) addLocalityName(metro);

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

export function isKoLocalityName(raw) {
  const s = String(raw || '').trim();
  if (!s) return false;
  if (KO_LOCALITY_NAMES.has(s)) return true;
  const bare = stripKoAdminSuffixForCategory(s);
  return Boolean(bare && KO_LOCALITY_NAMES.has(bare));
}

export function isCityHubLocation(input = {}) {
  const slug = compactKey(input?.slug);
  const hubId = compactKey(input?.hubId);
  if (slug && hubId && slug === hubId) return true;
  if (slug && HUB_ID_SET.has(slug)) return true;
  if (hubId && HUB_ID_SET.has(hubId)) return true;
  return false;
}

export function shouldSkipNameCategoryInference(input = {}) {
  return isCityHubLocation(input) || isKoLocalityName(input?.name) || isKoLocalityName(input?.name_ko);
}

/** @returns {string[]} sorted 시·군·구·hub locality labels for health scans */
export function collectKoAdminLocalityNames(extra = []) {
  for (const raw of extra) addLocalityName(raw);
  return [...KO_LOCALITY_NAMES].sort((a, b) => a.localeCompare(b, 'ko'));
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

function matchesHistoryTombLabel(text) {
  const s = String(text || '').trim();
  if (!s || isKoLocalityName(s)) return false;
  if (HISTORY_NAME_RE.test(s)) return true;
  if (/[가-힣]{2,}릉(?:원)?$/.test(s)) return true;
  return false;
}

function inferFromNames(input, { historyNameRe = HISTORY_NAME_RE, useTombHeuristic = true } = {}) {
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
  const historyBlob =
    historyNameRe.test(blob) ||
    (useTombHeuristic && (matchesHistoryTombLabel(blob) || matchesHistoryTombLabel(name)));
  if (historyBlob || HISTORY_SUFFIX_RE.test(name)) {
    return PLACE_MATCH_CATEGORY.HISTORY;
  }
  return '';
}

/**
 * @param {string} name
 * @param {{ legacy?: boolean }} [opts]
 */
export function inferPlaceMatchCategoryFromNameOnly(name, opts = {}) {
  const input = { name: String(name || '').trim() };
  if (opts.legacy) {
    return inferFromNames(input, {
      historyNameRe: LEGACY_HISTORY_NAME_RE,
      useTombHeuristic: false,
    });
  }
  if (shouldSkipNameCategoryInference(input)) return '';
  return inferFromNames(input);
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
 *   slug?: string,
 *   hubId?: string,
 * }} [input]
 */
function inferPlaceMatchCategoryInternal(input = {}, { legacyNames = false } = {}) {
  const fromKind = tourCategoryFromHubKind(input.kind);
  if (fromKind && fromKind !== PLACE_MATCH_CATEGORY.LANDMARK) return fromKind;

  const fromTour = tourCategoryFromTourCats(input.cat1, input.cat2);
  if (fromTour && fromTour !== PLACE_MATCH_CATEGORY.LANDMARK) return fromTour;

  const skipNames = !legacyNames && shouldSkipNameCategoryInference(input);
  if (!skipNames) {
    const fromName = legacyNames
      ? inferFromNames(input, {
          historyNameRe: LEGACY_HISTORY_NAME_RE,
          useTombHeuristic: false,
        })
      : inferFromNames(input);
    if (fromName) return fromName;
  }

  const explicit = String(input.placeCategory || input.tourCategory || '').trim();
  if (explicit) return explicit;
  return fromKind || fromTour || '';
}

export function inferPlaceMatchCategory(input = {}) {
  return inferPlaceMatchCategoryInternal(input, { legacyNames: false });
}

/** @internal scan / regression — pre-fix bare `릉` on city hubs */
export function inferPlaceMatchCategoryLegacy(input = {}) {
  return inferPlaceMatchCategoryInternal(input, { legacyNames: true });
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
