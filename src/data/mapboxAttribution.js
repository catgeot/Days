/** Mapbox·OSM attribution SSOT — FooterModal Credits · 지도 컨트롤과 동일 링크 */

export const MAPBOX_ATTRIBUTION_LINKS = [
  { label: '© Mapbox', href: 'https://www.mapbox.com/about/maps/' },
  { label: '© OpenStreetMap', href: 'https://www.openstreetmap.org/about' },
  { label: 'Improve this map', href: 'https://www.mapbox.com/map-feedback/' },
  { label: '© Maxar', href: 'https://www.maxar.com/', note: '위성·고해상도 영상' },
];

/** attribution 컨트롤 숨김(모바일) 시 ToS상 대체 opt-out 경로 */
export const MAPBOX_TELEMETRY = {
  label: 'Mapbox 개인정보·Telemetry',
  href: 'https://www.mapbox.com/legal/privacy',
  description:
    '지도 SDK는 익명화된 위치·사용 데이터를 Mapbox로 전송할 수 있습니다. 수집 거부·정책은 Mapbox 개인정보 처리방침에서 확인하세요.',
};

/** gateo.kr 기술·서비스 스택 — Credits 탭 요약 */
export const GATEO_TECH_STACK = [
  { name: 'React', detail: 'UI · SPA' },
  { name: 'Vite', detail: '빌드' },
  { name: 'Mapbox GL JS', detail: '3D 지구본' },
  { name: 'Mapbox Static Images', detail: '여행 스케치 위치 지도' },
  { name: 'Supabase', detail: '인증·데이터' },
  { name: 'Vercel', detail: '호스팅' },
  { name: 'Google Gemini', detail: 'MOONi AI (프록시 경유)' },
];

/** 항공 경로 추정 데이터 출처 — Credits 탭 (시각화·추정용, 실제 운항 스케줄 아님) */
export const FLIGHT_ROUTE_ATTRIBUTION = {
  intro:
    '홈·플래너의 항공 경로 미리보기는 추정 경로입니다. 실제 운항·스케줄이 아니며, 아래 공개 데이터와 규칙 기반 추정으로 그립니다.',
  links: [
    {
      label: 'OpenFlights routes',
      href: 'https://openflights.org/data.html',
      note: 'ODbL · 그래프 fallback',
    },
    {
      label: 'OurAirports',
      href: 'https://ourairports.com/data/',
      note: '공항 좌표',
    },
    {
      label: 'Wikipedia GATN (route extract)',
      href: 'https://github.com/julien-arino/wikipediaGATN',
      note: 'CC BY-SA · 관문 직항 lookup만 (코드 미포함)',
    },
  ],
};

export const MAPBOX_CREDITS_INTRO =
  '홈 지구본·여행 스케치 위치 지도는 Mapbox 지도 스타일과 OpenStreetMap 등 오픈 데이터를 사용합니다. 모바일 화면에서는 지도 위 텍스트 attribution 대신 이 페이지에서 출처를 확인할 수 있습니다.';
