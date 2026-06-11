import { RENTAL_AIRPORT_HUBS, DEFAULT_HUB_RADIUS_KM } from './rentalAirportHubs.js';
import travelSpotAirportsData from '../pages/Home/data/travelSpotAirports.json' with { type: 'json' };

const toRad = (d) => (d * Math.PI) / 180;

/** @type {Record<string, { primaryIatas: string[], preferredLinkIata?: string, kind?: string, bannerNote?: string, searchHintIatas?: string[], klookRentalHomeSearchLabel?: string, klookRentalSearchLabel?: string, klookRentalSearchMode?: string }>} */
const STATIC_SPOT_AIRPORT_MAP = travelSpotAirportsData.spots ?? {};

/** DB place_toolkit.place_id·사용자 입력 지명 (공식 travelSpots slug 없음 포함) */
const STATIC_PLACE_ID_AIRPORT_MAP = travelSpotAirportsData.placeIds ?? {};

function normalizePlaceIdKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function placeIdLookupKeys(location) {
  const keys = [];
  for (const raw of [location?.place_id, location?.placeId, location?.name]) {
    if (raw == null || raw === '') continue;
    const s = String(raw).trim();
    keys.push(s, normalizePlaceIdKey(s), s.toLowerCase());
  }
  return keys;
}

function getTravelSpotAirportRow(location) {
  const slug = String(location?.slug ?? '').toLowerCase();
  if (slug && STATIC_SPOT_AIRPORT_MAP[slug]) return STATIC_SPOT_AIRPORT_MAP[slug];

  for (const k of placeIdLookupKeys(location)) {
    const row = STATIC_PLACE_ID_AIRPORT_MAP[k] ?? STATIC_PLACE_ID_AIRPORT_MAP[normalizePlaceIdKey(k)];
    if (row?.primaryIatas?.length) return row;
  }
  return null;
}

/** generate가 넣은 좌표·런타임 추론(`runtime-infer` 등) — 툴킷이 있으면 배너에서 양보 */
function isInferredStaticAirportRow(row) {
  if (!row) return false;
  if (row.source === 'runtime-infer' || row.source === 'geo-nearest') return true;
  if (row.confidence === 'low' || row.confidence === 'very-low') return true;
  return false;
}

/** 수동 오버라이드·multi-rule·high confidence — 툴킷보다 우선 */
function isCuratedStaticAirportRow(row) {
  if (!row) return false;
  return (
    row.source === 'curated-override' ||
    row.source === 'multi-rule' ||
    row.confidence === 'high'
  );
}

function resolveRentalPickupBannerFromStaticMap(
  location,
  { curatedOnly = false, toolkitSyncOnly = false, inferredOnly = false } = {}
) {
  const row = getTravelSpotAirportRow(location);
  if (!row?.primaryIatas?.length) return null;
  if (curatedOnly && !isCuratedStaticAirportRow(row)) return null;
  if (toolkitSyncOnly && row.source !== 'toolkit-sync') return null;
  if (inferredOnly && !isInferredStaticAirportRow(row)) return null;

  const codes = row.primaryIatas.filter((c) => hubByIata(c));
  if (!codes.length) return null;

  const preferred =
    row.preferredLinkIata && codes.includes(row.preferredLinkIata) ? row.preferredLinkIata : codes[0];

  if (row.kind === 'single' || codes.length === 1) {
    const hub = hubByIata(preferred);
    if (!hub) return null;
    return {
      kind: 'single',
      officialKo: hub.officialKo,
      iata: hub.iata,
      fromStaticMap: true,
      ...(row.bannerNote ? { bannerNote: row.bannerNote } : {})
    };
  }

  const airports = airportsFromIataCodes(codes).filter((a) => hubByIata(a.iata));
  if (!airports.length) return null;
  const linkHub = airports.find((a) => a.iata === preferred) || airports[0];
  const others = airports.filter((a) => a.iata !== linkHub.iata);
  return {
    kind: 'multi',
    airports: [linkHub, ...others],
    linkHub,
    ...(row.bannerNote ? { bannerNote: row.bannerNote } : {}),
    fromStaticMap: true
  };
}

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
 * @typedef {{ phrases: string[], iataCodes: string[], preferredLinkIata?: string, bannerNote?: string, searchHintIatas?: string[] }} RentalMultiAirportRow
 */

/** @type {RentalMultiAirportRow[]} */
export const RENTAL_MULTI_AIRPORT_DESTINATIONS = [
  {
    phrases: ['zermatt', '체르마트', 'matterhorn', '마테호른', 'tasch', 'visp', '비스프'],
    iataCodes: ['ZRH', 'GVA'],
    preferredLinkIata: 'ZRH',
    searchHintIatas: ['ZRH', 'GVA'],
    bannerNote:
      '체르마트는 차량 통제 구역이라 공항 도착 후 기차(취리히·제네바 공항역 → 비스프 등)로 이어지는 일정이 흔합니다. 지도상으로는 북이탈리아 공항이 가깝게 보일 수 있어도, 실제 티켓·입국·연결은 스위스 관문(ZRH·GVA)을 먼저 확인해 주세요.'
  },
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
    preferredLinkIata: 'ASR',
    searchHintIatas: ['ASR', 'NAV']
  },
  {
    phrases: ['tokyo', '도쿄', 'shibuya', '시부야', 'shinjuku', '신주쿠', 'ikebukuro', '이케부쿠로'],
    iataCodes: ['HND', 'NRT'],
    preferredLinkIata: 'HND',
    searchHintIatas: ['HND', 'NRT']
  },
  {
    phrases: ['bangkok', '방콕', 'suvarnabhumi', '수완나품', 'don mueang', '돈므앙'],
    iataCodes: ['BKK', 'DMK'],
    preferredLinkIata: 'BKK',
    searchHintIatas: ['BKK', 'DMK']
  },
  {
    phrases: ['paris', '파리'],
    iataCodes: ['CDG', 'ORY'],
    preferredLinkIata: 'CDG',
    searchHintIatas: ['CDG', 'ORY']
  },
  {
    phrases: [
      'canary',
      '카나리아',
      'canary islands',
      '카나리아 제도',
      '카나리아제도',
      'tenerife',
      '테네리페',
      'gran canaria',
      '그란카나리아',
      'lanzarote',
      '란사로테'
    ],
    iataCodes: ['TFS', 'LPA'],
    preferredLinkIata: 'TFS',
    searchHintIatas: ['TFS', 'LPA']
  },
  {
    phrases: [
      'jordan',
      '요르단',
      'wadi rum',
      'wadirum',
      '와디 럼',
      '와디럼',
      'petra',
      '페트라',
      'amman',
      '암만',
      'wadi musa',
      '와디무사'
    ],
    iataCodes: ['AMM'],
    preferredLinkIata: 'AMM',
    bannerNote:
      '요르단 국제선은 대부분 암만 퀸 알리아(AMM)에 도착한 뒤 페트라·와디 럼으로 이동합니다. 티켓·일정의 도착 공항을 확인해 주세요.'
  },
  {
    phrases: [
      'fernando-de-noronha',
      'fernando de noronha',
      'fernandodenoronha',
      '페르난두지노로냐',
      '페르난두 지 노로냐',
      'noronha'
    ],
    iataCodes: ['FEN', 'REC', 'NAT'],
    preferredLinkIata: 'FEN',
    bannerNote:
      '섬 공항은 페르난두지노로냐(FEN)뿐입니다. 본토에서는 레시피(REC)·나탈(NAT) 등으로 들어온 뒤 국내선·경비행으로 이어지는 일정이 많습니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  {
    phrases: ['bora-bora', 'bora bora', '보라보라'],
    iataCodes: ['BOB', 'PPT'],
    preferredLinkIata: 'BOB',
    bannerNote:
      '보라보라 섬 공항은 BOB(모투무테)입니다. 국제선은 타히티 파아페테(PPT)에 먼저 도착한 뒤 국내선으로 이어지는 일정이 많습니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  {
    phrases: ['rarotonga', '라로통가', 'cook islands', '쿡 제도'],
    iataCodes: ['RAR', 'AKL'],
    preferredLinkIata: 'RAR',
    bannerNote:
      '쿡 제도(라로통가) 최종 도착은 RAR입니다. 한국·아시아에서 오는 항공편은 오클랜드(AKL) 등 뉴질랜드·호주 경유가 흔합니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  {
    phrases: ['samoa', '사모아', 'apia', '아피아'],
    iataCodes: ['APW', 'NAN', 'AKL'],
    preferredLinkIata: 'APW',
    bannerNote:
      '사모아(아피아) 최종 도착은 팔레올로(APW)입니다. 오클랜드(AKL)·피지 난디(NAN) 등 경유 후 국내선·연결편으로 이어지는 일정이 많습니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  {
    phrases: ['zanzibar', '잔지바르'],
    iataCodes: ['ZNZ', 'DAR'],
    preferredLinkIata: 'ZNZ',
    bannerNote:
      '잔지바르 섬 도착은 ZNZ(아베이드 아마니 카루메)입니다. 다르에스살람(DAR) 경유·페리·국내선으로 이어지는 일정도 있습니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  {
    phrases: ['santorini', '산토리니', 'thira', '티라'],
    iataCodes: ['JTR', 'ATH'],
    preferredLinkIata: 'JTR',
    bannerNote:
      '산토리니 직항은 티라(JTR)가 많고, 아테네(ATH) 경유·페리·국내선으로 이어지는 일정도 흔합니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  {
    phrases: ['galapagos', '갈라파고스', 'baltra', '발트라'],
    iataCodes: ['GPS', 'GYE'],
    preferredLinkIata: 'GPS',
    bannerNote:
      '갈라파고스 섬 도착은 발트라(GPS) 등이 많습니다. 본토 과야킬(GYE)·키토 경유 후 국내선으로 이어지는 일정도 있습니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  {
    phrases: ['crete', '크레타', 'heraklion', '이라클리온', 'chania', '하니아'],
    iataCodes: ['HER', 'CHQ'],
    preferredLinkIata: 'HER',
    searchHintIatas: ['HER', 'CHQ'],
    bannerNote:
      '크레타는 동부 이라클리온(HER)·서부 하니아(CHQ) 등 도착 공항이 나뉩니다. 아테네(ATH) 경유 후 국내선·페리로 들어오는 일정이 흔하니, 티켓의 최종 도착 코드를 확인한 뒤 아래 제휴 링크 검색어도 그 공항에 맞춰 주세요.'
  },
  {
    phrases: ['sicily', '시칠리아', 'sicilia', 'catania', '카타니아', 'palermo', '팔레르모', 'taormina', '타오르미나'],
    iataCodes: ['CTA', 'PMO'],
    preferredLinkIata: 'CTA',
    searchHintIatas: ['CTA', 'PMO'],
    bannerNote:
      '시칠리아는 동부 카타니아(CTA)·서북부 팔레르모(PMO) 등 도착 공항이 나뉩니다. 인천·유럽 경유 후 시칠리아행 국내선·유럽내선으로 이어지는 일정이 흔하니, 티켓의 최종 도착 코드를 확인한 뒤 아래 제휴 링크 검색어도 그 공항에 맞춰 주세요.'
  },
  {
    phrases: ['palawan', '팔라완', 'puerto princesa', '푸에르토 프린세사'],
    iataCodes: ['PPS', 'MNL'],
    preferredLinkIata: 'PPS',
    bannerNote:
      '팔라완은 푸에르토프린세사(PPS)가 관문이고, 마닐라(MNL) 경유·국내선으로 이어지는 일정도 많습니다. 티켓의 최종 도착 코드를 확인해 주세요.'
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

function findMatchedMultiAirportDestination(location) {
  if (!location || typeof location !== 'object') return null;
  for (const row of RENTAL_MULTI_AIRPORT_DESTINATIONS) {
    if (matchMultiAirportDestination(location, row)) return row;
  }
  return null;
}

/**
 * 항공권·렌터카 검색 위젯용 IATA — 환승·국제선 관문(EZE 등)은 제외하고 실제 검색·픽업 공항만.
 * `searchHintIatas`가 있으면 그 목록, 없으면 multi일 때 `linkHub`만(연동 도착 공항).
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null, ignoreStaticAirportMap?: boolean }} [options]
 * @returns {string[] | null}
 */
function resolveSearchHintIataCodes(location, options = {}) {
  const info = resolveRentalPickupBannerInfo(location, options);
  if (!info) return null;

  const staticRow = options.ignoreStaticAirportMap !== true ? getTravelSpotAirportRow(location) : null;
  const multiRow = findMatchedMultiAirportDestination(location);
  const override = staticRow?.searchHintIatas ?? multiRow?.searchHintIatas;

  if (Array.isArray(override) && override.length) {
    const codes = override
      .map((c) => String(c ?? '').trim().toUpperCase())
      .filter((c) => hubByIata(c));
    if (codes.length) return codes;
  }

  if (info.kind === 'multi' && info.linkHub?.iata) return [info.linkHub.iata];
  if (info.kind === 'single' && info.iata) return [info.iata];
  return null;
}

/**
 * 배너 「다른 도착 후보」 — `searchHintIatas`에 2개 이상 있을 때만(linkHub 제외).
 * 환승·국제선 관문(EZE·LIM 등)은 bannerNote로만 안내하고 여기에는 넣지 않습니다.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {ReturnType<typeof resolveRentalPickupBannerInfo>} info
 * @param {{ essentialGuide?: Record<string, unknown> | null, ignoreStaticAirportMap?: boolean }} [options]
 * @returns {{ officialKo: string, iata: string }[]}
 */
export function resolveBannerPeerAlternateAirports(location, info, options = {}) {
  if (!info || info.kind !== 'multi' || !info.linkHub?.iata) return [];

  const staticRow = options.ignoreStaticAirportMap !== true ? getTravelSpotAirportRow(location) : null;
  const multiRow = findMatchedMultiAirportDestination(location);
  const hintCodes = staticRow?.searchHintIatas ?? multiRow?.searchHintIatas;

  if (!Array.isArray(hintCodes) || hintCodes.length < 2) return [];

  const link = String(info.linkHub.iata).trim().toUpperCase();
  return hintCodes
    .map((c) => String(c ?? '').trim().toUpperCase())
    .filter((c) => c && c !== link && hubByIata(c))
    .map((c) => {
      const hub = hubByIata(c);
      return { officialKo: hub.officialKo, iata: hub.iata };
    });
}

/** 권역 교차 링크·검색 힌트용 IATA 라벨 (예: `BKI·KCH`) — 환승 관문 제외 */
export function formatSearchHintIataLabel(location, options = {}) {
  const codes = resolveSearchHintIataCodes(location, options);
  if (!codes?.length) return '';
  return codes.join('·');
}

function hubByIata(iata) {
  return RENTAL_AIRPORT_HUBS.find((h) => h.iata === iata) || null;
}

/** `journey_timeline` 제목 등에서 도착·경유 맥락이 있을 때만 IATA 추출에 쓰는 힌트 */
const ARRIVAL_TIMELINE_HINT =
  /공항|도착|입국|경유|환승|국내선|domestic|airport|arrival|immigration|terminal|터미널|비행기|비행\b|탑승|->|→/i;

function shouldSkipKoreaDepartureTimelineCode(title, code) {
  if (code !== 'ICN' && code !== 'GMP') return false;
  if (!/(출발|depart)/i.test(title)) return false;
  return /(인천|김포|서울)/i.test(title) || /\bICN\b|\bGMP\b/i.test(title);
}

function pushValidHubIata(ordered, seen, raw) {
  const upper = String(raw ?? '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(upper)) return;
  if (!hubByIata(upper)) return;
  if (seen.has(upper)) return;
  seen.add(upper);
  ordered.push(upper);
}

/** IATA 별칭·짧은 영문이 다른 단어 안쪽(jordan→ord 등)에 걸리지 않도록 단어 경계로만 매칭 */
export function aliasMatchesHay(hay, alias, hubIata) {
  const al = alias.toLowerCase();
  const isAscii = /^[\x00-\x7F]+$/.test(alias);
  const isIataToken = al.length === 3 && /^[a-z]{3}$/.test(al) && al === hubIata.toLowerCase();
  if (isAscii && (isIataToken || al.length <= 4)) {
    const re = new RegExp(`\\b${al.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(hay);
  }
  return hay.includes(al);
}

/** 타임라인 제목에 IATA는 없지만 공항·도시명만 있는 경우 (예: 암만 퀸 알리아 공항) */
/** 타임라인에서 경유·입국 허브만 나열한 단계 — 최종 도착 공항 배너에서 제외 */
function isTransitHubTimelineTitle(title) {
  if (typeof title !== 'string' || !title.trim()) return false;
  if (/[A-Z]{3}\s*\/\s*[A-Z]{3}/i.test(title)) return true;
  if (/경유지|환승지|transit hub|connecting hub/i.test(title)) return true;
  if (/(경유|환승|transfer|layover|connecting)/i.test(title) && /(등\)|예:|예\s|등\s)/.test(title)) return true;
  if (/(경유|환승|transfer|layover|connecting)/i.test(title) && /주요\s*허브|허브\s*공항/i.test(title)) return true;
  // 「ADD 또는 CDG 공항 경유」처럼 도착·입국 없이 경유만 나열한 단계
  if (/(경유|환승|transfer|layover|connecting)/i.test(title) && !/(도착|입국|arrival)/i.test(title)) {
    return true;
  }
  return false;
}

const TITLE_ARRIVAL_AIRPORT_PHRASES = [
  { re: /필라델피아|philadelphia|philly/i, iata: 'PHL' },
  { re: /애틀랜타|atlanta/i, iata: 'ATL' },
  { re: /디트로이트|detroit/i, iata: 'DTW' },
  { re: /티라나|tirana/i, iata: 'TIA' },
  { re: /산토리니|santorini|티라(?!나)|thira/i, iata: 'JTR' },
  { re: /크레타|crete|이라클리온|heraklion/i, iata: 'HER' },
  { re: /하니아|chania/i, iata: 'CHQ' },
  { re: /카타니아|catania/i, iata: 'CTA' },
  { re: /팔레르모|palermo/i, iata: 'PMO' },
  { re: /시칠리아|sicily|sicilia/i, iata: 'CTA' },
  { re: /이비사|ibiza/i, iata: 'IBZ' },
  { re: /세비야|seville|sevilla/i, iata: 'SVQ' },
  { re: /베를린|berlin/i, iata: 'BER' },
  { re: /브뤼셀|brussels|bruxelles/i, iata: 'BRU' },
  { re: /피렌체|florence|firenze/i, iata: 'FLR' },
  { re: /류블랴나|ljubljana|블레드|bled/i, iata: 'LJU' },
  { re: /티바트|tivat/i, iata: 'TIV' },
  { re: /포드고리차|podgorica/i, iata: 'TGD' },
  { re: /두브로브니크|dubrovnik/i, iata: 'DBV' },
  { re: /스플리트|split(?!\s*port)/i, iata: 'SPU' },
  { re: /마라케시|marrakech|marrakesh/i, iata: 'RAK' },
  { re: /모스크바|moscow|moskva|셰레메티예보/i, iata: 'SVO' },
  { re: /괌|guam|tumon|투몬/i, iata: 'GUM' },
  { re: /사이판|saipan/i, iata: 'SPN' },
  { re: /팔라우|palau|코로르|koror/i, iata: 'ROR' },
  { re: /팔라완|palawan|푸에르토\s*프린세사/i, iata: 'PPS' },
  { re: /갈라파고스|galapagos|발트라|baltra/i, iata: 'GPS' },
  { re: /뉴칼레도니아|new caledonia|누메아|noumea/i, iata: 'NOU' },
  { re: /(?<![로])통가|tonga|누쿠알로파|nukualofa/i, iata: 'TBU' },
  { re: /바누아투|vanuatu|포트빌라|port vila/i, iata: 'VLI' },
  { re: /골드코스트|gold coast/i, iata: 'OOL' },
  { re: /암만|퀸\s*알리아|queen\s*alia/i, iata: 'AMM' },
  { re: /버뮤다|bermuda/i, iata: 'BDA' },
  { re: /페르난두\s*지?\s*노로냐|페르난두지노로냐|fernando\s*de\s*noronha|noronha/i, iata: 'FEN' },
  { re: /보라보라|bora\s*bora|모투\s*무테|motu\s*mute/i, iata: 'BOB' },
  { re: /아이투타키|aitutaki/i, iata: 'AIT' },
  { re: /라로통가|rarotonga/i, iata: 'RAR' },
  { re: /사모아|samoa|아피아|apia|팔레올로|faleolo/i, iata: 'APW' },
  { re: /잔지바르|zanzibar|웅구자|unguja/i, iata: 'ZNZ' },
  { re: /티미카|timika/i, iata: 'TIM' },
  { re: /카르스텐츠|carstensz/i, iata: 'TIM' },
  { re: /콤포스텔라|compostela|산티아고\s*데\s*콤포스텔라/i, iata: 'SCQ' },
  { re: /브루나이|brunei|bandar\s*seri\s*begawan|bsb/i, iata: 'BWN' },
  { re: /쿠스코|cusco|마추픽추|machu\s*picchu/i, iata: 'CUZ' },
  { re: /리마|lima/i, iata: 'LIM' },
  { re: /멘도사|mendoza|아콩카|aconcagua/i, iata: 'MDZ' },
  { re: /부에노스\s*아이레스|buenos\s*aires/i, iata: 'EZE' },
  { re: /나가사키|nagasaki/i, iata: 'NGS' },
  { re: /후쿠오카|fukuoka/i, iata: 'FUK' },
  { re: /엘칼라파테|el\s*calafate|페리토\s*모레노|perito\s*moreno|\bfte\b/i, iata: 'FTE' }
];

function collectPhraseAirportFromTitle(ordered, seen, title, requireArrivalHint) {
  if (typeof title !== 'string' || !title.trim()) return;
  if (requireArrivalHint && !ARRIVAL_TIMELINE_HINT.test(title)) return;
  for (const { re, iata } of TITLE_ARRIVAL_AIRPORT_PHRASES) {
    if (re.test(title)) pushValidHubIata(ordered, seen, iata);
  }
}

function collectIataFromTitle(ordered, seen, title, requireArrivalHint) {
  if (typeof title !== 'string' || !title.trim()) return;
  if (requireArrivalHint && !ARRIVAL_TIMELINE_HINT.test(title)) return;
  collectPhraseAirportFromTitle(ordered, seen, title, false);
  const re = /\b([A-Z]{3})\b/g;
  let m;
  while ((m = re.exec(title)) !== null) {
    const code = m[1];
    if (shouldSkipKoreaDepartureTimelineCode(title, code)) continue;
    pushValidHubIata(ordered, seen, code);
  }
}

/**
 * AI 툴킷(`essential_guide`)에 기반한 **도착(또는 목적지 권역) 공항 IATA** 목록.
 * - `primary_arrival_airports_iata`(툴킷 JSON 최상위, 신규): 있으면 최우선
 * - 없으면 `journey_timeline` 제목·항공 `advice`에서 `(XXX)` 패턴 추출 (등록된 렌터카 허브만)
 *
 * @param {Record<string, unknown> | null | undefined} guide
 * @returns {string[] | null}
 */
export function extractArrivalIataCodesFromEssentialGuide(guide) {
  if (!guide || typeof guide !== 'object') return null;

  const ordered = [];
  const seen = new Set();

  const structured = guide.primary_arrival_airports_iata;
  if (Array.isArray(structured)) {
    for (const x of structured) {
      pushValidHubIata(ordered, seen, x);
    }
  }

  const timeline = guide.journey_timeline;
  if (Array.isArray(timeline)) {
    // 최종 도착 단계(뒤쪽 STEP)를 먼저 읽어 경유·제3국 허브가 연동 공항으로 잡히는 것을 줄임
    for (let i = timeline.length - 1; i >= 0; i--) {
      const title = timeline[i]?.title;
      if (isTransitHubTimelineTitle(title)) continue;
      collectIataFromTitle(ordered, seen, title, true);
    }
    if (ordered.length === 0) {
      for (let i = timeline.length - 1; i >= 0; i--) {
        collectIataFromTitle(ordered, seen, timeline[i]?.title, false);
      }
    }
  }

  if (ordered.length === 0) {
    const flightAdvice =
      guide.categories && typeof guide.categories === 'object'
        ? guide.categories.flight?.advice
        : null;
    const legacyFlight =
      guide.flight && typeof guide.flight === 'object' ? guide.flight.advice : null;
    const adv = typeof flightAdvice === 'string' ? flightAdvice : typeof legacyFlight === 'string' ? legacyFlight : null;
    if (adv && adv.length > 0) {
      const oneLine = adv.replace(/\s+/g, ' ');
      collectIataFromTitle(ordered, seen, oneLine, true);
      if (ordered.length === 0) collectIataFromTitle(ordered, seen, oneLine, false);
    }
  }

  return ordered.length ? ordered : null;
}

const PLANNER_SOURCED_RENTAL_BANNER_NOTE =
  '도착 공항은 이 툴킷 AI가 정리한 여정·항공 안내와 맞추었습니다. 실제 티켓과 다르면 도착 공항 코드를 기준으로 바꿔 주세요.';

function linkHubNearestToLocation(location, airports) {
  const lat = typeof location.lat === 'number' ? location.lat : Number(location.lat);
  const lng = typeof location.lng === 'number' ? location.lng : Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return airports[0];
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
  return best || airports[0];
}

/**
 * 여행지 좌표 기준 목적지 권역에 가까운 공항만 남깁니다. 타임라인에 섞인 환승·제3국 허브를 배너에서 제외합니다.
 *
 * @param {Record<string, unknown>} location
 * @param {{ officialKo: string, iata: string }[]} airports
 */
function filterAirportsNearDestination(location, airports) {
  if (!airports?.length) return airports;
  const lat = typeof location.lat === 'number' ? location.lat : Number(location.lat);
  const lng = typeof location.lng === 'number' ? location.lng : Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return airports;

  const withDist = airports.map((a) => {
    const hub = hubByIata(a.iata);
    if (!hub) return { ...a, d: Infinity };
    return { ...a, d: distanceKm(lat, lng, hub.lat, hub.lng) };
  });

  const finite = withDist.filter((a) => Number.isFinite(a.d));
  if (finite.length === 0) return airports;

  const minD = Math.min(...finite.map((a) => a.d));

  // 툴킷이 다른 여행지(예: 시애틀에 DJJ)로 잘못 생성된 경우 — planner IATA 무시 후 좌표·JSON 폴백
  const MAX_PLAUSIBLE_DESTINATION_AIRPORT_KM = 900;
  if (minD > MAX_PLAUSIBLE_DESTINATION_AIRPORT_KM) return [];

  const threshold = Math.max(minD * 2.5, Math.min(minD + 600, 900));
  let near = finite.filter((a) => a.d <= threshold);
  // 목적지 공항이 매우 가까우면(예: BDA) 먼 허브·경유지(JFK 등)는 제외
  if (minD < 150) {
    const strictThreshold = Math.max(minD + 80, 120);
    const strictNear = near.filter((a) => a.d <= strictThreshold);
    if (strictNear.length > 0) near = strictNear;
  }
  if (near.length === 0) return [];
  return near.map(({ officialKo, iata }) => ({ officialKo, iata }));
}

/**
 * @param {Record<string, unknown>} location
 * @param {string[]} iataCodes
 */
function resolveRentalPickupBannerFromPlannerIatas(location, iataCodes) {
  let airports = airportsFromIataCodes(iataCodes).filter((a) => hubByIata(a.iata));
  if (airports.length === 0) return null;

  airports = filterAirportsNearDestination(location, airports);
  if (airports.length === 0) return null;

  if (airports.length === 1) {
    return { kind: 'single', officialKo: airports[0].officialKo, iata: airports[0].iata, fromPlanner: true };
  }

  const linkHub = linkHubNearestToLocation(location, airports);
  const others = airports.filter((a) => a.iata !== linkHub.iata);
  return {
    kind: 'multi',
    airports: [linkHub, ...others],
    linkHub,
    bannerNote: PLANNER_SOURCED_RENTAL_BANNER_NOTE,
    fromPlanner: true
  };
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
  const inferred = resolveRentalAirport(location, {
    ignoreStoredRentalAirport: true,
    skipMultiDestinationOverride: true
  });
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
 * 우선순위:
 * 1. `travelSpotAirports.json` 중 **수동 오버라이드**(curated-override / high)
 * 2. `essentialGuide` — 툴킷 여정·항공 안내의 도착 IATA (실시간 DB)
 * 3. JSON의 **toolkit-sync** (`npm run sync:airports-from-toolkit`로 박아 둔 스냅샷)
 * 4. JSON의 **좌표·런타임 추론**(runtime-infer 등)
 * 5. `RENTAL_MULTI_AIRPORT_DESTINATIONS` · 좌표 최근접
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null, ignoreStaticAirportMap?: boolean }} [options]
 * @returns {{ kind: 'single', officialKo: string, iata: string | null } | { kind: 'multi', airports: { officialKo: string, iata: string }[], linkHub: { officialKo: string, iata: string }, bannerNote?: string } | null}
 */
export function resolveRentalPickupBannerInfo(location, options = {}) {
  if (!location || typeof location !== 'object') return null;

  const eg = options.essentialGuide;
  const staticRow =
    options.ignoreStaticAirportMap !== true ? getTravelSpotAirportRow(location) : null;

  // medium 검수 오버라이드보다 실시간 툴킷(TIM 등) 우선 — 카르스텐츠·DJJ 오탐 보정
  if (eg && typeof eg === 'object' && staticRow?.confidence === 'medium') {
    const plannerCodes = extractArrivalIataCodesFromEssentialGuide(eg);
    if (plannerCodes?.length) {
      const fromPlanner = resolveRentalPickupBannerFromPlannerIatas(location, plannerCodes);
      if (fromPlanner) return fromPlanner;
    }
  }

  if (options.ignoreStaticAirportMap !== true) {
    const fromCurated = resolveRentalPickupBannerFromStaticMap(location, { curatedOnly: true });
    if (fromCurated) return fromCurated;
  }

  if (eg && typeof eg === 'object') {
    const plannerCodes = extractArrivalIataCodesFromEssentialGuide(eg);
    if (plannerCodes?.length) {
      const fromPlanner = resolveRentalPickupBannerFromPlannerIatas(location, plannerCodes);
      if (fromPlanner) return fromPlanner;
    }
  }

  if (options.ignoreStaticAirportMap !== true) {
    const fromToolkitSync = resolveRentalPickupBannerFromStaticMap(location, { toolkitSyncOnly: true });
    if (fromToolkitSync) return fromToolkitSync;
  }

  if (options.ignoreStaticAirportMap !== true) {
    const fromInferredStatic = resolveRentalPickupBannerFromStaticMap(location, { inferredOnly: true });
    if (fromInferredStatic) return fromInferredStatic;
  }

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

/** 항공권 검색 힌트용 짧은 지명 (예: 「카나리아 제도」→「카나리아」) */
function flightHintPlaceLabel(place) {
  return place.replace(/\s+제도\s*$/u, '').trim() || place;
}

/** IATA 코드 나열: 2개면 「A 또는 B」, 그 이상이면 「A, B 또는 C」 */
function formatFlightHintIataCodes(iatas) {
  const codes = iatas.filter(Boolean);
  if (codes.length === 0) return null;
  if (codes.length === 1) return codes[0];
  if (codes.length === 2) return `${codes[0]} 또는 ${codes[1]}`;
  return `${codes.slice(0, -1).join(', ')} 또는 ${codes[codes.length - 1]}`;
}

/**
 * 항공권 검색 위젯: 도착지명·정식 공항명 대신 해당 여행지 IATA 코드 입력을 권장합니다.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null }} [options]
 * @returns {string}
 */
export function getFlightDestinationSearchHint(location, options = {}) {
  const place =
    location && typeof location.name === 'string' && location.name.trim() ? location.name.trim() : '이 여행지';
  const label = flightHintPlaceLabel(place);
  const codes = resolveSearchHintIataCodes(location, options);

  if (!codes?.length) {
    return '정확한 항공권 검색을 위해 도착 공항 3자리 코드(IATA)를 입력해 주세요.';
  }

  const formatted = formatFlightHintIataCodes(codes);
  if (formatted) {
    return `정확한 항공권 검색을 위해 ${label} 도착 공항 코드(${formatted})를 입력해 주세요.`;
  }

  return `정확한 항공권 검색을 위해 ${label} 도착 공항 3자리 코드(IATA)를 입력해 주세요.`;
}

/**
 * 클룩 렌터카 홈에서 직접 검색할 때 쓸 문자열. IATA가 안 잡히는 지역은 공항명 등으로 예외 지정.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null, ignoreStaticAirportMap?: boolean }} [options]
 * @returns {string | null}
 */
function resolveKlookRentalHomeSearchLabel(location, options = {}) {
  const row = options.ignoreStaticAirportMap !== true ? getTravelSpotAirportRow(location) : null;

  if (row && typeof row.klookRentalHomeSearchLabel === 'string' && row.klookRentalHomeSearchLabel.trim()) {
    return row.klookRentalHomeSearchLabel.trim();
  }

  if (row && typeof row.klookRentalSearchLabel === 'string' && row.klookRentalSearchLabel.trim()) {
    return row.klookRentalSearchLabel.trim();
  }

  if (row?.klookRentalSearchMode === 'airport') {
    const hub = resolveRentalAirport(location);
    if (hub?.officialKo) return hub.officialKo;
  }

  return null;
}

/**
 * 공항 이동 카드·렌터카 홈 버튼 하단: 클룩에서 직접 검색할 때 3자리 코드 입력 안내.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null }} [options]
 * @returns {string}
 */
export function getRentalCarHomeSearchSubtext(location, options = {}) {
  const label = resolveKlookRentalHomeSearchLabel(location, options);
  if (label) {
    return `렌터카 검색 시 ${label}(으)로 검색해 주세요.`;
  }

  const codes = resolveSearchHintIataCodes(location, options);
  if (!codes?.length) {
    return '렌터카 검색 시 세자리 공항 코드(예: PDL)로 입력해 주세요.';
  }
  if (codes.length === 1) {
    return `렌터카 검색 시 세자리 공항 코드(${codes[0]})로 입력해 주세요.`;
  }
  return `렌터카 검색 시 세자리 공항 코드(${codes.join(', ')}) 중 하나로 입력해 주세요.`;
}

/**
 * 공항 이동 카드 버튼·배너 하단용 짧은 검색 안내 (한 줄).
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null }} [options]
 * @returns {string}
 */
export function getRentalCarHomeSearchHintShort(location, options = {}) {
  const label = resolveKlookRentalHomeSearchLabel(location, options);
  if (label) return label;

  const codes = resolveSearchHintIataCodes(location, options);
  if (!codes?.length) return '공항 코드 입력';
  if (codes.length === 1) return `코드 ${codes[0]}`;
  return `코드 ${codes.slice(0, 2).join('·')}`;
}

/**
 * 클룩 렌터카 배너·검색 URL용 검색어. 기본은 여행지 표시명(`name`).
 * 공항 정식명은 `travelSpotAirports`에 `klookRentalSearchMode: 'airport'` 또는 `klookRentalSearchLabel`로만 예외 지정.
 *
 * @see plans/klook-rental-search-data.md
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null, ignoreStaticAirportMap?: boolean }} [options]
 * @returns {string}
 */
export function resolveKlookRentalBannerSearchLabel(location, options = {}) {
  if (!location || typeof location !== 'object') {
    return typeof location === 'string' ? location.trim() : '';
  }

  const row = options.ignoreStaticAirportMap !== true ? getTravelSpotAirportRow(location) : null;

  if (row && typeof row.klookRentalSearchLabel === 'string' && row.klookRentalSearchLabel.trim()) {
    return row.klookRentalSearchLabel.trim();
  }

  if (row?.klookRentalSearchMode === 'airport') {
    const info = resolveRentalPickupBannerInfo(location, options);
    const hub =
      info?.kind === 'multi'
        ? info.linkHub
        : info?.kind === 'single'
          ? { officialKo: info.officialKo }
          : resolveRentalAirport(location);
    if (hub?.officialKo) return hub.officialKo;
  }

  const name = typeof location.name === 'string' ? location.name.trim() : '';
  const nameEn = typeof location.name_en === 'string' ? location.name_en.trim() : '';
  return name || nameEn;
}

/**
 * 여정 플래너 렌터카 검색 버튼 보조 문구.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null }} [options]
 * @returns {string}
 */
export function getRentalCarTimelineActionDescription(location, options = {}) {
  const label = resolveKlookRentalHomeSearchLabel(location, options);
  if (label) {
    return `${label}(으)로 검색해 주세요`;
  }

  const codes = resolveSearchHintIataCodes(location, options);
  if (!codes?.length) {
    return '세자리 공항코드를 입력해 주세요';
  }
  if (codes.length === 1) {
    return `세자리 공항코드(${codes[0]})를 입력해 주세요`;
  }
  return `세자리 공항코드(${codes.join(', ')})를 입력해 주세요`;
}

/**
 * 여행지 객체로부터 렌터카 검색에 쓸 공항(한국어 공식명 + IATA)을 추론합니다.
 * 좌표·반경 최근접 허브와 별칭 매칭을 쓰되, `RENTAL_MULTI_AIRPORT_DESTINATIONS`에 해당하면 그 목록 안에서만 링크 허브를 고릅니다(지리상 더 가까운 제3국 허브 오탐 방지).
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ ignoreStoredRentalAirport?: boolean, skipMultiDestinationOverride?: boolean }} [options]
 * @returns {{ officialKo: string, iata: string | null } | null}
 */
export function resolveRentalAirport(location, options = {}) {
  if (!location || typeof location !== 'object') return null;

  const ignoreStored = options.ignoreStoredRentalAirport === true;
  if (!ignoreStored && options.ignoreStaticAirportMap !== true) {
    const staticRow = getTravelSpotAirportRow(location);
    if (staticRow?.primaryIatas?.length) {
      const linkCode =
        staticRow.preferredLinkIata && staticRow.primaryIatas.includes(staticRow.preferredLinkIata)
          ? staticRow.preferredLinkIata
          : staticRow.primaryIatas[0];
      const hub = hubByIata(linkCode);
      if (hub) return { officialKo: hub.officialKo, iata: hub.iata };
    }
  }

  const lat = typeof location.lat === 'number' ? location.lat : Number(location.lat);
  const lng = typeof location.lng === 'number' ? location.lng : Number(location.lng);
  const geoHub =
    Number.isFinite(lat) && Number.isFinite(lng) ? nearestHubWithinRadius(lat, lng) : null;

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

  if (options.skipMultiDestinationOverride !== true) {
    for (const row of RENTAL_MULTI_AIRPORT_DESTINATIONS) {
      if (!matchMultiAirportDestination(location, row)) continue;
      const airports = airportsFromIataCodes(row.iataCodes);
      return resolveLinkHubWithinMulti(location, row, airports);
    }
  }

  if (geoHub) return geoHub;

  let bestAlias = null;
  let bestLen = 0;
  for (const hub of RENTAL_AIRPORT_HUBS) {
    const iataLower = hub.iata.toLowerCase();
    for (const raw of hub.aliases || []) {
      const al = raw.toLowerCase();
      const isIataToken = al.length === 3 && /^[a-z]{3}$/.test(al) && al === iataLower;
      const isKorean = /[가-힣]/.test(raw);
      const minLen = isKorean ? 2 : MIN_ALIAS_LEN;
      if (al.length < minLen && !isIataToken) continue;
      if (!aliasMatchesHay(hay, raw, hub.iata)) continue;
      if (al.length > bestLen) {
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
