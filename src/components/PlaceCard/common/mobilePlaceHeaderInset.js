/**
 * 모바일 PlaceCard — 세로/가로 chrome·스크롤 inset SSOT
 */

/** 가로 immersive — 모바일 chrome(헤더·푸터·FAB·연관바) 숨김 */
export const mobileLandscapeChromeHidden = 'max-md:landscape:hidden';

/** 세로 — PlaceChatPanel 고정 헤더 높이 · 가로 immersive에서는 0 */
export const mobilePlaceHeaderInsetHeight =
  'calc(6.25rem + env(safe-area-inset-top, 0px))';

/**
 * 세로 — 스크롤 컨테이너 **밖** spacer (iOS: padding-top 스크롤 영역이 헤더 터치 가로채기 방지)
 * overflow-y-auto 요소에는 mobilePlaceHeaderScrollPadding 대신 본 클래스 + flex-1 스크롤 영역 사용.
 */
export const mobilePlaceHeaderSpacerClass =
  'shrink-0 md:hidden max-md:landscape:hidden h-[calc(6.25rem+env(safe-area-inset-top,0px))] pointer-events-none select-none';

/** 비스크롤·로딩 레이아웃용 — 스크롤 surface에는 spacer 사용 */
export const mobilePlaceHeaderScrollPadding =
  'pt-[calc(6.25rem+env(safe-area-inset-top,0px))] max-md:landscape:pt-[env(safe-area-inset-top,0px)]';

/** 세로 — 하단 FAB·연관바 여유 · 가로 — safe-area만 */
export const mobilePlaceFooterScrollPadding =
  'pb-24 max-md:landscape:pb-[env(safe-area-inset-bottom,0px)]';

/** 갤러리 그리드 — 연관바가 조금 더 높음 */
export const mobilePlaceGalleryFooterScrollPadding =
  'pb-28 max-md:landscape:pb-[env(safe-area-inset-bottom,0px)]';
