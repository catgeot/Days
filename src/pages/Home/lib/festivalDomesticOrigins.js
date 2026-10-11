/**
 * One departure chip per 시·도 (17).
 * ICN is 인천 — the airport is in Incheon, so the chip is not labeled 서울.
 * 서울 uses GMP (Gimpo Airport is in Seoul) so the two chips do not share a code.
 * Typed «서울» still maps to ICN in resolveDepartureIataFromChat; a chip tap passes its label.
 * 강릉·청주·여수 stand for 강원·충북·전남. 김포·원주 are not separate chips (same 시·도 as 서울·강릉).
 */
export const FESTIVAL_DOMESTIC_ORIGINS = [
  { id: 'seoul', iata: 'GMP', ko: '서울', en: 'Seoul', province: '서울' },
  { id: 'busan', iata: 'PUS', ko: '부산', en: 'Busan', province: '부산' },
  { id: 'daegu', iata: 'TAE', ko: '대구', en: 'Daegu', province: '대구' },
  { id: 'incheon', iata: 'ICN', ko: '인천', en: 'Incheon', province: '인천' },
  { id: 'gwangju', iata: 'KWJ', ko: '광주', en: 'Gwangju', province: '광주' },
  { id: 'daejeon', iata: '', ko: '대전', en: 'Daejeon', province: '대전' },
  { id: 'ulsan', iata: 'USN', ko: '울산', en: 'Ulsan', province: '울산' },
  { id: 'sejong', iata: '', ko: '세종', en: 'Sejong', province: '세종' },
  { id: 'gyeonggi', iata: '', ko: '경기', en: 'Gyeonggi', province: '경기' },
  { id: 'gangneung', iata: 'KAG', ko: '강릉', en: 'Gangneung', province: '강원' },
  { id: 'cheongju', iata: 'CJJ', ko: '청주', en: 'Cheongju', province: '충북' },
  { id: 'chungnam', iata: '', ko: '충남', en: 'Chungnam', province: '충남' },
  { id: 'jeonbuk', iata: 'KUV', ko: '전북', en: 'Jeonbuk', province: '전북' },
  { id: 'yeosu', iata: 'RSU', ko: '여수', en: 'Yeosu', province: '전남' },
  { id: 'gyeongbuk', iata: 'KPO', ko: '경북', en: 'Gyeongbuk', province: '경북' },
  { id: 'gyeongnam', iata: 'HIN', ko: '경남', en: 'Gyeongnam', province: '경남' },
  { id: 'jeju', iata: 'CJU', ko: '제주', en: 'Jeju', province: '제주' },
];

export function findFestivalDomesticOrigin(idOrIata) {
  const key = String(idOrIata || '').trim();
  if (!key) return null;
  const upper = key.toUpperCase();
  return FESTIVAL_DOMESTIC_ORIGINS.find((item) => item.id === key || (item.iata && item.iata === upper)) || null;
}

/** 강릉시·경기도 → 강릉·경기. */
export function normalizeFestivalCityToken(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/(?:특별자치시|특별자치도|특별시|광역시)$/u, '')
    .replace(/(?:시|군|구|도)$/u, '');
}

function cityTokensFromAdminText(value) {
  const raw = String(value || '');
  const out = [];
  const re = /([가-힣]{2,}?)(?:특별자치시|특별시|광역시|시|군)/g;
  for (const match of raw.matchAll(re)) {
    const token = normalizeFestivalCityToken(match[1]);
    if (token) out.push(token);
  }
  return out;
}

/** Hide the chip whose label is the festival city (강릉 축제 → no 강릉 chip). */
export function visibleFestivalDomesticOrigins(...places) {
  const tokens = new Set();
  for (const place of places) {
    const whole = normalizeFestivalCityToken(place);
    if (whole && FESTIVAL_DOMESTIC_ORIGINS.some((row) => normalizeFestivalCityToken(row.ko) === whole)) {
      tokens.add(whole);
    }
    for (const token of cityTokensFromAdminText(place)) {
      if (FESTIVAL_DOMESTIC_ORIGINS.some((row) => normalizeFestivalCityToken(row.ko) === token)) {
        tokens.add(token);
      }
    }
  }
  if (!tokens.size) return FESTIVAL_DOMESTIC_ORIGINS;
  return FESTIVAL_DOMESTIC_ORIGINS.filter((row) => !tokens.has(normalizeFestivalCityToken(row.ko)));
}

export function festivalOriginLabel(idOrIata, locale = 'ko') {
  const row = findFestivalDomesticOrigin(idOrIata);
  const en = String(locale || '').slice(0, 2) === 'en';
  if (!row) {
    const code = String(idOrIata || '').trim();
    return en ? code.toUpperCase() : code;
  }
  return en ? row.en : row.ko;
}

export function buildFestivalAccessAskText(idOrIata, locale = 'ko') {
  const place = festivalOriginLabel(idOrIata, locale);
  const en = String(locale || '').slice(0, 2) === 'en';
  if (en) return `How do I get from ${place} to this festival by public transit and by car?`;
  return `${place}에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘`;
}
