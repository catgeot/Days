# 2026-05-04 프로젝트 일지

이전: [`plans/2026-04-28-project-log.md`](2026-04-28-project-log.md)

- 탐색(SearchDiscovery) **첫 번째 큐레이션**(가족 여행) 횡스크롤 **맨 앞 슬롯**에 트립닷컴 호텔 세일 제휴 카드(`TRIPCOM_EXPLORE_LEADING_CARD`) 연결. 카피는 트립닷컴 제공 문구(단기 여행·호텔 최대 80% 할인 등), 배경 이미지는 Unsplash 세로 크롭(URL, `constants.js`).
- `PackageThumbnailCard`에 제휴 라벨(`affiliateSource`)·`imageFit`/`imageObjectPosition`/`omitOverlayTitles`/intrinsic 분기 등 반영. 상단 탭 옆 배너 실험은 제거하고 썸네일 방식으로 확정.
- PlaceCard **플래너 호텔 링크**: 트립닷컴 동적 생성은 롤백하고 기본을 다시 **마이리얼트립** 동적 검색(`generateMrtLink` / `MrtDynamicLink`, 출발 전 체크리스트는 `MrtTimelineAction`)으로 통일. 트립닷컴은 `city` ID·제휴 파라미터 조합이 여행지마다 달라 유지보수 부담이 커서, **예외 여행지만** `src/utils/affiliate.js`의 `PLANNER_TRIPCOM_HOTEL_OVERRIDES`(slug 또는 한글 `name` → 제휴에서 받은 **호텔 목록 전체 URL**)로 연결하는 방식으로 정리. `getTripcomHotelOverrideUrlForLocation`이 있을 때만 Trip.com 직링크, 메인 숙소 폴백·체크리스트에 반영. `PreTravelChecklist`는 `location` prop으로 slug 매칭.
- 문서: `.ai-context.md` 5절·본 일지 갱신.
- PlaceCard **갤러리 탭**: 여러 여행지를 빠르게 이동할 때 **여행지는 바뀌는데 갤러리만 이전 장소 사진이 유지**되던 문제 수정. `src/components/PlaceCard/hooks/usePlaceGallery.js` — (1) 중복 요청 스킵을 `primaryQuery`만이 아니라 **장소 식별자+쿼리(`fetchKey`)** 로 판단, (2) Unsplash/Supabase/Pexels **비동기 경합** 시 오래된 응답 무시(`galleryLoadSeqRef` / `runId`), (3) `sessionStorage` 갤러리 캐시 키에 장소 키 포함. 사용자 동작 확인 후 반영.
- **LogBook 공개 피드·작성자**: 대시보드 탐험 모드·공개 뷰어·명소 리뷰탭 **관련 블로그**에 작성자 라벨 — `utils/reportAuthor.js`에서 `profiles` 배치 조회 후 `author_label`, 미설정 시 `user_id` 앞 8자.
- **필명(프로필)**: `usePenName` 훅으로 `profiles.display_name` 등록·저장(사이드바 `UserProfile`, `/blog/write`). 처음에는 `updated_at` 미존재·RLS INSERT 부족으로 저장 오류 가능 → DB에 `updated_at` 추가, INSERT 정책 `WITH CHECK (auth.uid() = id)` 권장(운영에서 적용).
- **필명 UI 동기화**: 사이드바와 글쓰기가 각각 `usePenName`을 쓰면 상태가 갈라져 **`PenNameProvider`를 `DailyLayout`에 두고 `usePenNameContext`로 통합**. `Sidebar`는 레이아웃에서 받은 `user`만 사용(중복 `getUser` 제거).
- 문서: `.ai-context.md` 3·5절·본 일지 갱신.
