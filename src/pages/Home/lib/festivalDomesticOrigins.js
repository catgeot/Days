/**
 * One domestic departure chip per 시·도 (17).
 * Every label is a city. 도 names are not mixed with city names.
 * `ktx*` / `srt*` = 출발 칩 힌트용. 수도권만 KTX·SRT 역이 다르고, 그 외는 같은 역이면 한 줄로 안내한다.
 * `bus*` = 고속·시외버스 터미널. `flight*` = 제주 등 항공 안내.
 */
export const FESTIVAL_DOMESTIC_ORIGINS = [
  {
    id: 'seoul', ko: '서울', en: 'Seoul', province: '서울',
    ktxKo: '서울역·용산역·광명역', ktxEn: 'Seoul Station, Yongsan Station, and Gwangmyeong Station',
    srtKo: '수서역', srtEn: 'Suseo Station',
    busKo: '서울고속버스터미널·동서울종합터미널', busEn: 'Seoul Express Bus Terminal and Dong Seoul Bus Terminal',
  },
  {
    id: 'busan', ko: '부산', en: 'Busan', province: '부산',
    ktxKo: '부산역', ktxEn: 'Busan Station',
    srtKo: '부산역', srtEn: 'Busan Station',
    busKo: '부산종합버스터미널', busEn: 'Busan Central Bus Terminal',
  },
  {
    id: 'daegu', ko: '대구', en: 'Daegu', province: '대구',
    ktxKo: '동대구역', ktxEn: 'Dongdaegu Station',
    srtKo: '동대구역', srtEn: 'Dongdaegu Station',
    busKo: '대구고속버스터미널', busEn: 'Daegu Express Bus Terminal',
  },
  {
    id: 'incheon', ko: '인천', en: 'Incheon', province: '인천',
    ktxKo: '서울역·용산역·광명역', ktxEn: 'Seoul Station, Yongsan Station, and Gwangmyeong Station',
    srtKo: '수서역', srtEn: 'Suseo Station',
    busKo: '인천종합버스터미널', busEn: 'Incheon Bus Terminal',
  },
  {
    id: 'gwangju', ko: '광주', en: 'Gwangju', province: '광주',
    ktxKo: '광주송정역', ktxEn: 'Gwangju Songjeong Station',
    srtKo: '광주송정역', srtEn: 'Gwangju Songjeong Station',
    busKo: '유스퀘어', busEn: 'U-Square terminal',
  },
  {
    id: 'daejeon', ko: '대전', en: 'Daejeon', province: '대전',
    ktxKo: '대전역', ktxEn: 'Daejeon Station',
    srtKo: '대전역', srtEn: 'Daejeon Station',
    busKo: '대전복합터미널', busEn: 'Daejeon Complex Terminal',
  },
  {
    id: 'ulsan', ko: '울산', en: 'Ulsan', province: '울산',
    ktxKo: '태화강역', ktxEn: 'Taehwagang Station',
    srtKo: '울산역', srtEn: 'Ulsan Station',
    busKo: '울산고속버스터미널', busEn: 'Ulsan Express Bus Terminal',
  },
  {
    id: 'sejong', ko: '세종', en: 'Sejong', province: '세종',
    ktxKo: '오송역', ktxEn: 'Osong Station',
    srtKo: '오송역', srtEn: 'Osong Station',
    busKo: '세종고속시외버스터미널', busEn: 'Sejong Express Bus Terminal',
  },
  {
    id: 'gyeonggi', ko: '수원', en: 'Suwon', province: '경기',
    ktxKo: '수원역·광명역', ktxEn: 'Suwon Station and Gwangmyeong Station',
    srtKo: '수서역', srtEn: 'Suseo Station',
    busKo: '수원종합버스터미널', busEn: 'Suwon Bus Terminal',
    alt: {
      ko: '성남', en: 'Seongnam',
      ktxKo: '광명역', ktxEn: 'Gwangmyeong Station',
      srtKo: '수서역', srtEn: 'Suseo Station',
      busKo: '성남종합버스터미널', busEn: 'Seongnam Bus Terminal',
    },
  },
  {
    id: 'gangwon', ko: '강릉', en: 'Gangneung', province: '강원',
    ktxKo: '강릉역', ktxEn: 'Gangneung Station',
    busKo: '강릉고속버스터미널·동서울종합터미널', busEn: 'Gangneung Express Bus Terminal and Dong Seoul Bus Terminal',
    alt: {
      ko: '원주', en: 'Wonju',
      ktxKo: '원주역·만종역', ktxEn: 'Wonju Station and Manjong Station',
      busKo: '원주시외버스터미널', busEn: 'Wonju intercity bus terminal',
    },
  },
  {
    id: 'chungbuk', ko: '청주', en: 'Cheongju', province: '충북',
    ktxKo: '오송역', ktxEn: 'Osong Station',
    srtKo: '오송역', srtEn: 'Osong Station',
    busKo: '청주고속버스터미널', busEn: 'Cheongju Express Bus Terminal',
    alt: {
      ko: '충주', en: 'Chungju',
      ktxKo: '충주역', ktxEn: 'Chungju Station',
      busKo: '충주고속버스터미널', busEn: 'Chungju Express Bus Terminal',
    },
  },
  {
    id: 'chungnam', ko: '천안', en: 'Cheonan', province: '충남',
    ktxKo: '천안아산역', ktxEn: 'Cheonan-Asan Station',
    srtKo: '천안아산역', srtEn: 'Cheonan-Asan Station',
    busKo: '천안종합터미널', busEn: 'Cheonan Terminal',
    alt: {
      ko: '공주', en: 'Gongju',
      ktxKo: '오송역', ktxEn: 'Osong Station',
      srtKo: '오송역', srtEn: 'Osong Station',
      busKo: '공주종합버스터미널', busEn: 'Gongju Bus Terminal',
    },
  },
  {
    id: 'jeonbuk', ko: '전주', en: 'Jeonju', province: '전북',
    ktxKo: '익산역·전주역', ktxEn: 'Iksan Station and Jeonju Station',
    srtKo: '익산역', srtEn: 'Iksan Station',
    busKo: '전주고속버스터미널', busEn: 'Jeonju Express Bus Terminal',
    alt: {
      ko: '익산', en: 'Iksan',
      ktxKo: '익산역', ktxEn: 'Iksan Station',
      srtKo: '익산역', srtEn: 'Iksan Station',
      busKo: '익산버스터미널', busEn: 'Iksan bus terminal',
    },
  },
  {
    id: 'jeonnam', ko: '여수', en: 'Yeosu', province: '전남',
    ktxKo: '여수EXPO역', ktxEn: 'Yeosu EXPO Station',
    busKo: '여수종합버스터미널', busEn: 'Yeosu Bus Terminal',
    alt: {
      ko: '목포', en: 'Mokpo',
      ktxKo: '목포역', ktxEn: 'Mokpo Station',
      srtKo: '목포역', srtEn: 'Mokpo Station',
      busKo: '목포종합버스터미널', busEn: 'Mokpo Bus Terminal',
    },
  },
  {
    id: 'gyeongbuk', ko: '포항', en: 'Pohang', province: '경북',
    ktxKo: '포항역·동대구역', ktxEn: 'Pohang Station and Dongdaegu Station',
    busKo: '포항고속버스터미널', busEn: 'Pohang Express Bus Terminal',
    alt: {
      ko: '안동', en: 'Andong',
      ktxKo: '안동역', ktxEn: 'Andong Station',
      busKo: '안동터미널', busEn: 'Andong Terminal',
    },
  },
  {
    id: 'gyeongnam', ko: '창원', en: 'Changwon', province: '경남', also: ['마산'],
    ktxKo: '마산역·창원중앙역', ktxEn: 'Masan Station and Changwon Jungang Station',
    busKo: '창원·마산 시외버스터미널', busEn: 'Changwon and Masan bus terminals',
    alt: {
      ko: '진주', en: 'Jinju',
      ktxKo: '진주역', ktxEn: 'Jinju Station',
      busKo: '진주종합버스터미널', busEn: 'Jinju Bus Terminal',
    },
  },
  {
    id: 'jeju', ko: '제주', en: 'Jeju', province: '제주',
    flightKo: '김포·인천·부산 등 본토 공항 국내선', flightEn: 'mainland airports such as Gimpo, Incheon, and Busan',
    busKo: '제주버스터미널', busEn: 'Jeju Bus Terminal',
    alt: {
      ko: '서귀포', en: 'Seogwipo',
      flightKo: '김포·인천·부산 등 본토 공항 국내선', flightEn: 'mainland airports such as Gimpo, Incheon, and Busan',
      busKo: '서귀포 시내·제주버스터미널', busEn: 'Seogwipo and Jeju bus terminals',
    },
  },
];

const PROVINCE_ONLY_LABELS = new Set(['경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남']);

function isEnglishLocale(locale) {
  return String(locale || '').slice(0, 2) === 'en';
}

function mergeAltHub(row, alt) {
  return {
    ktxKo: alt.ktxKo ?? row.ktxKo,
    ktxEn: alt.ktxEn ?? row.ktxEn,
    srtKo: alt.srtKo ?? row.srtKo,
    srtEn: alt.srtEn ?? row.srtEn,
    busKo: alt.busKo ?? row.busKo,
    busEn: alt.busEn ?? row.busEn,
    flightKo: alt.flightKo ?? row.flightKo,
    flightEn: alt.flightEn ?? row.flightEn,
  };
}

export function findFestivalDomesticOrigin(id) {
  const key = String(id || '').trim();
  if (!key) return null;
  return FESTIVAL_DOMESTIC_ORIGINS.find((item) => item.id === key) || null;
}

export function originHubStationBlob(row) {
  if (!row) return '';
  return [row.ktxKo, row.srtKo, row.busKo].filter(Boolean).join('·');
}

const CAPITAL_ORIGIN_IDS = new Set(['seoul', 'incheon', 'gyeonggi']);

export function formatOriginHubGuidance(row, locale = 'ko') {
  if (!row) return '';
  const en = isEnglishLocale(locale);
  const capital = CAPITAL_ORIGIN_IDS.has(row.id);
  if (en) {
    const bits = [];
    if (capital) {
      bits.push('Guide KTX from Seoul Station, Yongsan Station, and Gwangmyeong Station');
      bits.push('Guide SRT from Suseo Station (also Dongtan and Pyeongtaek Jije when relevant). No SRT from Gwangmyeong or Yongsan');
      if (row.id === 'incheon') {
        bits.push('Incheon Station KTX is planned for the first half of 2027 — for now, lead with KTX from Seoul Station, Yongsan Station, or Gwangmyeong Station');
      }
    } else if (row.ktxEn && row.srtEn) {
      const same = row.ktxEn === row.srtEn;
      if (same) bits.push(`Guide KTX and SRT from ${row.ktxEn}`);
      else {
        bits.push(`Guide KTX from ${row.ktxEn}`);
        bits.push(`Guide SRT from ${row.srtEn}`);
      }
    } else if (row.ktxEn) bits.push(`Guide KTX from ${row.ktxEn}`);
    else if (row.srtEn) bits.push(`Guide SRT from ${row.srtEn}`);
    if (row.busEn) bits.push(`express and intercity buses from ${row.busEn}`);
    if (row.flightEn) bits.push(`flights from ${row.flightEn}`);
    return bits.join('. ') + (bits.length ? '.' : '');
  }
  const bits = [];
  if (capital) {
    bits.push('KTX는 서울역·용산역·광명역에서 출발하도록 안내해 주세요');
    bits.push('SRT는 수서역(동탄·평택지제도 가능)에서 출발하도록 안내해 주세요. 광명·용산에서는 SRT가 없습니다');
    if (row.id === 'incheon') {
      bits.push('인천역 KTX는 2027년 상반기 예정이라, 지금은 서울역·용산역·광명역에서 KTX를 타는 경로를 먼저 자연스럽게 안내해 주세요');
    }
  } else if (row.ktxKo && row.srtKo) {
    const same = row.ktxKo === row.srtKo;
    if (same) bits.push(`KTX·SRT는 ${row.ktxKo}에서 출발하도록 안내해 주세요`);
    else {
      bits.push(`KTX는 ${row.ktxKo}에서 출발하도록 안내해 주세요`);
      bits.push(`SRT는 ${row.srtKo}에서 출발하도록 안내해 주세요`);
    }
  } else if (row.ktxKo) bits.push(`KTX는 ${row.ktxKo}에서 출발하도록 안내해 주세요`);
  else if (row.srtKo) bits.push(`SRT는 ${row.srtKo}에서 출발하도록 안내해 주세요`);
  if (row.busKo) bits.push(`고속·시외버스는 ${row.busKo}에서 출발하도록 안내해 주세요`);
  if (row.flightKo) bits.push(`항공은 ${row.flightKo}을 이용하도록 안내해 주세요`);
  return bits.join('. ') + (bits.length ? '.' : '');
}

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
  const hubs = mergeAltHub(row, row.alt);
  return {
    ...row,
    ...hubs,
    ko: row.alt.ko,
    en: row.alt.en,
    swapped: true,
  };
}

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
  if (en) {
    return `How do I get from ${place} to this festival by public transit and by car?`;
  }
  return `${place}에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘`;
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

export function domesticFestivalGroundOrigin(text, explicitLabel = '') {
  const raw = String(text || '');
  if (/항공|비행|flight|공항|airport/i.test(raw)) return null;
  const fromLabel = originByLabel(explicitLabel);
  if (fromLabel) return fromLabel;
  const head = raw.match(/^(.{1,20}?)에서/u);
  return originByLabel(head?.[1] || '') || null;
}

export function clearDomesticAirportDeparture(session) {
  if (!session || typeof session !== 'object') return session;
  session.departureIata = '';
  session.departureAirportLabel = '';
  session.arrivalIata = '';
  session.arrivalAirportLabel = '';
  session.flightNumber = '';
  return session;
}

export function domesticGroundModelSuffix(row, locale = 'ko') {
  if (!row) return '';
  const guidance = formatOriginHubGuidance(row, locale);
  if (!guidance) return '';
  if (isEnglishLocale(locale)) {
    return `Departure area: ${row.en}. ${guidance}`;
  }
  return `출발 지역은 ${row.ko}. ${guidance}`;
}

export function festivalDomesticLabelsAreCities(rows = FESTIVAL_DOMESTIC_ORIGINS) {
  return rows.every((row) => row.ko && !PROVINCE_ONLY_LABELS.has(row.ko) && !row.iata);
}
