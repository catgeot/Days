/**
 * One domestic departure chip per 시·도 (17).
 * Every label is a city. 도 names are not mixed with city names.
 * 경기 수원, 충남 천안, 전북 전주, 경북 포항, 경남 창원, 강원 강릉, 전남 여수, 충북 청주.
 * Those cities are the rail or bus hub, not a small airport for the whole 도.
 * No IATA on these chips. Domestic routing is stations and terminals.
 * Airport codes stay on overseas flight asks only.
 *
 * Same city swaps the representative instead of hiding the chip.
 * 강릉 → 원주 (원주역·만종역, the other 강원 KTX city). 춘천 is ITX-청춘 only.
 * 창원·마산 → 진주 (진주역). 김해 is the airport town next to 부산, so it is not the swap.
 */
export const FESTIVAL_DOMESTIC_ORIGINS = [
  { id: 'seoul', ko: '서울', en: 'Seoul', province: '서울', stationsKo: '서울역·용산역·수서역', stationsEn: 'Seoul Station, Yongsan Station, and Suseo Station' },
  { id: 'busan', ko: '부산', en: 'Busan', province: '부산', stationsKo: '부산역·부산종합버스터미널', stationsEn: 'Busan Station and Busan Central Bus Terminal' },
  { id: 'daegu', ko: '대구', en: 'Daegu', province: '대구', stationsKo: '동대구역·대구역', stationsEn: 'Dongdaegu Station and Daegu Station' },
  { id: 'incheon', ko: '인천', en: 'Incheon', province: '인천', stationsKo: '인천종합버스터미널·부평역', stationsEn: 'Incheon Bus Terminal and Bupyeong Station' },
  { id: 'gwangju', ko: '광주', en: 'Gwangju', province: '광주', stationsKo: '광주송정역·유스퀘어', stationsEn: 'Gwangju Songjeong Station and U-Square' },
  { id: 'daejeon', ko: '대전', en: 'Daejeon', province: '대전', stationsKo: '대전역·대전복합터미널', stationsEn: 'Daejeon Station and Daejeon Complex Terminal' },
  { id: 'ulsan', ko: '울산', en: 'Ulsan', province: '울산', stationsKo: '태화강역·울산고속버스터미널', stationsEn: 'Taehwagang Station and Ulsan Express Bus Terminal' },
  { id: 'sejong', ko: '세종', en: 'Sejong', province: '세종', stationsKo: '세종고속시외버스터미널·오송역', stationsEn: 'Sejong Express Bus Terminal and Osong Station' },
  {
    id: 'gyeonggi', ko: '수원', en: 'Suwon', province: '경기',
    stationsKo: '수원역·수원종합버스터미널', stationsEn: 'Suwon Station and Suwon Bus Terminal',
    alt: { ko: '성남', en: 'Seongnam', stationsKo: '성남종합버스터미널', stationsEn: 'Seongnam Bus Terminal' },
  },
  {
    id: 'gangwon', ko: '강릉', en: 'Gangneung', province: '강원',
    stationsKo: '강릉역·강릉고속버스터미널', stationsEn: 'Gangneung Station and Gangneung Express Bus Terminal',
    alt: { ko: '원주', en: 'Wonju', stationsKo: '원주역·만종역', stationsEn: 'Wonju Station and Manjong Station' },
  },
  {
    id: 'chungbuk', ko: '청주', en: 'Cheongju', province: '충북',
    stationsKo: '오송역·청주고속버스터미널', stationsEn: 'Osong Station and Cheongju Express Bus Terminal',
    alt: { ko: '충주', en: 'Chungju', stationsKo: '충주역·충주고속버스터미널', stationsEn: 'Chungju Station and Chungju Express Bus Terminal' },
  },
  {
    id: 'chungnam', ko: '천안', en: 'Cheonan', province: '충남',
    stationsKo: '천안아산역·천안종합터미널', stationsEn: 'Cheonan-Asan Station and Cheonan Terminal',
    alt: { ko: '공주', en: 'Gongju', stationsKo: '공주종합버스터미널', stationsEn: 'Gongju Bus Terminal' },
  },
  {
    id: 'jeonbuk', ko: '전주', en: 'Jeonju', province: '전북',
    stationsKo: '전주역·전주고속버스터미널', stationsEn: 'Jeonju Station and Jeonju Express Bus Terminal',
    alt: { ko: '익산', en: 'Iksan', stationsKo: '익산역', stationsEn: 'Iksan Station' },
  },
  {
    id: 'jeonnam', ko: '여수', en: 'Yeosu', province: '전남',
    stationsKo: '여수EXPO역·여수종합버스터미널', stationsEn: 'Yeosu EXPO Station and Yeosu Bus Terminal',
    alt: { ko: '목포', en: 'Mokpo', stationsKo: '목포역·목포종합버스터미널', stationsEn: 'Mokpo Station and Mokpo Bus Terminal' },
  },
  {
    id: 'gyeongbuk', ko: '포항', en: 'Pohang', province: '경북',
    stationsKo: '포항역·포항고속버스터미널', stationsEn: 'Pohang Station and Pohang Express Bus Terminal',
    alt: { ko: '안동', en: 'Andong', stationsKo: '안동역·안동터미널', stationsEn: 'Andong Station and Andong Terminal' },
  },
  {
    id: 'gyeongnam', ko: '창원', en: 'Changwon', province: '경남', also: ['마산'],
    stationsKo: '창원중앙역·마산역', stationsEn: 'Changwon Jungang Station and Masan Station',
    alt: { ko: '진주', en: 'Jinju', stationsKo: '진주역·진주종합버스터미널', stationsEn: 'Jinju Station and Jinju Bus Terminal' },
  },
  {
    id: 'jeju', ko: '제주', en: 'Jeju', province: '제주',
    stationsKo: '제주항·제주버스터미널', stationsEn: 'Jeju Port and Jeju Bus Terminal',
    alt: { ko: '서귀포', en: 'Seogwipo', stationsKo: '서귀포항', stationsEn: 'Seogwipo Port' },
  },
];

const PROVINCE_ONLY_LABELS = new Set(['경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남']);

function isEnglishLocale(locale) {
  return String(locale || '').slice(0, 2) === 'en';
}

export function findFestivalDomesticOrigin(id) {
  const key = String(id || '').trim();
  if (!key) return null;
  return FESTIVAL_DOMESTIC_ORIGINS.find((item) => item.id === key) || null;
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

function hostTokens(places) {
  const tokens = new Set();
  for (const place of places) {
    const whole = normalizeFestivalCityToken(place);
    if (whole) tokens.add(whole);
    for (const token of cityTokensFromAdminText(place)) tokens.add(token);
  }
  return tokens;
}

function rowIsHost(row, tokens, blob) {
  if (tokens.has(normalizeFestivalCityToken(row.ko))) return true;
  for (const alias of row.also || []) {
    const token = normalizeFestivalCityToken(alias);
    if (tokens.has(token) || blob.includes(alias)) return true;
  }
  return false;
}

function withAlt(row) {
  if (!row.alt) return row;
  return {
    ...row,
    ko: row.alt.ko,
    en: row.alt.en,
    stationsKo: row.alt.stationsKo,
    stationsEn: row.alt.stationsEn,
    swapped: true,
  };
}

/** Swap the host city (or 마산 for 창원) to the other city in that 시·도. Never drop the chip. */
export function visibleFestivalDomesticOrigins(...places) {
  const tokens = hostTokens(places);
  const blob = places.join(' ');
  return FESTIVAL_DOMESTIC_ORIGINS.map((row) => (rowIsHost(row, tokens, blob) ? withAlt(row) : row));
}

export function festivalOriginLabel(rowOrId, locale = 'ko') {
  const row = typeof rowOrId === 'object' && rowOrId
    ? rowOrId
    : findFestivalDomesticOrigin(rowOrId);
  const en = isEnglishLocale(locale);
  if (!row) {
    const code = String(rowOrId || '').trim();
    return en ? code : code;
  }
  return en ? row.en : row.ko;
}

export function buildFestivalAccessAskText(rowOrId, locale = 'ko') {
  const row = typeof rowOrId === 'object' && rowOrId
    ? rowOrId
    : findFestivalDomesticOrigin(rowOrId);
  if (!row) return '';
  const en = isEnglishLocale(locale);
  const place = en ? row.en : row.ko;
  const stations = en ? row.stationsEn : row.stationsKo;
  if (en) return `How do I get from ${place} (${stations}) to this festival by public transit and by car?`;
  return `${place}(${stations})에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘`;
}

function originByLabel(label) {
  const token = normalizeFestivalCityToken(label);
  if (!token) return null;
  for (const row of FESTIVAL_DOMESTIC_ORIGINS) {
    if (normalizeFestivalCityToken(row.ko) === token || normalizeFestivalCityToken(row.en) === token) return row;
    if (row.alt && (normalizeFestivalCityToken(row.alt.ko) === token || normalizeFestivalCityToken(row.alt.en) === token)) {
      return withAlt(row);
    }
  }
  return null;
}

/**
 * Domestic festival access is ground transport. Returns the city row, or null for an airport ask.
 * @param {string} text
 * @param {string} [explicitLabel]
 */
export function domesticFestivalGroundOrigin(text, explicitLabel = '') {
  const raw = String(text || '');
  if (/항공|비행|flight|공항|airport/i.test(raw)) return null;
  const fromLabel = originByLabel(explicitLabel);
  if (fromLabel) return fromLabel;
  const head = raw.match(/^(.{1,20}?)에서/u);
  return originByLabel(head?.[1] || '') || null;
}

/** Drop airport fields so a domestic chip does not send IATA to Edge. */
export function clearDomesticAirportDeparture(session) {
  if (!session || typeof session !== 'object') return session;
  session.departureIata = '';
  session.departureAirportLabel = '';
  return session;
}

export function domesticGroundModelSuffix(row, locale = 'ko') {
  if (!row) return '';
  if (isEnglishLocale(locale)) {
    return `Use rail and bus from ${row.stationsEn}. Do not use an airport code.`;
  }
  return `출발 역·터미널은 ${row.stationsKo}이다. 공항 코드는 쓰지 않는다.`;
}

export function festivalDomesticLabelsAreCities(rows = FESTIVAL_DOMESTIC_ORIGINS) {
  return rows.every((row) => row.ko && !PROVINCE_ONLY_LABELS.has(row.ko) && !row.iata);
}
