/** Mapbox·OSM attribution SSOT — FooterModal Credits · 지도 컨트롤과 동일 링크 */

export const MAPBOX_ATTRIBUTION_LINKS = [
  { label: '© Mapbox', href: 'https://www.mapbox.com/about/maps/' },
  { label: '© OpenStreetMap', href: 'https://www.openstreetmap.org/about' },
  { label: 'Improve this map', href: 'https://www.mapbox.com/map-feedback/' },
  {
    label: '© Maxar',
    href: 'https://www.maxar.com/',
    note: '위성·고해상도 영상',
    noteEn: 'Satellite & high-resolution imagery',
  },
];

/** attribution 컨트롤 숨김(모바일) 시 ToS상 대체 opt-out 경로 */
export const MAPBOX_TELEMETRY = {
  label: 'Mapbox 개인정보·Telemetry',
  labelEn: 'Mapbox Privacy & Telemetry',
  href: 'https://www.mapbox.com/legal/privacy',
  description:
    '지도 SDK는 익명화된 위치·사용 데이터를 Mapbox로 전송할 수 있습니다. 수집 거부·정책은 Mapbox 개인정보 처리방침에서 확인하세요.',
  descriptionEn:
    'The map SDK may send anonymized location and usage data to Mapbox. See the Mapbox privacy policy for opt-out and details.',
};

/** 여행 정보·미디어 출처 — Credits 탭 */
export const GATEO_DATA_SOURCES = [
  {
    name: '한국관광공사 TourAPI 4.0',
    nameEn: 'Korea Tourism Organization TourAPI 4.0',
    detail: '공공누리 제1유형',
    detailEn: 'Korea Open Government License Type 1',
    href: 'https://www.visitkorea.or.kr/',
  },
  {
    name: 'Open-Meteo',
    nameEn: 'Open-Meteo',
    detail: '실시간 기상 데이터',
    detailEn: 'Live weather data',
    href: 'https://open-meteo.com/',
  },
  {
    name: 'Unsplash',
    nameEn: 'Unsplash',
    detail: '고해상도 라이선스 사진',
    detailEn: 'Licensed high-resolution photos',
    href: 'https://unsplash.com/',
  },
  {
    name: 'Pexels',
    nameEn: 'Pexels',
    detail: '고해상도 라이선스 사진',
    detailEn: 'Licensed high-resolution photos',
    href: 'https://www.pexels.com/',
  },
];

/** 플래너·배너 제휴 파트너 — Credits 탭 (예약·결제는 각 사) */
export const GATEO_TRAVEL_PARTNERS = [
  { name: 'Trip.com', href: 'https://www.trip.com/' },
  { name: 'Klook', href: 'https://www.klook.com/' },
  { name: 'GetYourGuide', href: 'https://www.getyourguide.com/' },
  { name: 'MyRealTrip', href: 'https://www.myrealtrip.com/' },
];

/** gateo.kr 기술·서비스 스택 — Credits 탭 요약 */
export const GATEO_TECH_STACK = [
  { name: 'React', detail: 'UI · SPA', detailEn: 'UI · SPA' },
  { name: 'Vite', detail: '빌드', detailEn: 'Build' },
  { name: 'Mapbox GL JS', detail: '3D 지구본', detailEn: '3D globe' },
  { name: 'Mapbox Static Images', detail: '여행 스케치 위치 지도', detailEn: 'Travel sketch maps' },
  { name: 'Supabase', detail: '인증·데이터', detailEn: 'Auth · data' },
  { name: 'Vercel', detail: '호스팅', detailEn: 'Hosting' },
  { name: 'Google Gemini', detail: 'MOONi AI (프록시 경유)', detailEn: 'MOONi AI (via proxy)' },
];

export const MAPBOX_CREDITS_INTRO =
  '홈 지구본·여행 스케치 위치 지도는 Mapbox 지도 스타일과 OpenStreetMap 등 오픈 데이터를 사용합니다. 모바일 화면에서는 지도 위 텍스트 attribution 대신 이 페이지에서 출처를 확인할 수 있습니다.';

export const MAPBOX_CREDITS_INTRO_EN =
  'The home globe and travel sketch location maps use Mapbox map styles and open data such as OpenStreetMap. On mobile, you can review attribution here instead of on-map text.';

/** locale-aware Credits 탭 본문 */
export function resolveMapboxAttribution(locale) {
  const useEn = locale === 'en';
  return {
    intro: useEn ? MAPBOX_CREDITS_INTRO_EN : MAPBOX_CREDITS_INTRO,
    links: MAPBOX_ATTRIBUTION_LINKS.map((item) => ({
      ...item,
      note: useEn && item.noteEn ? item.noteEn : item.note,
    })),
    telemetry: {
      label: useEn && MAPBOX_TELEMETRY.labelEn ? MAPBOX_TELEMETRY.labelEn : MAPBOX_TELEMETRY.label,
      description:
        useEn && MAPBOX_TELEMETRY.descriptionEn
          ? MAPBOX_TELEMETRY.descriptionEn
          : MAPBOX_TELEMETRY.description,
      href: MAPBOX_TELEMETRY.href,
    },
    dataSources: GATEO_DATA_SOURCES.map((item) => ({
      name: useEn && item.nameEn ? item.nameEn : item.name,
      detail: useEn && item.detailEn ? item.detailEn : item.detail,
      href: item.href,
    })),
    partners: GATEO_TRAVEL_PARTNERS.map((item) => ({
      name: item.name,
      href: item.href,
    })),
    techStack: GATEO_TECH_STACK.map((item) => ({
      name: item.name,
      detail: useEn && item.detailEn ? item.detailEn : item.detail,
    })),
  };
}
