/**
 * OTA 미지원·분할 예약 여행지 — 공식 항공 예약 tier SSOT.
 * `npm run generate:flights` → travelSpotFlightBookings.json
 *
 * tier:
 * - standard — Trip/OTA만 (본 파일 미등록)
 * - segmented — Trip은 관문(HNL 등)까지, 공식 링크로 최종 구간
 * - carrier-only — 특정 항공사 공식 예약만 (Trip 보조·디스클레이머)
 * - agency-only — 현지 에이전시·전세기 등 (Trip은 국제선 관문까지)
 *
 * officialLinks[].destinationIata — United 등 예약 URL용 IATA (렌터카 preferredLinkIata와 다를 수 있음)
 *
 * @type {Record<string, {
 *   tier: 'segmented'|'carrier-only'|'agency-only',
 *   bookingNote?: string,
 *   tripDisclaimer?: string,
 *   officialLinks?: Array<{
 *     provider: 'united'|'direct',
 *     name: string,
 *     originIata?: string,
 *     destinationIata: string,
 *     url?: string
 *   }>,
 *   confidence?: string,
 *   rationale?: string
 * }>}
 */
export const FLIGHT_BOOKING_OVERRIDES = {
  yap: {
    tier: 'segmented',
    bookingNote:
      '야프(YAP)는 인천→호놀룰루(HNL) 국제선 도착 후, 유나이티드항공 아일랜드 호퍼로 들어갑니다. Trip.com 검색은 HNL까지 — YAP 구간은 United 공식 예약이 필요합니다.',
    officialLinks: [
      {
        provider: 'united',
        name: 'United 아일랜드 호퍼',
        originIata: 'HNL',
        destinationIata: 'YAP',
      },
    ],
    confidence: 'high',
    rationale: 'United HNL→YAP URL QA 2026-06-11 — Island Hopper',
  },
  chuuk: {
    tier: 'segmented',
    bookingNote:
      '추크(TKK)는 인천→호놀룰루(HNL) 국제선 도착 후, 유나이티드항공 아일랜드 호퍼(경유 MAJ)로 들어갑니다. Trip.com 검색은 HNL까지 — TKK 구간은 United 공식 예약이 필요합니다.',
    officialLinks: [
      {
        provider: 'united',
        name: 'United 아일랜드 호퍼',
        originIata: 'HNL',
        destinationIata: 'TKK',
      },
    ],
    confidence: 'high',
    rationale: 'United HNL→TKK URL QA 2026-06-11',
  },
  pohnpei: {
    tier: 'segmented',
    bookingNote:
      '폰페이(PNI)는 인천→호놀룰루(HNL) 국제선 도착 후, 유나이티드항공 아일랜드 호퍼(경유 MAJ)로 들어갑니다. Trip.com 검색은 HNL까지 — PNI 구간은 United 공식 예약이 필요합니다.',
    officialLinks: [
      {
        provider: 'united',
        name: 'United 아일랜드 호퍼',
        originIata: 'HNL',
        destinationIata: 'PNI',
      },
    ],
    confidence: 'high',
    rationale: 'United HNL→PNI URL QA 2026-06-11',
  },
  kosrae: {
    tier: 'segmented',
    bookingNote:
      '코스라에(KOS)는 인천→호놀룰루(HNL) 국제선 도착 후, 유나이티드항공 아일랜드 호퍼로 들어갑니다. Trip.com 검색은 HNL까지 — United 예약 시 목적지 코드 KSA(코스라에)를 사용합니다.',
    officialLinks: [
      {
        provider: 'united',
        name: 'United 아일랜드 호퍼',
        originIata: 'HNL',
        destinationIata: 'KSA',
      },
    ],
    confidence: 'high',
    rationale: 'United HNL→KSA URL QA 2026-06-11 — IATA KOS와 United 코드 KSA 상이',
  },
  'marshall-islands': {
    tier: 'segmented',
    bookingNote:
      '마셜 제도(마주로·MAJ)는 인천→호놀룰루(HNL) 국제선 도착 후, 유나이티드항공 아일랜드 호퍼로 MAJ에 들어갑니다. Trip.com 검색은 HNL까지 — MAJ 구간은 United 공식 예약이 필요합니다.',
    officialLinks: [
      {
        provider: 'united',
        name: 'United 아일랜드 호퍼',
        originIata: 'HNL',
        destinationIata: 'MAJ',
      },
    ],
    confidence: 'high',
    rationale: 'United HNL→MAJ URL QA 2026-06-11 — UA132 HNL–MAJ',
  },
  socotra: {
    tier: 'agency-only',
    bookingNote:
      '소코트라(SCT) 구간은 아부다비(AUH) 도착 후 현지 인가 투어 에이전시를 통한 전세기(주 1~2회)로만 발권됩니다. Trip.com·스카이스캐너는 AUH까지 검색하고, SCT 티켓은 투어 패키지·현지 에이전시에 문의해 주세요.',
    confidence: 'high',
    rationale: 'AUH Trip 유지 · SCT 에이전시 안내 — 일지 2026-06-11',
  },
};
