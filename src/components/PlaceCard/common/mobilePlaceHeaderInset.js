/**
 * 모바일 PlaceCard — 세로/가로 chrome·스크롤 inset SSOT
 */

/** 가로 immersive — 모바일 chrome(헤더·푸터·FAB·연관바) 숨김 */
export const mobileLandscapeChromeHidden = 'max-md:landscape:hidden';

/** 세로 — PlaceChatPanel 고정 헤더 아래 본문 시작 · 가로 — safe-area만 */
export const mobilePlaceHeaderScrollPadding =
  'pt-[calc(6.25rem+env(safe-area-inset-top,0px))] max-md:landscape:pt-[env(safe-area-inset-top,0px)]';

/** 세로 — 하단 FAB·연관바 여유 · 가로 — safe-area만 */
export const mobilePlaceFooterScrollPadding =
  'pb-24 max-md:landscape:pb-[env(safe-area-inset-bottom,0px)]';

/** 갤러리 그리드 — 연관바가 조금 더 높음 */
export const mobilePlaceGalleryFooterScrollPadding =
  'pb-28 max-md:landscape:pb-[env(safe-area-inset-bottom,0px)]';
