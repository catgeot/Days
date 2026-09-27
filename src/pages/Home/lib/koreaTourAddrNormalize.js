/**
 * TourAPI addr1/addr2 시·도 접두 정규화 (행정 개편·통합 표기).
 * `전남` 단독 매칭보다 긴 접두를 먼저 제거한다.
 */

/** @type {readonly string[]} */
export const COMPOSITE_SIDO_ADDR_PREFIXES = ['전남광주통합특별시'];

const STANDARD_SIDO_PREFIX_RE =
  /^(?:서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|세종시|경기도|강원특별자치도|강원도|충청북도|충북|충청남도|충남|전북특별자치도|전라북도|전북|전라남도|전남|경상북도|경북|경상남도|경남|제주특별자치도|제주도)\s+/u;

/**
 * @param {string} raw
 * @returns {string}
 */
export function stripKoreaTourAddrSidoPrefixes(raw) {
  let body = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!body) return '';

  for (const prefix of COMPOSITE_SIDO_ADDR_PREFIXES) {
    if (body.startsWith(prefix)) {
      body = body.slice(prefix.length).trim();
      break;
    }
  }

  body = body.replace(STANDARD_SIDO_PREFIX_RE, '').trim();
  return body;
}

/**
 * addr1·addr2 병합 후 시·도 접두 제거 (locality·sigungu 파싱용 body).
 *
 * @param {string | null | undefined} addr1
 * @param {string | null | undefined} [addr2]
 * @returns {string}
 */
export function koreaTourAddrBodyWithoutSido(addr1, addr2) {
  const raw = [addr1, addr2]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return '';
  const noParen = raw.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  return stripKoreaTourAddrSidoPrefixes(noParen);
}

/**
 * 시·군·구 추출이 시도 통합 표기 오인인지 (geo 1위 유지 · 시도 대표 hub 승격 금지).
 *
 * @param {string} sigungu
 * @returns {boolean}
 */
export function isLowConfidenceTourSigungu(sigungu) {
  const s = String(sigungu || '').trim();
  if (!s) return true;
  if (/통합특별시$/u.test(s)) return true;
  if (/광주통합/u.test(s)) return true;
  return false;
}

const JEONNAM_GWANGJU_INTEGRATED_PREFIX = '전남광주통합특별시';

/**
 * TourAPI `전남광주통합특별시` addr — 광주 광역(구) vs 전남 시·군 areaCode.
 * 구(동구·서구…) → 5(광주) · 군·시(곡성군·여수시…) → 38(전남).
 *
 * @param {string | null | undefined} addr1
 * @returns {'5' | '38' | null}
 */
export function areaCodeFromJeonnamGwangjuIntegratedAddr(addr1) {
  const raw = String(addr1 || '').trim().replace(/\s+/g, ' ');
  if (!raw.startsWith(JEONNAM_GWANGJU_INTEGRATED_PREFIX)) return null;
  const rest = raw.slice(JEONNAM_GWANGJU_INTEGRATED_PREFIX.length).trim();
  const first = rest.split(/\s+/).find(Boolean) || '';
  if (!first) return null;
  if (/군$/u.test(first)) return '38';
  if (/시$/u.test(first)) return '38';
  if (/구$/u.test(first)) return '5';
  return null;
}
