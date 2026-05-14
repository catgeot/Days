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
 * @typedef {{ phrases: string[], iataCodes: string[], preferredLinkIata?: string }} RentalMultiAirportRow
 */

/** @type {RentalMultiAirportRow[]} */
export const RENTAL_MULTI_AIRPORT_DESTINATIONS = [
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
 * @returns {{ kind: 'single', officialKo: string, iata: string | null } | { kind: 'multi', airports: { officialKo: string, iata: string }[], linkHub: { officialKo: string, iata: string } } | null}
 */
export function resolveRentalPickupBannerInfo(location) {
  if (!location || typeof location !== 'object') return null;

  for (const row of RENTAL_MULTI_AIRPORT_DESTINATIONS) {
    if (!matchMultiAirportDestination(location, row)) continue;
    const airports = airportsFromIataCodes(row.iataCodes);
    const linkHub = resolveLinkHubWithinMulti(location, row, airports);
    return { kind: 'multi', airports, linkHub };
  }

  const single = resolveRentalAirport(location);
  if (!single?.officialKo) return null;
  return { kind: 'single', officialKo: single.officialKo, iata: single.iata };
}

/**
 * 항공권 검색 위젯: 목적지 입력 시 도시명·공항 코드로 검색하는 편이 나을 때 짧게 안내합니다.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @returns {string}
 */
export function getFlightDestinationSearchHint(location) {
  const place =
    location && typeof location.name === 'string' && location.name.trim() ? location.name.trim() : '이 여행지';
  const info = resolveRentalPickupBannerInfo(location);

  if (!info) {
    return `${place}(여행지명)만으로는 검색이 잘 안 될 때가 많습니다. 정해진 도착 공항의 도시명·공항명 또는 3자리 IATA(예: NRT, BKK)로 넣어 보세요.`;
  }

  if (info.kind === 'multi') {
    const iatas = info.airports.map((a) => a.iata).filter(Boolean);
    const iataHint = iatas.length ? iatas.join(', ') : info.airports.map((a) => a.officialKo).join(' · ');
    return `도착 공항의 도시명 또는 (${iataHint})로 검색해 보세요.`;
  }

  const iata = info.iata;
  const officialKo = info.officialKo;
  if (iata) {
    return `${place}(여행지명)이나 긴 정식 공항명보다, 공항이 있는 도시명·짧은 공항명·IATA(${iata})로 목적지를 넣는 편이 잘 나옵니다. (예: ${officialKo}만으로는 안 될 때 ${iata} 등)`;
  }

  return `${place}(여행지명)만으로는 검색이 제한될 수 있습니다. 도착 공항의 도시명·공항명으로 바꿔 검색해 보세요.`;
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

  const ignoreStored = options.ignoreStoredRentalAirport === true;
  if (!ignoreStored && typeof location.rental_airport_official_ko === 'string' && location.rental_airport_official_ko.trim()) {
    return {
      officialKo: location.rental_airport_official_ko.trim(),
      iata: typeof location.rental_airport_iata === 'string' ? location.rental_airport_iata : null
    };
  }

  const slug = String(location.slug || '').toLowerCase();
  const name = String(location.name || '').toLowerCase();
  const nameEn = String(location.name_en || '').toLowerCase();
  const country = String(location.country || '').toLowerCase();
  const countryEn = String(location.country_en || '').toLowerCase();
  const hay = `${slug} ${name} ${nameEn} ${country} ${countryEn}`.replace(/-/g, ' ');

  const lat = typeof location.lat === 'number' ? location.lat : Number(location.lat);
  const lng = typeof location.lng === 'number' ? location.lng : Number(location.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
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
    if (best) return best;
  }

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
