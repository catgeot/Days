/**
 * 모바일에서 `PlaceChatPanel` 1행 고정 헤더 아래로 스크롤 본문·액션 탭이 시작되도록 하는 패딩.
 * 수정 전 참고: 갤러리 그리드 pt-[96px](6rem), 리뷰 64px, 플래너 116px, 위키는 구간별 상이.
 * 요청 범위 6~6.5rem 중간값 6.25rem(100px) + safe-area.
 */
export const mobilePlaceHeaderScrollPadding =
  'pt-[calc(6.25rem+env(safe-area-inset-top,0px))]';
