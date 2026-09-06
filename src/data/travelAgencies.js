/**
 * 게이트오가 연결하는 제휴 여행사 SSOT.
 * 홈 URL은 {@link ../utils/travelAgencyHome.js} — 이 파일은 식별·호스트만.
 */

/** @typedef {'stay'|'tour'|'package'|'flight'|'rental'|'esim'|'ferry'|'transfer'|'tickets'|'luggage'|'scooter'|'browse'} TravelAgencyKind */

/**
 * @typedef {object} TravelAgency
 * @property {string} id
 * @property {string} nameKo
 * @property {string} nameEn
 * @property {TravelAgencyKind[]} kinds
 * @property {string[]} hosts hostname without leading www.
 * @property {string[]} [hrefIncludes] extra substring match (short links)
 */

/** @type {TravelAgency[]} */
export const TRAVEL_AGENCIES = [
  {
    id: 'mrt',
    nameKo: '마이리얼트립',
    nameEn: 'MyRealTrip',
    kinds: ['stay', 'tour', 'package'],
    hosts: ['myrealtrip.com', 'experiences.myrealtrip.com'],
  },
  {
    id: 'klook',
    nameKo: '클룩',
    nameEn: 'Klook',
    kinds: ['tour', 'rental', 'ferry', 'transfer'],
    hosts: ['klook.com', 'affiliate.klook.com'],
  },
  {
    id: 'tripcom',
    nameKo: '트립닷컴',
    nameEn: 'Trip.com',
    kinds: ['flight', 'stay'],
    hosts: ['trip.com', 'kr.trip.com'],
  },
  {
    id: 'getyourguide',
    nameKo: '겟유어가이드',
    nameEn: 'GetYourGuide',
    kinds: ['tour'],
    hosts: ['getyourguide.com', 'widget.getyourguide.com'],
  },
  {
    id: 'twelve_go',
    nameKo: '12Go',
    nameEn: '12Go',
    kinds: ['ferry'],
    hosts: ['12go.asia', 'trainbusferry.com'],
  },
  {
    id: 'airalo',
    nameKo: '에어알로',
    nameEn: 'Airalo',
    kinds: ['esim'],
    hosts: ['airalo.com', 'airalo.tp.st'],
    hrefIncludes: ['airalo.tp.st'],
  },
  {
    id: 'holafly',
    nameKo: '홀라플라이',
    nameEn: 'Holafly',
    kinds: ['esim'],
    hosts: ['holafly.com', 'esim.holafly.com', 'holafly.sjv.io'],
  },
  {
    id: 'tiqets',
    nameKo: '티켓스',
    nameEn: 'Tiqets',
    kinds: ['tickets'],
    hosts: ['tiqets.com', 'tiqets.tp.st'],
    hrefIncludes: ['tiqets.tp.st'],
  },
  {
    id: 'bounce',
    nameKo: '바운스',
    nameEn: 'Bounce',
    kinds: ['luggage'],
    hosts: ['bounce.com', 'go.bounce.com'],
  },
  {
    id: 'bikesbooking',
    nameKo: '바이크스부킹',
    nameEn: 'BikesBooking',
    kinds: ['scooter'],
    hosts: ['bikesbooking.com', 'bikesbooking.tp.st'],
    hrefIncludes: ['bikesbooking.tp.st'],
  },
  {
    id: 'direct_ferries',
    nameKo: '다이렉트페리',
    nameEn: 'Direct Ferries',
    kinds: ['ferry'],
    hosts: ['directferries.co.kr', 'directferries.com'],
  },
];

/** @type {Record<string, TravelAgency>} */
export const TRAVEL_AGENCY_BY_ID = Object.fromEntries(
  TRAVEL_AGENCIES.map((agency) => [agency.id, agency]),
);

/**
 * @param {string} id
 * @returns {TravelAgency | null}
 */
export function getTravelAgencyById(id) {
  if (!id) return null;
  return TRAVEL_AGENCY_BY_ID[id] || null;
}
