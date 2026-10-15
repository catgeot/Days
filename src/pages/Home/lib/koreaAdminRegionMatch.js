import hubsJson from '../data/cityAttractionHubs.json' with { type: 'json' };
import sigunguJson from '../data/koreaSigunguByHub.json' with { type: 'json' };
import { detectSidoFromAddr, SIDO_ADDR_HINTS } from '../../Korea/koreaAreaFilter.js';

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
        const stripped = stripKoreaAdminSuffix(lookupLabel);
        const sigungu =
          stripped && !isForbiddenShortRegionKey(stripped) ? stripped : lookupLabel;
        return { hubId, sidoCode, sigungu };
      }
    }
  }
  return null;
}
