/**
 * 모바일 PlaceCard — 세로/가로 chrome·스크롤 inset SSOT
 * landscape-phone = Tailwind variant: max-width 1023px + landscape + max-height 500px (휴대 가로만)
 */

/** 가로 immersive — 짧은 landscape phone에서만 chrome 숨김 (1023×900 tablet landscape 제외) */
export const mobileLandscapeChromeHidden = 'landscape-phone:hidden';

/** 세로 — PlaceChatPanel 고정 헤더 높이 · 가로 immersive에서는 0 */
export const mobilePlaceHeaderInsetHeight =
  'calc(6.25rem + env(safe-area-inset-top, 0px))';

/**
 * 세로 — 스크롤 컨테이너 **밖** spacer (iOS: padding-top 스크롤 영역이 헤더 터치 가로채기 방지)
 * overflow-y-auto 요소에는 mobilePlaceHeaderScrollPadding 대신 본 클래스 + flex-1 스크롤 영역 사용.
 */
export const mobilePlaceHeaderSpacerClass =
  'shrink-0 lg:hidden landscape-phone:hidden h-[calc(6.25rem+env(safe-area-inset-top,0px))] pointer-events-none select-none';

/** 비스크롤·로딩 레이아웃용 — 스크롤 surface에는 spacer 사용 */
export const mobilePlaceHeaderScrollPadding =
  'pt-[calc(6.25rem+env(safe-area-inset-top,0px))] landscape-phone:pt-[env(safe-area-inset-top,0px)]';

/** 세로 — 하단 FAB·연관바 여유 · 가로 — safe-area만 */
export const mobilePlaceFooterScrollPadding =
  'pb-24 landscape-phone:pb-[env(safe-area-inset-bottom,0px)]';

/** 리뷰 — 하단 연관 칩(pb-8)에 빈 목록 문구가 가리지 않게 */
export const mobilePlaceReviewsFooterScrollPadding =
  'pb-40 landscape-phone:pb-[env(safe-area-inset-bottom,0px)]';

/** 갤러리 그리드 — 연관바가 조금 더 높음 */
export const mobilePlaceGalleryFooterScrollPadding =
  'pb-28 landscape-phone:pb-[env(safe-area-inset-bottom,0px)]';
