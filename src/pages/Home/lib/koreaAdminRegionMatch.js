import hubsJson from '../data/cityAttractionHubs.json' with { type: 'json' };
import sigunguJson from '../data/koreaSigunguByHub.json' with { type: 'json' };
import areaCodesJson from '../data/koreaAreaCodes.json' with { type: 'json' };
import { detectSidoFromAddr, SIDO_ADDR_HINTS } from '../../Korea/koreaAreaFilter.js';

const METRO_AREA_CODES = new Set(['1', '2', '3', '4', '5', '6', '7']);
const METRO_GU_TOKEN_RE = /^[가-힣]{1,6}구$/u;

const ADMIN_SUFFIX_RE = /(특별자치도|특별자치시|광역시|특별시|도|시|군|구)$/u;

export function stripKoreaAdminSuffix(token) {
  return String(token || '')
    .trim()
    .normalize('NFC')
    .replace(ADMIN_SUFFIX_RE, '');
}

export function tokenizeKoreaAddr(addr1) {
  return String(addr1 || '')
    .trim()
    .normalize('NFC')
    .split(/\s+/)
    .filter(Boolean);
}

export function isForbiddenShortRegionKey(key) {
  const k = String(key || '').trim();
  return k.length === 1;
}

function isSidoLevelToken(token, sidoCode) {
  const t = String(token || '').trim();
  if (!t) return true;
  if (/특별자치도$|특별자치시$|광역시$|특별시$|^도$/u.test(t)) return true;
  const hints = SIDO_ADDR_HINTS[String(sidoCode)] || [];
  return hints.some((hint) => t === hint || t.startsWith(hint));
}

function sigunguLookupLabels(token) {
  const raw = String(token || '').trim();
  if (!raw) return [];
  const stripped = stripKoreaAdminSuffix(raw);
  const labels = [];
  if (stripped && !isForbiddenShortRegionKey(stripped)) labels.push(stripped);
  if (raw !== stripped && !isForbiddenShortRegionKey(raw)) labels.push(raw);
  return labels;
}

function regionLookupKey(sidoCode, label) {
  if (!label || isForbiddenShortRegionKey(label)) return '';
  return `${String(sidoCode)}|${label}`;
}

const SUPPLEMENTAL_HUB_AREA = {
  junggu: '1',
};

function buildSigunguRegionIndex() {
  const byHub = sigunguJson?.byHubId || {};
  const map = new Map();

  for (const hub of Array.isArray(hubsJson) ? hubsJson : []) {
    const hubId = String(hub?.hubId || '').trim().toLowerCase();
    if (!hubId) continue;
    const areaCode = String(byHub[hubId]?.areaCode || SUPPLEMENTAL_HUB_AREA[hubId] || '').trim();
    if (!areaCode) continue;

    const labels = new Set();
    if (hub.name) labels.add(String(hub.name).trim());
    for (const alias of hub.aliases || []) {
      const text = String(alias || '').trim();
      if (text && /[\uAC00-\uD7A3]/.test(text)) labels.add(text);
    }

    for (const label of labels) {
      const parts = String(label).split(/\s+/).filter(Boolean);
      for (const part of parts) {
        for (const lookupLabel of sigunguLookupLabels(part)) {
          const key = regionLookupKey(areaCode, lookupLabel);
          if (!key) continue;
          if (!map.has(key)) map.set(key, hubId);
        }
      }
    }
  }

  return map;
}

const SIGUNGU_REGION_INDEX = buildSigunguRegionIndex();

function buildMultiSidoSigunguLabelSet() {
  /** @type {Map<string, Set<string>>} */
  const labelToSidos = new Map();
  for (const key of SIGUNGU_REGION_INDEX.keys()) {
    const pipe = key.indexOf('|');
    if (pipe <= 0) continue;
    const sido = key.slice(0, pipe);
    const label = key.slice(pipe + 1);
    if (!label) continue;
    if (!labelToSidos.has(label)) labelToSidos.set(label, new Set());
    labelToSidos.get(label).add(sido);
  }
  /** @type {Set<string>} */
  const ambiguous = new Set();
  for (const [label, sidos] of labelToSidos) {
    if (sidos.size > 1) ambiguous.add(label);
  }
  return ambiguous;
}

const MULTI_SIDO_SIGUNGU_LABELS = buildMultiSidoSigunguLabelSet();

/** @returns {ReadonlySet<string>} */
export function listMultiSidoSigunguLabels() {
  return MULTI_SIDO_SIGUNGU_LABELS;
}

function primaryHubForAreaCode(areaCode) {
  const hubs = areaCodesJson?.areas?.[String(areaCode)]?.hubIds;
  const first = hubs?.[0];
  return first ? String(first).trim().toLowerCase() : '';
}

function sigunguResult(sidoCode, hubId, lookupLabel) {
  const stripped = stripKoreaAdminSuffix(lookupLabel);
  const sigungu =
    stripped && !isForbiddenShortRegionKey(stripped) ? stripped : lookupLabel;
  return { hubId, sidoCode, sigungu };
}

/**
 * Logbook / free-text: 시·도 없이 시군구만 쓰면 null (동명·중구 등).
 * @param {string} text
 */
export function isAmbiguousSigunguTextWithoutSido(text) {
  const raw = String(text || '').trim().normalize('NFC');
  if (!raw || detectSidoFromAddr(raw)) return false;
  const compact = raw.replace(/\s+/g, '');
  if (!compact) return false;
  if (MULTI_SIDO_SIGUNGU_LABELS.has(compact)) return true;
  if (METRO_GU_TOKEN_RE.test(compact)) return true;
  for (const label of sigunguLookupLabels(raw)) {
    if (MULTI_SIDO_SIGUNGU_LABELS.has(label)) return true;
  }
  return false;
}

/**
 * addr1 시·도 + 시군구 **토큰 완전 일치** (부분 문자열·includes 금지).
 * @param {string | null | undefined} addr1
 * @returns {{ hubId: string, sidoCode: string, sigungu: string } | null}
 */
export function matchKoreaAdminRegionFromAddr(addr1) {
  const raw = String(addr1 || '').trim();
  if (!raw) return null;
  const sidoCode = detectSidoFromAddr(raw);
  if (!sidoCode) return null;

  for (const token of tokenizeKoreaAddr(raw)) {
    if (isSidoLevelToken(token, sidoCode)) continue;
    for (const lookupLabel of sigunguLookupLabels(token)) {
      const key = regionLookupKey(sidoCode, lookupLabel);
      if (!key) continue;
      const hubId = SIGUNGU_REGION_INDEX.get(key);
      if (hubId) {
        return sigunguResult(sidoCode, hubId, lookupLabel);
      }

      const stripped = stripKoreaAdminSuffix(lookupLabel);
      const isShared =
        MULTI_SIDO_SIGUNGU_LABELS.has(lookupLabel) ||
        MULTI_SIDO_SIGUNGU_LABELS.has(stripped) ||
        METRO_GU_TOKEN_RE.test(String(token || '').trim());
      if (isShared && METRO_AREA_CODES.has(sidoCode)) {
        const primary = primaryHubForAreaCode(sidoCode);
        if (primary) {
          return sigunguResult(sidoCode, primary, lookupLabel);
        }
      }
    }
  }
  return null;
}
