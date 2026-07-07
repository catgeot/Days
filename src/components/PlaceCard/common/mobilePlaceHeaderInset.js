/**
 * 모바일에서 `PlaceChatPanel` 1행 고정 헤더 아래로 스크롤 본문·액션 탭이 시작되도록 하는 패딩.
 * 수정 전 참고: 갤러리 그리드 pt-[96px](6rem), 리뷰·위키 등은 동일 스크롤 컨테이너에 적용, 플래너 116px 등 구간별 상이.
 * 요청 범위 6~6.5rem 중간값 6.25rem(100px) + safe-area.
 * 가로(landscape·max-md): 헤더·2차 nav 축소 → 3.25rem + safe-area.
 */
export const mobilePlaceHeaderScrollPadding =
  'pt-[calc(6.25rem+env(safe-area-inset-top,0px))] max-md:landscape:pt-[calc(3.25rem+env(safe-area-inset-top,0px))]';

/** 모바일 하단 고정 chrome(연관 키워드·탭) 아래 여백 — 가로에서 축소 */
export const mobilePlaceFooterScrollPadding =
  'pb-28 max-md:landscape:pb-10';
