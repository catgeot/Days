/**
 * i18n 커버리지 감사 P0 파일 SSOT — Preview `/qa/en`·PlaceCard·탐색 핵심 경로.
 * 갱신: 영문화 #29 baseline 확정.
 */
export const I18N_AUDIT_P0 = [
  {
    tier: 'A',
    path: 'src/pages/Home/components/HomeUI.jsx',
    note: '홈 셸·검색바·퀵링크',
  },
  {
    tier: 'A',
    path: 'src/pages/Home/components/GlobeStayStrip.jsx',
    note: '숙소·투어·패키지 펼친 패널 (#26 후속)',
  },
  {
    tier: 'A',
    path: 'src/pages/Home/components/TourMobileBar.jsx',
    note: '3D 투어 모바일 상태창 (#42a)',
  },
  {
    tier: 'A',
    path: 'src/pages/Home/components/HomeGlobeMapbox.jsx',
    note: '3D 투어·이동 가능 경계 (#42a)',
  },
  {
    tier: 'A',
    path: 'src/pages/Home/components/FlightCinemaBar.jsx',
    note: '항공경로 상태창 (#42a)',
  },
  {
    tier: 'A',
    path: 'src/components/PlaceCard/views/GalleryInfoView.jsx',
    note: '갤러리 연관 칩 (#42a)',
  },
  {
    tier: 'A',
    path: 'src/pages/Home/components/GlobeTourStrip.jsx',
    note: '3D 투어 스트립',
  },
  {
    tier: 'A',
    path: 'src/pages/Home/components/SearchDiscoveryModal.jsx',
    note: '탐색 모달·필터·큐레이션',
  },
  {
    tier: 'A',
    path: 'src/components/PlaceCard/modes/PlaceCardSummary.jsx',
    note: '써머리·숙소/투어 토글·펼침',
  },
  {
    tier: 'A',
    path: 'src/components/PlaceCard/modes/PlaceCardExpanded.jsx',
    note: '확장 카드·탭 셸',
  },
  {
    tier: 'B',
    path: 'src/pages/Home/components/MooniAgentFab.jsx',
    note: '무니 FAB·인트로',
  },
  {
    tier: 'B',
    path: 'src/pages/Home/components/ChatModal.jsx',
    note: '무니 채팅 모달',
  },
  {
    tier: 'B',
    path: 'src/pages/Home/components/FlightOriginSelector.jsx',
    note: '출발 공항 선택',
  },
  {
    tier: 'B',
    path: 'src/pages/Home/components/GlobeFaceRegionRail.jsx',
    note: '지구본 면·지역 레일',
  },
  {
    tier: 'B',
    path: 'src/pages/Home/components/stayDateControls.jsx',
    note: '숙소 날짜·인원 컨트롤',
  },
  {
    tier: 'B',
    path: 'src/components/PlaceCard/tabs/PlannerTab.jsx',
    note: '플래너 탭',
  },
  {
    tier: 'B',
    path: 'src/components/PlaceCard/tabs/ReviewsTab.jsx',
    note: '리뷰 탭',
  },
  {
    tier: 'C',
    path: 'src/shared/components/SiteUpdateBanner.jsx',
    note: '배포·시스템 공지',
  },
  {
    tier: 'C',
    path: 'src/shared/Auth/Login.jsx',
    note: '로그인',
  },
  {
    tier: 'C',
    path: 'src/shared/Auth/SignUp.jsx',
    note: '회원가입',
  },
  {
    tier: 'C',
    path: 'src/pages/Korea/index.jsx',
    note: '한국 허브 UI (본문 ko SSOT)',
  },
  {
    tier: 'C',
    path: 'src/pages/Korea/FestivalDetailSheet.jsx',
    note: '축제 상세 UI (본문 ko SSOT)',
  },
];

/** SearchDiscovery 하위 — 탐색 카드·섹션 */
export const I18N_AUDIT_P0_SEARCH_DISCOVERY = [
  'src/pages/Home/components/SearchDiscovery/SearchSuggestionList.jsx',
  'src/pages/Home/components/SearchDiscovery/SpotThumbnailCard.jsx',
  'src/pages/Home/components/SearchDiscovery/PackageThumbnailCard.jsx',
  'src/pages/Home/components/SearchDiscovery/CurationSection.jsx',
  'src/pages/Home/components/SearchDiscovery/TripLinkSectionCard.jsx',
];

export const I18N_AUDIT_P0_ALL = [
  ...I18N_AUDIT_P0,
  ...I18N_AUDIT_P0_SEARCH_DISCOVERY.map((path) => ({
    tier: 'A',
    path,
    note: '탐색 하위',
  })),
];
