import { festivalLngLat } from './koreaFestivalCorridors.js';

const SIDO_RE =
  /^(?:서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원특별자치도|강원도|충청북도|충청남도|전북특별자치도|전라북도|전라남도|경상북도|경상남도|제주특별자치도|제주도)$/u;

/**
 * 네이버 지도는 축제명보다 장소·주소에 핀이 맞는다.
 * 행사장소에서 공원·시설명만 고르고, 없으면 도로명 주소로 연다.
 */

function plain(raw) {
  return String(raw || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function coreName(raw) {
  return plain(raw)
    .replace(/^(?:19|20)\d{2}\s*년?\s*/u, '')
    .replace(/^제?\s*\d{1,3}\s*회\s*/u, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function cleanFestivalMapAddress(addr) {
  return plain(addr).replace(/\s*\([^)]{0,16}(?:동|리|가)\)\s*$/u, '').trim();
}

function adminParts(addr) {
  const parts = cleanFestivalMapAddress(addr).split(' ').filter(Boolean);
  let sido = '';
  let sigungu = '';
  let index = 0;
  if (parts[0] && SIDO_RE.test(parts[0])) {
    sido = parts[0];
    index = 1;
  }
  if (parts[index] && /^[가-힣]{1,12}(?:시|군|구)$/u.test(parts[index])) {
    sigungu = parts[index];
  }
  return { sido, sigungu };
}

function sidoStem(sido) {
  return String(sido || '')
    .replace(/특별자치시|특별자치도|특별시|광역시/u, '')
    .replace(/도$/u, '');
}

function isRoadOnly(seg) {
  return /(?:대로|로|길)(?:\s*\d+(?:-\d+)?)?$/u.test(seg);
}

function isAdminToken(part) {
  if (SIDO_RE.test(part)) return true;
  if (/^[가-힣]{1,12}(?:시|군|구|동|읍|면|리)$/u.test(part)) return true;
  return part.length <= 4 && !/(?:공원|광장|경기장|시장|마을|해변|홀|성|궁)/u.test(part);
}

function isVague(seg) {
  const compact = seg.replace(/\s+/g, '');
  if (!compact || compact.length < 2) return true;
  if (/^(?:일대|일원|인근|부근|주변)$/u.test(compact)) return true;
  if (/(?:일대|일원|인근|부근|주변)$/u.test(seg) && seg.length <= 10) return true;
  const parts = seg.split(' ').filter(Boolean);
  if (parts.length && parts.every(isAdminToken)) return true;
  return false;
}

function looksLikeStreetAddress(text) {
  const first = text.split(' ')[0] || '';
  if (SIDO_RE.test(first)) return true;
  return /(?:로|길|대로)\s*\d+/u.test(text);
}

function venueFromEventplace(eventplace, title, addr) {
  const text = plain(eventplace);
  if (!text) return '';
  const titleCore = coreName(title);
  if (titleCore && coreName(text) === titleCore) return '';
  const addrClean = cleanFestivalMapAddress(addr);
  if (addrClean && coreName(text) === coreName(addrClean)) return '';
  if (text.length > 48) return '';
  if (
    looksLikeStreetAddress(text) &&
    !/(?:공원|광장|경기장|해수욕장|해변|시장|마을|박물관|미술관)/u.test(text)
  ) {
    return '';
  }

  const segments = text
    .split(/\s*(?:,|&|·|\/|및)\s*/u)
    .map((part) => part.replace(/\s*(?:일대|일원|인근|부근|주변)\s*$/u, '').trim())
    .filter(Boolean);

  for (const seg of segments) {
    if (isVague(seg) || isRoadOnly(seg)) continue;
    if (titleCore && coreName(seg) === titleCore) continue;
    return seg;
  }
  return '';
}

export function festivalNaverMapQuery({ addr1, eventplace, title } = {}) {
  const addr = cleanFestivalMapAddress(addr1);
  const venue = venueFromEventplace(eventplace, title, addr1);
  if (!venue) return addr;

  const { sido, sigungu } = adminParts(addr1);
  const bits = [];
  const sidoKey = sidoStem(sido);
  if (sido && sidoKey && !venue.includes(sidoKey)) bits.push(sido);
  if (sigungu) {
    const stem = sigungu.replace(/(?:시|군|구)$/u, '');
    if (stem && !venue.includes(stem)) bits.push(sigungu);
  }
  bits.push(venue);
  return bits.join(' ');
}

export function festivalNaverMapUrl({ addr1, eventplace, title, mapx, mapy } = {}) {
  const query = festivalNaverMapQuery({ addr1, eventplace, title });
  if (!query) return '';
  const search = encodeURIComponent(query);
  const pt = festivalLngLat(mapx, mapy);
  if (pt) {
    return `https://map.naver.com/p/search/${search}?c=${pt.lng},${pt.lat},16,0,0,0,dh`;
  }
  return `https://map.naver.com/p/search/${search}`;
}
