import KOREA_ORIGIN_CITIES from '../data/koreaOriginCities.json' with { type: 'json' };
import { normalizeFestivalCityToken } from './festivalDomesticOrigins.js';
import {
  hangulSyllableCount,
  isChoseongQuery,
  jamoEditDistance,
} from '../../../utils/hangulSearch.js';

export { KOREA_ORIGIN_CITIES };

export const DOMESTIC_ORIGIN_CITY_STORAGE_KEY = 'gateo.domesticOriginCityId';

export const KOREA_PROVINCE_EN = {
  서울: 'Seoul',
  부산: 'Busan',
  대구: 'Daegu',
  인천: 'Incheon',
  광주: 'Gwangju',
  대전: 'Daejeon',
  울산: 'Ulsan',
  세종: 'Sejong',
  경기: 'Gyeonggi',
  강원: 'Gangwon',
  충북: 'Chungbuk',
  충남: 'Chungnam',
  전북: 'Jeonbuk',
  전남: 'Jeonnam',
  경북: 'Gyeongbuk',
  경남: 'Gyeongnam',
  제주: 'Jeju',
};

/** 시·도 짧은 이름이 도시 이름과 같을 때 후보 줄에 쓰는 구분. */
const SAME_NAME_REGION_KIND = {
  서울: { ko: '특별시', en: 'Special City' },
  부산: { ko: '광역시', en: 'Metropolitan City' },
  대구: { ko: '광역시', en: 'Metropolitan City' },
  인천: { ko: '광역시', en: 'Metropolitan City' },
  광주: { ko: '광역시', en: 'Metropolitan City' },
  대전: { ko: '광역시', en: 'Metropolitan City' },
  울산: { ko: '광역시', en: 'Metropolitan City' },
  세종: { ko: '특별자치시', en: 'Special Self-Governing City' },
  제주: { ko: '특별자치도', en: 'Special Self-Governing Province' },
};

const PROVINCE_QUERIES = [
  { province: '경기', names: ['경기', '경기도'] },
  { province: '강원', names: ['강원', '강원도', '강원특별자치도'] },
  { province: '충북', names: ['충북', '충청북도'] },
  { province: '충남', names: ['충남', '충청남도'] },
  { province: '전북', names: ['전북', '전라북도', '전북특별자치도'] },
  { province: '전남', names: ['전남', '전라남도'] },
  { province: '경북', names: ['경북', '경상북도'] },
  { province: '경남', names: ['경남', '경상남도'] },
  { province: '제주', names: ['제주도', '제주특별자치도'] },
];

const BY_ID = new Map(KOREA_ORIGIN_CITIES.map((city) => [city.id, city]));

const EMPTY = { kind: 'empty', cities: [], confirmOnEnter: false, askRaw: '' };

function compact(value) {
  return String(value || '').trim().replace(/\s+/g, '');
}

function latinKey(value) {
  return String(value || '').toLowerCase().replace(/[\s-]+/g, '');
}

function isEnLocale(locale) {
  return String(locale || '').slice(0, 2) === 'en';
}

export function stripOriginInputDecoration(value) {
  let text = String(value ?? '');
  text = text.replace(/\(\s*(?:내 위치|my location)\s*\)/ig, '');
  const parts = text.split(/[·ㆍ]/);
  if (parts.length > 1) text = parts[0];
  return text.trim();
}

export function findKoreaOriginCityById(id) {
  return BY_ID.get(String(id || '').trim()) || null;
}

function aliasHit(city, token) {
  const key = compact(token);
  const lower = key.toLowerCase();
  const latin = latinKey(token);
  return city.aliases.some((alias) => {
    const folded = compact(alias);
    return folded === key || folded.toLowerCase() === lower || latinKey(alias) === latin;
  });
}

/** Alias exact matches. Does not collapse 광역시/시, so 광주광역시 and 광주시 stay distinct. */
export function exactKoreaOriginCities(label) {
  const token = compact(label);
  if (!token) return [];
  return KOREA_ORIGIN_CITIES.filter((city) => aliasHit(city, token));
}

function normalizedExact(token) {
  const norm = normalizeFestivalCityToken(token);
  if (!norm) return [];
  return KOREA_ORIGIN_CITIES.filter((city) => normalizeFestivalCityToken(city.ko) === norm
    || normalizeFestivalCityToken(city.en).toLowerCase() === norm.toLowerCase());
}

function looksLikeGu(token) {
  const key = compact(token);
  if (!/[가-힣]구$/u.test(key)) return false;
  if (KOREA_ORIGIN_CITIES.some((city) => city.ko === key)) return false;
  return true;
}

function provinceQuery(token) {
  const key = compact(token);
  return PROVINCE_QUERIES.find((row) => row.names.some((name) => compact(name) === key)) || null;
}

function provinceRank(city) {
  if (city.hubRole === 'primary') return 0;
  if (city.hubRole === 'alt') return 1;
  return 2;
}

function byProvinceThenName(a, b) {
  const rank = provinceRank(a) - provinceRank(b);
  if (rank) return rank;
  return a.ko.localeCompare(b.ko, 'ko');
}

function pack(kind, cities, confirmOnEnter, askRaw = '') {
  return {
    kind,
    cities: cities.slice(0, 5),
    confirmOnEnter: Boolean(confirmOnEnter),
    askRaw,
  };
}

/**
 * Local suggestions only. No network.
 * @param {unknown} raw
 */
export function suggestKoreaOriginCities(raw) {
  try {
    const token = stripOriginInputDecoration(raw).trim();
    if (!token) return { ...EMPTY };
    const exact = exactKoreaOriginCities(token);
    if (exact.length) {
      const cities = [...exact].sort(byProvinceThenName);
      return pack('exact', cities, cities.length === 1);
    }
    if (looksLikeGu(token)) return pack('gu', [], false);
    const province = provinceQuery(token);
    if (province) {
      const cities = KOREA_ORIGIN_CITIES
        .filter((city) => city.province === province.province)
        .sort(byProvinceThenName);
      return pack('province', cities, false);
    }
    const normalized = normalizedExact(token);
    if (normalized.length) {
      const cities = [...normalized].sort(byProvinceThenName);
      return pack('exact', cities, cities.length === 1);
    }
    const hangul = /^[가-힣]+$/u.test(compact(token)) ? compact(token) : '';
    if (hangul) {
      const pref = KOREA_ORIGIN_CITIES
        .filter((city) => city.ko.startsWith(hangul))
        .sort((a, b) => a.ko.length - b.ko.length || a.ko.localeCompare(b.ko, 'ko'));
      if (pref.length) return pack('prefix', pref, pref.length === 1);
    }
    const latin = latinKey(token);
    if (/^[a-z]{2,}$/i.test(latin)) {
      const hits = KOREA_ORIGIN_CITIES.filter((city) => latinKey(city.en).startsWith(latin)
        || city.aliases.some((alias) => latinKey(alias).startsWith(latin)));
      if (hits.length) {
        const cities = [...hits].sort(byProvinceThenName);
        return pack('english', cities, cities.length === 1);
      }
    }
    if (isChoseongQuery(compact(token))) {
      const query = compact(token);
      const hits = KOREA_ORIGIN_CITIES
        .filter((city) => city.choseong && city.choseong.startsWith(query))
        .sort(byProvinceThenName);
      return pack('choseong', hits, false);
    }
    if (/^[\u3131-\u318e]+$/u.test(compact(token))) return pack('choseong', [], false);
    if (hangul && hangulSyllableCount(hangul) >= 2) {
      const hits = [];
      for (const city of KOREA_ORIGIN_CITIES) {
        const distance = jamoEditDistance(hangul, city.ko);
        if (distance > 0 && distance <= 1) hits.push(city);
      }
      if (hits.length === 1) return pack('typo', hits, false);
      if (hits.length > 1) return pack('cities', hits.sort(byProvinceThenName), false);
    }
    const askRaw = [...token].length <= 20 ? token : '';
    return pack('missing', [], false, askRaw);
  } catch {
    return { ...EMPTY };
  }
}

export function koreaOriginAskLabel(city, locale = 'ko') {
  if (!city) return '';
  const en = isEnLocale(locale);
  if (city.ko === '광주' && city.province === '경기') return en ? 'Gwangju, Gyeonggi' : '경기 광주';
  if (city.ko === '고성' && city.province === '강원') return en ? 'Goseong, Gangwon' : '강원 고성';
  if (city.ko === '고성' && city.province === '경남') return en ? 'Goseong, Gyeongnam' : '경남 고성';
  return en ? city.en : city.ko;
}

export function koreaOriginRegionTag(city, locale = 'ko') {
  if (!city) return '';
  const en = isEnLocale(locale);
  const kind = city.ko === city.province ? SAME_NAME_REGION_KIND[city.ko] : null;
  if (kind) return en ? kind.en : kind.ko;
  return en ? (KOREA_PROVINCE_EN[city.province] || city.province) : city.province;
}

export function koreaOriginOptionLabel(city, locale = 'ko') {
  if (!city) return '';
  const name = isEnLocale(locale) ? city.en : city.ko;
  return `${name} · ${koreaOriginRegionTag(city, locale)}`;
}

export function koreaOriginCityForChip(ko, province) {
  const hits = KOREA_ORIGIN_CITIES.filter((city) => city.ko === ko);
  if (hits.length === 1) return hits[0];
  return hits.find((city) => city.province === province) || null;
}

export function readDomesticOriginCityId(storage = globalThis.localStorage) {
  try {
    const id = storage?.getItem?.(DOMESTIC_ORIGIN_CITY_STORAGE_KEY) || '';
    return findKoreaOriginCityById(id) ? id : '';
  } catch {
    return '';
  }
}

export function writeDomesticOriginCityId(id, storage = globalThis.localStorage) {
  try {
    if (!findKoreaOriginCityById(id) || !storage?.setItem) return;
    storage.setItem(DOMESTIC_ORIGIN_CITY_STORAGE_KEY, id);
  } catch {
    /* private mode */
  }
}
