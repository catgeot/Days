/**
 * Site-search all-assets only — extended addr / logbook sigungu rules.
 * Dynamically imported via regionKeyResolve.js; must not change shared koreaAdminRegionMatch.
 */

import hubsJson from '../../data/cityAttractionHubs.json' with { type: 'json' };
import sigunguJson from '../../data/koreaSigunguByHub.json' with { type: 'json' };
import areaCodesJson from '../../data/koreaAreaCodes.json' with { type: 'json' };
import { detectSidoFromAddr, SIDO_ADDR_HINTS } from '../../../Korea/koreaAreaFilter.js';
import {
  isForbiddenShortRegionKey,
  matchKoreaAdminRegionFromAddr,
  stripKoreaAdminSuffix,
  tokenizeKoreaAddr,
} from '../koreaAdminRegionMatch.js';

const METRO_AREA_CODES = new Set(['1', '2', '3', '4', '5', '6', '7']);
const METRO_GU_TOKEN_RE = /^[가-힣]{1,6}구$/u;

const SUPPLEMENTAL_HUB_AREA = {
  junggu: '1',
};

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

const REGION_KEY_SIDO_SHORT = {
  광주: '5',
};

function detectSidoForRegionKey(addr) {
  const fromAddr = detectSidoFromAddr(addr);
  if (fromAddr) return fromAddr;
  for (const token of tokenizeKoreaAddr(addr)) {
    const short = REGION_KEY_SIDO_SHORT[token];
    if (short) return short;
  }
  return null;
}

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
 * @param {string} text
 */
export function isAmbiguousSigunguTextWithoutSido(text) {
  const raw = String(text || '').trim().normalize('NFC');
  if (!raw || detectSidoFromAddr(raw) || detectSidoForRegionKey(raw)) return false;
  const compact = raw.replace(/\s+/g, '');
  if (!compact) return false;
  if (MULTI_SIDO_SIGUNGU_LABELS.has(compact)) return true;
  if (METRO_GU_TOKEN_RE.test(compact)) return true;
  for (const label of sigunguLookupLabels(raw)) {
    if (MULTI_SIDO_SIGUNGU_LABELS.has(label)) return true;
  }
  return false;
}

function matchMetroSigunguFallback(addr1) {
  const raw = String(addr1 || '').trim();
  if (!raw) return null;
  const sidoCode = detectSidoForRegionKey(raw);
  if (!sidoCode || !METRO_AREA_CODES.has(sidoCode)) return null;

  for (const token of tokenizeKoreaAddr(raw)) {
    if (isSidoLevelToken(token, sidoCode)) continue;
    for (const lookupLabel of sigunguLookupLabels(token)) {
      const key = regionLookupKey(sidoCode, lookupLabel);
      if (!key) continue;
      if (SIGUNGU_REGION_INDEX.has(key)) continue;

      const stripped = stripKoreaAdminSuffix(lookupLabel);
      const isShared =
        MULTI_SIDO_SIGUNGU_LABELS.has(lookupLabel) ||
        MULTI_SIDO_SIGUNGU_LABELS.has(stripped) ||
        METRO_GU_TOKEN_RE.test(String(token || '').trim());
      if (!isShared) continue;

      const primary = primaryHubForAreaCode(sidoCode);
      if (primary) return sigunguResult(sidoCode, primary, lookupLabel);
    }
  }
  return null;
}

/**
 * Shared match first, then site-search metro gu fallback (does not affect koreaAdminRegionMatch).
 * @param {string | null | undefined} addr1
 * @returns {{ hubId: string, sidoCode: string, sigungu: string } | null}
 */
export function matchRegionKeyAdminFromAddr(addr1) {
  const mainHit = matchKoreaAdminRegionFromAddr(addr1);
  if (mainHit) return mainHit;
  return matchMetroSigunguFallback(addr1);
}
