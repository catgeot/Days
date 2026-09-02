import { listCityAttractionHubs } from '../pages/Home/lib/cityAttractionHubs.js';
import { isGlobeCameraBusy } from '../pages/Home/lib/globeMarkerLayers.js';
import { isMetroArea } from '../pages/Korea/festivalRegionTags.js';
import {
  KOREA_AREA_CODE_EN,
  KOREA_HERITAGE_CATEGORY_EN,
  KOREA_SCENIC_CLUSTER_EN,
  KOREA_SCENIC_MAJOR_EN,
  KOREA_SIDO_PHRASE_EN,
  KOREA_SIDO_SHORT_EN,
  KOREA_TOUR_CAT_EN,
} from './koreaRegionEn.js';

function isEnLocale(locale) {
  return String(locale || '').startsWith('en');
}

/** @type {Map<string, string> | null} */
let hubKoToEn = null;

function hubKoToEnMap() {
  if (hubKoToEn) return hubKoToEn;
  hubKoToEn = new Map();
  for (const hub of listCityAttractionHubs()) {
    const ko = String(hub?.name || '').trim();
    const en = String(hub?.name_en || hub?.name || '').trim();
    if (!ko || !en) continue;
    hubKoToEn.set(ko, en);
    for (const suf of ['시', '군', '구']) {
      hubKoToEn.set(`${ko}${suf}`, en);
    }
  }
  return hubKoToEn;
}

/**
 * @param {string | null | undefined} locale
 * @returns {'en' | 'ko'}
 */
export function mapboxLanguageForLocale(locale) {
  return isEnLocale(locale) ? 'en' : 'ko';
}

function mapLanguageMatches(map, mapLanguage) {
  if (typeof map.getLanguage !== 'function') return false;
  const current = map.getLanguage();
  if (current == null) return false;
  const currentStr = Array.isArray(current) ? current[0] : current;
  return String(currentStr || '').toLowerCase().startsWith(mapLanguage);
}

function canApplyMapLanguage(map) {
  if (!map || map._removed) return false;
  if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) return false;
  // flyTo/easeTo만 대기 — 자전 jumpTo는 isMoving을 켜 idle을 막아 토글 지연 유발.
  if (isGlobeCameraBusy(map)) return false;
  return true;
}

/**
 * Mapbox setLanguage — continuePlacement 크래시 완화, 자전 중 idle 대기 금지.
 * @param {import('mapbox-gl').Map | null | undefined} map
 * @param {string | null | undefined} locale
 * @returns {() => void} cancel
 */
export function scheduleMapboxLanguage(map, locale) {
  if (!map || typeof map.setLanguage !== 'function' || map._removed) return () => {};

  const mapLanguage = mapboxLanguageForLocale(locale);
  if (mapLanguageMatches(map, mapLanguage)) return () => {};

  let cancelled = false;
  let rafId = 0;
  let retryTimer = 0;
  let hardFallbackTimer = 0;
  /** @type {(() => void) | null} */
  let onStyleData = null;

  const clearTimers = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = 0;
    }
    if (hardFallbackTimer) {
      clearTimeout(hardFallbackTimer);
      hardFallbackTimer = 0;
    }
    if (onStyleData && typeof map.off === 'function') {
      map.off('styledata', onStyleData);
    }
    onStyleData = null;
  };

  const apply = () => {
    if (cancelled || map._removed) return false;
    if (mapLanguageMatches(map, mapLanguage)) return true;
    if (!canApplyMapLanguage(map)) return false;
    try {
      map.setLanguage(mapLanguage);
      return true;
    } catch {
      return false;
    }
  };

  const scheduleRetry = (delayMs) => {
    if (cancelled) return;
    retryTimer = window.setTimeout(() => {
      retryTimer = 0;
      if (cancelled) return;
      if (apply()) return;
      if (isGlobeCameraBusy(map)) {
        scheduleRetry(48);
        return;
      }
      tryApplySoon();
    }, delayMs);
  };

  const tryApplySoon = () => {
    if (cancelled) return;
    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (cancelled) return;
        if (apply()) return;
        if (isGlobeCameraBusy(map)) {
          scheduleRetry(48);
          return;
        }
        apply();
      });
    });
  };

  const waitForStyle = () => {
    if (cancelled || map._removed) return;
    if (canApplyMapLanguage(map)) {
      tryApplySoon();
      return;
    }

    if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) {
      onStyleData = () => {
        onStyleData = null;
        if (!cancelled) tryApplySoon();
      };
      if (typeof map.once === 'function') {
        map.once('styledata', onStyleData);
      } else {
        scheduleRetry(80);
      }
      return;
    }

    scheduleRetry(48);
  };

  waitForStyle();

  hardFallbackTimer = window.setTimeout(() => {
    hardFallbackTimer = 0;
    if (cancelled || map._removed) return;
    if (mapLanguageMatches(map, mapLanguage)) return;
    if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) return;
    try {
      map.setLanguage(mapLanguage);
    } catch {
      // Style may still be loading or mid-render.
    }
  }, 400);

  return () => {
    cancelled = true;
    clearTimers();
  };
}

/**
 * @param {string | null | undefined} locale
 * @param {string | null | undefined} regionKo
 */
export function localizedScenicMajorRegion(locale, regionKo) {
  const ko = String(regionKo || '').trim();
  if (!ko) return '';
  if (!isEnLocale(locale)) return ko;
  return KOREA_SCENIC_MAJOR_EN[ko] || ko;
}

/**
 * @param {string | null | undefined} locale
 * @param {string | number | null | undefined} areaCode
 * @param {string} [labelKo]
 */
export function localizedAreaCodeLabel(locale, areaCode, labelKo = '') {
  const code = String(areaCode || '').trim();
  const fallback = String(labelKo || '').trim() || code;
  if (!code) return fallback;
  if (!isEnLocale(locale)) return fallback;
  return KOREA_AREA_CODE_EN[code] || fallback;
}

/**
 * @param {string | null | undefined} locale
 * @param {string | number | null | undefined} areaCode
 * @param {string} [phraseKo]
 */
export function localizedSidoListPhrase(locale, areaCode, phraseKo = '') {
  const code = String(areaCode || '').trim();
  const fallback = String(phraseKo || '').trim();
  if (!isEnLocale(locale)) return fallback;
  if (code && KOREA_SIDO_PHRASE_EN[code]) return KOREA_SIDO_PHRASE_EN[code];
  return localizedAreaCodeLabel(locale, code, fallback);
}

/**
 * @param {string | null | undefined} locale
 * @param {string | null | undefined} labelKo
 */
export function localizedSubregionLabel(locale, labelKo) {
  const ko = String(labelKo || '').trim();
  if (!ko) return '';
  if (!isEnLocale(locale)) return ko;
  const fromHub = hubKoToEnMap().get(ko);
  if (fromHub) return fromHub;
  const bare = ko.replace(/(시|군|구)$/u, '');
  const fromBare = hubKoToEnMap().get(bare) || hubKoToEnMap().get(`${bare}시`);
  if (fromBare) return fromBare;
  return KOREA_SIDO_SHORT_EN[ko] || KOREA_SIDO_SHORT_EN[bare] || bare || ko;
}

/**
 * @param {string | null | undefined} locale
 * @param {string | null | undefined} code
 * @param {string} [labelKo]
 */
export function localizedTourCategoryLabel(locale, code, labelKo = '') {
  const c = String(code || '').trim();
  const fallback = String(labelKo || '').trim() || c;
  if (!c) return fallback;
  if (!isEnLocale(locale)) return fallback;
  return KOREA_TOUR_CAT_EN[c] || fallback;
}

/**
 * @param {string | null | undefined} locale
 * @param {string | null | undefined} labelKo
 */
export function localizedHeritageCategoryLabel(locale, labelKo) {
  const ko = String(labelKo || '').trim();
  if (!ko) return '';
  if (!isEnLocale(locale)) return ko;
  return KOREA_HERITAGE_CATEGORY_EN[ko] || ko;
}

/**
 * @param {string | null | undefined} locale
 * @param {string | null | undefined} clusterId
 * @param {string} [labelKo]
 */
export function localizedScenicClusterLabel(locale, clusterId, labelKo = '') {
  const id = String(clusterId || '').trim();
  const fallback = String(labelKo || '').trim() || id;
  if (!id) return fallback;
  if (!isEnLocale(locale)) return fallback;
  return KOREA_SCENIC_CLUSTER_EN[id] || fallback;
}

/**
 * @param {string | null | undefined} locale
 * @param {{ name?: string, name_en?: string, hubId?: string } | null | undefined} hub
 */
export function localizedHubLabel(locale, hub) {
  const ko = String(hub?.name || hub?.hubId || '').trim();
  if (!ko) return '';
  if (!isEnLocale(locale)) return ko;
  return String(hub?.name_en || '').trim() || hubKoToEnMap().get(ko) || ko;
}

/**
 * @param {string | null | undefined} locale
 * @param {string | number | null | undefined} areaCode
 * @param {import('i18next').TFunction} t
 */
export function localizedSubregionUnitLabel(locale, areaCode, t) {
  if (isMetroArea(areaCode)) {
    return isEnLocale(locale)
      ? t('korea.region.unit.district', { defaultValue: 'District' })
      : '구';
  }
  return isEnLocale(locale)
    ? t('korea.region.unit.cityCounty', { defaultValue: 'City/county' })
    : '시·군';
}

/**
 * @param {string | null | undefined} locale
 * @param {{ id: string, label: string, count?: number }[]} chips
 */
export function localizeSidoChips(locale, chips) {
  return (chips || []).map((chip) => ({
    ...chip,
    label: localizedAreaCodeLabel(locale, chip.id, chip.label),
  }));
}

/**
 * @param {string | null | undefined} locale
 * @param {{ id: string, label: string, count?: number }[]} chips
 */
export function localizeCityChips(locale, chips) {
  return (chips || []).map((chip) => ({
    ...chip,
    label: localizedSubregionLabel(locale, chip.label),
  }));
}

/**
 * @param {string | null | undefined} locale
 * @param {string | null | undefined} sidoKo
 */
export function localizedSidoShort(locale, sidoKo) {
  const ko = String(sidoKo || '').trim();
  if (!ko) return '';
  if (!isEnLocale(locale)) return ko;
  return KOREA_SIDO_SHORT_EN[ko] || ko;
}

/**
 * @param {string | null | undefined} locale
 * @param {{ id?: string, label?: string } | null | undefined} group
 */
export function localizeFestivalGroupLabel(locale, group) {
  if (!group) return '';
  const id = String(group.id || '').trim();
  const label = String(group.label || '').trim();
  if (id === 'unknown') return localizedScenicMajorRegion(locale, '기타');
  if (/^\d+$/.test(id)) return localizedAreaCodeLabel(locale, id, label);
  return localizedSubregionLabel(locale, label);
}

/**
 * @param {string | null | undefined} locale
 * @param {string} label
 * @param {{ kind?: string, code?: string, clusterId?: string, hub?: object }} [meta]
 */
export function displayChipLabel(locale, label, meta = {}) {
  const ko = String(label || '').trim();
  const { kind, code, clusterId, hub } = meta;
  switch (kind) {
    case 'major':
      return localizedScenicMajorRegion(locale, ko);
    case 'area':
      return localizedAreaCodeLabel(locale, code, ko);
    case 'cluster':
      return localizedScenicClusterLabel(locale, clusterId, ko);
    case 'hub':
      return localizedHubLabel(locale, hub || { name: ko, hubId: code });
    case 'heritage':
      return localizedHeritageCategoryLabel(locale, ko);
    case 'tourCat':
      return localizedTourCategoryLabel(locale, code, ko);
    case 'subregion':
      return localizedSubregionLabel(locale, ko);
    default:
      return ko;
  }
}

/**
 * @param {string | null | undefined} locale
 * @param {{ id?: string, label?: string } | null | undefined} crumb
 * @param {import('i18next').TFunction} t
 */
export function localizeMapDrillCrumbLabel(locale, crumb, t) {
  const id = String(crumb?.id || '').trim();
  const label = String(crumb?.label || '').trim();
  if (!label) return '';
  if (id === 'root') return t('korea.common.all');
  const sep = id.indexOf(':');
  if (sep < 0) return label;
  const kind = id.slice(0, sep);
  const code = id.slice(sep + 1);
  switch (kind) {
    case 'region':
      return localizedScenicMajorRegion(locale, label);
    case 'area':
      return localizedAreaCodeLabel(locale, code, label);
    case 'cluster':
      return localizedScenicClusterLabel(locale, code, label);
    case 'hub':
      return localizedHubLabel(locale, { hubId: code, name: label });
    case 'category':
      return localizedHeritageCategoryLabel(locale, label);
    case 'cat1':
    case 'cat2':
    case 'cat3':
      return localizedTourCategoryLabel(locale, code, label);
    default:
      return label;
  }
}
