import { listCityAttractionHubs } from '../pages/Home/lib/cityAttractionHubs.js';
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
