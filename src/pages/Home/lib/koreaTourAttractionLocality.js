import { koreaTourAddrBodyWithoutSido } from './koreaTourAddrNormalize.js';

const SIGUNGU_RE = /^[가-힣]+(?:특별자치시|광역시|특별시|자치시|시|군|구)$/u;
const EUP_MYEON_DONG_RE = /^[가-힣0-9]+(?:읍|면|동|가)$/u;
const RI_RE = /^[가-힣0-9]+리$/u;
const STREET_RE = /(?:로|길|대로|번길)$/u;

/**
 * 주소 → nearby 리스트용 짧은 지역 표기 (시·군·구 + 읍·면·동 + 리).
 * 예: 강원특별자치도 영월군 영월읍 방절리 263-4 → 영월군 영월읍 방절리
 *
 * @param {string | null | undefined} addr1
 * @param {string | null | undefined} [addr2]
 * @returns {string}
 */
export function formatTourAttractionLocality(addr1, addr2) {
  const raw = [addr1, addr2]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return '';

  const parenLocals = [];
  for (const m of raw.matchAll(/\(([가-힣0-9]+(?:읍|면|동|리|가))\)/gu)) {
    parenLocals.push(m[1]);
  }

  const body = koreaTourAddrBodyWithoutSido(addr1, addr2);
  if (!body) return parenLocals[0] || '';

  const parts = [];
  for (const tok of body.split(/\s+/)) {
    if (!tok) continue;
    if (SIGUNGU_RE.test(tok)) {
      parts.push(tok);
      continue;
    }
    if (EUP_MYEON_DONG_RE.test(tok) || RI_RE.test(tok)) {
      parts.push(tok);
      if (RI_RE.test(tok) || parts.length >= 3) break;
      continue;
    }
    if (STREET_RE.test(tok) || /^\d/u.test(tok)) break;
    if (parts.length >= 2) break;
  }

  if (parts.length === 1 && parenLocals[0] && !parts.includes(parenLocals[0])) {
    parts.push(parenLocals[0]);
  }
  if (parts.length === 0 && parenLocals[0]) {
    return parenLocals[0];
  }

  return parts.slice(0, 3).join(' ');
}

/**
 * 주소·locality에서 MRT 숙소/투어 검색용 시·군·구만 추출.
 * POI 제목(예: 생명건강 과학원) 대신 지역(예: 춘천시)으로 검색하게 한다.
 *
 * @param {string | null | undefined} addr1
 * @param {string | null | undefined} [addr2]
 * @returns {string}
 */
export function extractTourAttractionSigungu(addr1, addr2) {
  const locality = formatTourAttractionLocality(addr1, addr2);
  if (!locality) return '';
  for (const tok of locality.split(/\s+/)) {
    if (SIGUNGU_RE.test(tok)) return tok;
  }
  const body = koreaTourAddrBodyWithoutSido(addr1, addr2);
  if (!body) return '';
  for (const tok of body.split(/\s+/)) {
    if (SIGUNGU_RE.test(tok)) return tok;
  }
  return '';
}
