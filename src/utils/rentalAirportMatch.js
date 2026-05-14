import { RENTAL_AIRPORT_HUBS, DEFAULT_HUB_RADIUS_KM } from './rentalAirportHubs.js';

const toRad = (d) => (d * Math.PI) / 180;

export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MIN_ALIAS_LEN = 4;

/**
 * 렌터카 링크와 별개로, 플래너 상단에 둘 이상의 도착 공항을 안내할 여행지.
 * `phrases` 중 하나가 slug·이름(한/영)에 부분 일치하면 적용됩니다. 더 구체적인 행을 위에 둡니다.
 *
 * @typedef {{ phrases: string[], iataCodes: string[], preferredLinkIata?: string, bannerNote?: string }} RentalMultiAirportRow
 */

/** @type {RentalMultiAirportRow[]} */
export const RENTAL_MULTI_AIRPORT_DESTINATIONS = [
  {
    phrases: ['lofoten', '로포텐', 'lofoten islands', 'moskenes', '모스케네스', 'reine', '레이네', 'vesteralen', '베스테란'],
    iataCodes: ['BOO', 'EVE', 'LKN', 'SVJ'],
    preferredLinkIata: 'EVE',
    bannerNote:
      '로포텐으로 가는 항로는 공항마다 역할이 다릅니다. 레크네스(LKN)·스볼바어(SVJ)는 군도 위 공항이라, 국내선 등으로 섬에 직접 도착한 뒤 렌터카·이동을 이어가기 좋습니다. 이베네스(EVE)는 본토(하르스타드·나르비크) 쪽 관문으로 국제·국내 대형 노선이 많고, 차나 버스로 로포텐으로 들어오는 일정이 흔합니다. 보되(BOO)는 로포텐 남쪽 본토에서 페리(예: 보되–모스케네스)나 국내선으로 군도에 이어질 때 자주 쓰입니다. 실제 티켓·일정에 적힌 도착 공항(IATA)을 확인한 뒤, 아래 제휴 링크 검색어도 그 공항에 맞춰 바꿔 주세요.'
  },
  {
    phrases: [
      'cappadocia',
      '카파도키아',
      'kapadokya',
      'goreme',
      'göreme',
      '괴레메',
      'nevsehir',
      'nevşehir',
      '네브셰히르',
      'urgup',
      'ürgüp',
      'uchisar',
      '우치사르',
      'avanos',
      '아바노스'
    ],
    iataCodes: ['ASR', 'NAV'],
    preferredLinkIata: 'ASR'
  },
  {
    phrases: ['tokyo', '도쿄', 'shibuya', '시부야', 'shinjuku', '신주쿠', 'ikebukuro', '이케부쿠로'],
    iataCodes: ['HND', 'NRT'],
    preferredLinkIata: 'HND'
  },
  {
    phrases: ['bangkok', '방콕', 'suvarnabhumi', '수완나품', 'don mueang', '돈므앙'],
    iataCodes: ['BKK', 'DMK'],
    preferredLinkIata: 'BKK'
  },
  {
    phrases: ['paris', '파리'],
    iataCodes: ['CDG', 'ORY'],
    preferredLinkIata: 'CDG'
  }
];

function locationHayForMultiMatch(location) {
  const slug = String(location.slug || '').toLowerCase();
  const name = String(location.name || '').toLowerCase();
  const nameEn = String(location.name_en || '').toLowerCase();
  return `${slug} ${name} ${nameEn}`.replace(/-/g, ' ');
}

/** @param {RentalMultiAirportRow} row */
function matchMultiAirportDestination(location, row) {
  const hay = locationHayForMultiMatch(location);
  for (const p of row.phrases) {
    const pl = p.toLowerCase();
    if (pl.length >= 2 && hay.includes(pl)) return true;
  }
  return false;
}

function hubByIata(iata) {
  return RENTAL_AIRPORT_HUBS.find((h) => h.iata === iata) || null;
}

/** 좌표가 어떤 허브 반경 안에 있으면 그중 최근접 허브 */
function nearestHubWithinRadius(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  let best = null;
  let bestD = Infinity;
  for (const hub of RENTAL_AIRPORT_HUBS) {
    const maxR = hub.radiusKm ?? DEFAULT_HUB_RADIUS_KM;
    const d = distanceKm(lat, lng, hub.lat, hub.lng);
    if (d <= maxR && d < bestD) {
      bestD = d;
      best = { officialKo: hub.officialKo, iata: hub.iata };
    }
  }
  return best;
}

function airportsFromIataCodes(iataCodes) {
  return iataCodes.map((code) => {
    const hub = hubByIata(code);
    return hub ? { officialKo: hub.officialKo, iata: hub.iata } : { officialKo: code, iata: code };
  });
}

/**
 * 다중 공항 행에 대해, 제휴 링크·배너에 쓸 단일 허브(최근접 또는 선호)를 고릅니다.
 * DB에 저장된 `rental_airport_*`가 다른 광역 허브로 잘못 잡혀 있어도, 좌표·다중 목록으로 보정합니다.
 *
 * @param {Record<string, unknown>} location
 * @param {RentalMultiAirportRow} row
 * @param {{ officialKo: string, iata: string }[]} airports
 */
function resolveLinkHubWithinMulti(location, row, airports) {
  const inferred = resolveRentalAirport(location, { ignoreStoredRentalAirport: true });
  if (inferred?.iata && row.iataCodes.includes(inferred.iata)) return inferred;

  const lat = typeof location.lat === 'number' ? location.lat : Number(location.lat);
  const lng = typeof location.lng === 'number' ? location.lng : Number(location.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    let best = null;
    let bestD = Infinity;
    for (const a of airports) {
      const hub = hubByIata(a.iata);
      if (!hub) continue;
      const d = distanceKm(lat, lng, hub.lat, hub.lng);
      if (d < bestD) {
        bestD = d;
        best = { officialKo: hub.officialKo, iata: hub.iata };
      }
    }
    if (best) return best;
  }

  const pref = row.preferredLinkIata || row.iataCodes[0];
  return airports.find((a) => a.iata === pref) || airports[0];
}

/**
 * 플래너 상단 「렌터카 · 픽업 기준」용: 단일 공항 또는 복수 도착 공항 안내.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @returns {{ kind: 'single', officialKo: string, iata: string | null } | { kind: 'multi', airports: { officialKo: string, iata: string }[], linkHub: { officialKo: string, iata: string }, bannerNote?: string } | null}
 */
export function resolveRentalPickupBannerInfo(location) {
  if (!location || typeof location !== 'object') return null;

  for (const row of RENTAL_MULTI_AIRPORT_DESTINATIONS) {
    if (!matchMultiAirportDestination(location, row)) continue;
    const airports = airportsFromIataCodes(row.iataCodes);
    const linkHub = resolveLinkHubWithinMulti(location, row, airports);
    return { kind: 'multi', airports, linkHub, bannerNote: row.bannerNote };
  }

  const single = resolveRentalAirport(location);
  if (!single?.officialKo) return null;
  return { kind: 'single', officialKo: single.officialKo, iata: single.iata };
}

/**
 * 항공권 검색 위젯: 도착지명·정식 공항명은 위젯에서 잘 안 잡히는 경우가 많아 IATA 3자 코드 검색을 권장합니다.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @returns {string}
 */
export function getFlightDestinationSearchHint(location) {
  const place =
    location && typeof location.name === 'string' && location.name.trim() ? location.name.trim() : '이 여행지';
  const info = resolveRentalPickupBannerInfo(location);

  if (!info) {
    return `${place}(여행지명)이나 공항 정식명만으로는 검색이 잘 안 될 때가 많습니다. 티켓·일정에 나온 도착 공항 3자리 IATA 코드(예: NRT, BKK)로 넣는 것을 권장합니다.`;
  }

  if (info.kind === 'multi') {
    const iatas = info.airports.map((a) => a.iata).filter(Boolean);
    const iataHint = iatas.length ? iatas.join(', ') : info.airports.map((a) => a.officialKo).join(' · ');
    if (iatas.length) {
      return `도착지명·정식 공항명은 잘 맞지 않는 경우가 많습니다. 목적지는 IATA 코드(${iataHint})로 검색해 보세요.`;
    }
    return `도착지명·정식 공항명은 잘 맞지 않는 경우가 많습니다. 해당 공항의 3자리 IATA 코드로 검색하는 편이 좋습니다.`;
  }

  const iata = info.iata;
  const officialKo = info.officialKo;
  if (iata) {
    return `도착지명·정식 공항명(예: ${officialKo})은 잘 안 될 때가 많습니다. 목적지는 ${iata}처럼 3자리 IATA 코드로 넣어 보세요.`;
  }

  return `${place}(여행지명)이나 공항명만으로는 검색이 제한될 수 있습니다. 알고 있다면 도착 공항 3자리 IATA 코드로 검색하는 편이 좋습니다.`;
}

/**
 * 공항 이동 카드·렌터카 홈 버튼 하단: 클룩에서 직접 검색할 때 3자리 코드 입력 안내.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @returns {string}
 */
export function getRentalCarHomeSearchSubtext(location) {
  const info = resolveRentalPickupBannerInfo(location);
  if (!info) {
    return '렌터카 검색 시 세자리 공항 코드(예: PDL)로 입력해 주세요.';
  }
  if (info.kind === 'multi') {
    const iatas = info.airports.map((a) => a.iata).filter(Boolean);
    if (iatas.length) {
      return `렌터카 검색 시 세자리 공항 코드(${iatas.join(', ')}) 중 하나로 입력해 주세요.`;
    }
    return '렌터카 검색 시 도착 공항 세자리 코드로 입력해 주세요.';
  }
  if (info.iata) {
    return `렌터카 검색 시 세자리 공항 코드(${info.iata})로 입력해 주세요.`;
  }
  return '렌터카 검색 시 세자리 공항 코드(예: PDL)로 입력해 주세요.';
}

/**
 * 여행지 객체로부터 렌터카 검색에 쓸 공항(한국어 공식명 + IATA)을 추론합니다.
 * 우선 좌표·반경으로 최근접 허브를 찾고, 실패 시 별칭 부분 문자열 매칭을 사용합니다.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ ignoreStoredRentalAirport?: boolean }} [options]
 * @returns {{ officialKo: string, iata: string | null } | null}
 */
export function resolveRentalAirport(location, options = {}) {
  if (!location || typeof location !== 'object') return null;

  const lat = typeof location.lat === 'number' ? location.lat : Number(location.lat);
  const lng = typeof location.lng === 'number' ? location.lng : Number(location.lng);
  const geoHub =
    Number.isFinite(lat) && Number.isFinite(lng) ? nearestHubWithinRadius(lat, lng) : null;

  const ignoreStored = options.ignoreStoredRentalAirport === true;
  if (!ignoreStored && typeof location.rental_airport_official_ko === 'string' && location.rental_airport_official_ko.trim()) {
    const storedOfficial = location.rental_airport_official_ko.trim();
    const storedIataRaw =
      typeof location.rental_airport_iata === 'string' && location.rental_airport_iata.trim()
        ? location.rental_airport_iata.trim().toUpperCase()
        : null;
    const storedIata = storedIataRaw && /^[A-Z]{3}$/.test(storedIataRaw) ? storedIataRaw : null;

    if (geoHub && storedIata) {
      const sh = hubByIata(storedIata);
      if (sh) {
        const dStored = distanceKm(lat, lng, sh.lat, sh.lng);
        const gh = hubByIata(geoHub.iata);
        const dGeo = gh ? distanceKm(lat, lng, gh.lat, gh.lng) : Infinity;
        if (dStored > 2000 && dGeo < 400 && dStored > dGeo + 500) {
          return geoHub;
        }
      }
    }

    return {
      officialKo: storedOfficial,
      iata: typeof location.rental_airport_iata === 'string' ? location.rental_airport_iata : null
    };
  }

  if (!ignoreStored && typeof location.rental_airport_iata === 'string' && location.rental_airport_iata.trim()) {
    const iataUpper = location.rental_airport_iata.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(iataUpper)) {
      const hub = hubByIata(iataUpper);
      if (hub?.officialKo) {
        return { officialKo: hub.officialKo, iata: hub.iata };
      }
    }
  }

  const slug = String(location.slug || '').toLowerCase();
  const name = String(location.name || '').toLowerCase();
  const nameEn = String(location.name_en || '').toLowerCase();
  const country = String(location.country || '').toLowerCase();
  const countryEn = String(location.country_en || '').toLowerCase();
  const hay = `${slug} ${name} ${nameEn} ${country} ${countryEn}`.replace(/-/g, ' ');

  if (geoHub) return geoHub;

  let bestAlias = null;
  let bestLen = 0;
  for (const hub of RENTAL_AIRPORT_HUBS) {
    const iataLower = hub.iata.toLowerCase();
    for (const raw of hub.aliases || []) {
      const al = raw.toLowerCase();
      const isIataToken = al.length === 3 && /^[a-z]{3}$/.test(al) && al === iataLower;
      if (al.length < MIN_ALIAS_LEN && !isIataToken) continue;
      if (hay.includes(al) && al.length > bestLen) {
        bestLen = al.length;
        bestAlias = { officialKo: hub.officialKo, iata: hub.iata };
      }
    }
  }

  return bestAlias;
}

/**
 * `rental_airport_official_ko` / `rental_airport_iata` 필드를 채워 반환합니다.
 *
 * @param {T} location
 * @returns {T}
 * @template T
 */
export function enrichLocationWithRentalAirport(location) {
  if (!location || typeof location !== 'object') return location;
  const resolved = resolveRentalAirport(location);
  if (!resolved?.officialKo) return location;
  if (
    location.rental_airport_official_ko === resolved.officialKo &&
    location.rental_airport_iata === resolved.iata
  ) {
    return location;
  }
  const next = { ...location, rental_airport_official_ko: resolved.officialKo };
  if (resolved.iata) next.rental_airport_iata = resolved.iata;
  return next;
}
