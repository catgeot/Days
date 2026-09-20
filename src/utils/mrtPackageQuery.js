/**
 * MRT 패키지(/pkc) 딥링크 해석 — 목록 API 없음 · 웹 검색·기획전 URL만.
 */
import { isMrtDomesticLocation } from './mrtStayQuery.js';

/**
 * 써머리·투어「패키지 더보기」검색어 — 장소 한글명 우선.
 * @param {object|null|undefined} location
 * @returns {string}
 */
export function resolveMrtPackageSearchKeyword(location) {
  const name = String(
    location?.name_ko || location?.name || location?.curation_data?.location || ''
  ).trim();
  if (name) return name.slice(0, 80);
  const en = String(location?.name_en || location?.curation_data?.locationEn || '').trim();
  return en.slice(0, 80);
}

/** UI CTA용 — en일 때 name_en 우선 · /pkc 검색 q는 {@link resolveMrtPackageSearchKeyword} 유지 */
export function resolveMrtPackageDisplayKeyword(location, locale = 'ko') {
  if (String(locale || '').startsWith('en')) {
    const en = String(location?.name_en || location?.curation_data?.locationEn || '').trim();
    if (en) return en.slice(0, 80);
  }
  return resolveMrtPackageSearchKeyword(location);
}

/**
 * 국가·지명 힌트로 테마 키 (family|japan|longhaul|resort|null).
 * @param {object|null|undefined} location
 * @returns {'family'|'japan'|'longhaul'|'resort'|null}
 */
export function resolveMrtPackageThemeKey(location) {
  if (!location || location.isScanning) return null;
  const country = String(location.country || location.curation_data?.country || '').trim();
  const countryEn = String(location.country_en || '').trim().toLowerCase();
  const blob = [
    country,
    countryEn,
    location.name,
    location.name_ko,
    location.name_en,
    location.slug,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    /일본|japan|도쿄|tokyo|오사카|osaka|교토|kyoto|홋카이도|hokkaido|후쿠오카|fukuoka|오키나와|okinawa|나고야|nagoya/.test(
      blob
    )
  ) {
    return 'japan';
  }
  if (
    /베트남|vietnam|태국|thailand|필리핀|philippines|인도네시아|indonesia|말레이|malaysia|싱가포르|singapore|캄보디아|cambodia|라오스|laos|미얀마|myanmar|발리|bali|다낭|danang|나트랑|푸꾸옥|보라카이|세부|보홀|코타키나발루|괌|guam|사이판|saipan|하와이|hawaii/.test(
      blob
    )
  ) {
    return 'resort';
  }
  if (
    /유럽|europe|프랑스|france|이탈리아|italy|스페인|spain|독일|germany|영국|united kingdom|uk\b|스위스|swiss|네덜란드|netherlands|체코|czech|오스트리아|austria|그리스|greece|포르투갈|portugal|크로아티아|croatia|북미|미국|usa|america|캐나다|canada|호주|australia|뉴질랜드|new zealand/.test(
      blob
    )
  ) {
    return 'longhaul';
  }
  if (
    /대만|taiwan|홍콩|hong kong|마카오|macau|중국|china|상하이|베이징/.test(blob)
  ) {
    return 'family';
  }
  return null;
}

/**
 * 패키지 탭 노출 — 스캔 중 제외 · 국내는 제주 등 키워드 있을 때만.
 * @param {object|null|undefined} location
 * @returns {boolean}
 */
export function canShowMrtPackageStrip(location) {
  if (!location || location.isScanning) return false;
  const keyword = resolveMrtPackageSearchKeyword(location);
  if (!keyword) return false;
  if (isMrtDomesticLocation(location)) {
    const blob = `${keyword} ${location.slug || ''} ${location.name_en || ''}`.toLowerCase();
    return /제주|jeju|부산|busan|서울|seoul|강원|경주|전주|여수|거제/.test(blob);
  }
  return true;
}
