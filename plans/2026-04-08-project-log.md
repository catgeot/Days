# 2026-04-08 프로젝트 진행 로그

## 📝 오늘 진행한 작업

### 1. SEO 최적화 및 GA SPA 추적 구현 (Phase 1)
- **커밋**: `31c7ee2` feat(seo): GA SPA 페이지뷰/탭 추적 및 사이트맵용 숨김 내부 링크 추가
- **작업 내용**:
  - `src/App.jsx`에 `RouteTracker` 컴포넌트를 추가하여 `useLocation` 기반의 SPA 페이지뷰 추적(GA4) 기능 구현.
  - `src/components/PlaceCard/modes/PlaceCardExpanded.jsx` 내에 탭이 변경될 때마다 `gtag('event', 'tab_view')`가 발생하도록 이벤트 트래킹 추가.
  - `src/pages/Home/index.jsx`의 메인 컨테이너 최하단에 SEO 크롤링을 지원하기 위한 `TRAVEL_SPOTS` 전체 목록 및 `/explore` 관련 정적 링크들을 숨김(`<div style={{ display: 'none' }}>`) 요소로 추가.
  - 리스트 렌더링 시 고유키 중복(`berlin`) 에러를 방지하기 위해 `key={`${spot.slug || spot.id}-${index}`}` 구조로 보강 완료.
- **예상 효과**:
  - 기존 구글 애널리틱스에서 누락되던 React 라우터 기반 페이지 전환 정보가 100% 정상 로깅됨.
  - 구글 검색 봇이 메인 페이지 방문 시 사이트맵 구조를 더 깊고 촘촘하게 파악하여 딥링크(`place/:slug`) 색인률 향상 기대.

### 2. `/explore` 페이지 신설 및 정적 라우팅 구성 (Phase 2.1)
- **커밋**: `git commit -m "feat(explore): 신규 explore 페이지 개발 및 테마/대륙별 정적 라우팅 연동"`
- **작업 내용**:
  - `src/pages/Explore/index.jsx` 컴포넌트 신규 작성 (검색, 테마 및 대륙 필터링, 결과 그리드 표시).
  - `src/App.jsx`에 12개의 `/explore/*` 정적 라우트 추가 완료 (`paradise`, `nature`, `urban`, `culture`, `adventure`, `asia`, `europe`, `americas`, `oceania`, `africa`, `middle-east`).
  - `src/pages/Home/components/HomeUI.jsx`에서 검색창 클릭 시 기존의 모달(`SearchDiscoveryModal`) 대신 `/explore` 페이지로 직접 리다이렉트되도록 `useNavigate` 적용.
  - 기존 `HomeUI`에서 `SearchDiscoveryModal` 렌더링 부분을 제거하고 정리.
  - 빌드(`npm run build`) 테스트를 통해 정상 컴파일 확인 완료.
- **예상 효과**:
  - 12개의 Explore 정적 라우트가 추가되어 사이트맵 및 SEO 크롤링 시 개별 테마와 대륙에 대한 인덱싱이 가능해짐.
  - 사용자가 검색 및 탐색 결과를 독립된 URL로 공유 가능해짐.

### 3. `/explore` 모달 방식 딥링크 라우팅 롤백 및 동기화 최적화
- **커밋**: `git commit -m "refactor(explore): 분리된 Explore 페이지 제거 및 Home 모달 연동 방식으로 롤백, 2-Depth URL 상태 동기화"`
- **작업 내용**:
  - `src/pages/Explore` 하위 파일 및 컴포넌트 제거. 3D 지도를 다시 렌더링하는 UX/성능 저하 방지를 위해 라우팅 분리를 취소.
  - `src/App.jsx`에서 `<Route path="explore/:filter1/:filter2" element={null} />` 등 `Home`의 자식 라우트로 재배치.
  - `src/pages/Home/components/SearchDiscoveryModal.jsx` 내부에서 URL(e.g., `/explore/asia/paradise`)을 읽어와 `selectedContinent`, `selectedTheme`, `selectedSubGroup` 상태를 2-Depth까지 자동 동기화하도록 구현.
  - 카테고리 탭 클릭 시 `navigate`를 통해 URL이 실시간 업데이트되어 딥링크 공유 및 SEO 수집 가능.
  - `SpotThumbnailCard` 재활용을 통해 기존 Unsplash Source API 중단으로 인한 썸네일 누락 버그 자연스럽게 해결(`usePlaceGallery` 백엔드 캐시 연동 활용).
  - `onSelect` 핸들러에서 발생하던 불필요한 `onClose()` 호출을 삭제하여 장소 클릭 시 홈 화면으로 튕기는 Race Condition 버그 완벽 수정.
- **예상 효과**:
  - 끊김 없이 3D 지도를 배경으로 부드럽게 열리는 모달 경험 복구.
  - 아시아 >> 휴양 등 세부 카테고리까지 고유의 URL을 가지게 되어 검색엔진 친화적 및 유저 공유가 용이함.

### 4. PlaceCard 탭 네이밍 변경 및 Path 기반 라우팅 구현 (Phase 2.2-2.3)
- **커밋**: `2e5be46` feat(seo): PlaceCard 탭 명칭 변경(reviews, planner) 및 URL Path 라우팅 구조 도입
- **작업 내용**:
  - `src/App.jsx` 라우트에 `<Route path="place/:slug/:tab" element={<PlaceCard />} />` 추가하여 탭별 고유 URL Path 제공.
  - `src/components/PlaceCard/index.jsx`에서 `useParams`로 `tab`을 파싱하여 탭에 맞는 동적 SEO 태그 적용 로직 추가.
  - 기존 쿼리 파라미터(`?tab=...`)를 제거하고 `react-router-dom`의 `navigate()`를 사용한 URL 변경 로직을 `PlaceCardExpanded.jsx`에 적용.
  - 주요 탭 및 훅의 명칭과 파일명 변경 (`Logbook` -> `Reviews`, `Toolkit` -> `Planner`).
  - `vite.config.js`에 각 여행지의 6개 탭(wiki, reviews, gallery, video, planner 등)을 조합한 1,200개 이상의 사이트맵 자동 생성 로직 반영.
  - 프로필 이미지 렌더링 시 발생하는 `http://` 카카오 URL Mixed Content 경고 수정을 위해 강제 `https://` 변환 로직 추가 (`ReviewsTab.jsx`, `UserProfile.jsx`, `Sidebar.jsx`).
- **예상 효과**:
  - 각 탭 뷰(리뷰, 플래너 등)가 완전히 고립된 개별 URL을 가져 구글 검색 엔진에 색인 가능 (사이트맵 1200+개 제출 예정).
  - 유저들이 특정 탭(예: "제주도 리뷰")의 URL을 복사하여 외부 공유 시 원활하게 목적 탭으로 랜딩.

### 5. 여행 플래너 탭 데이터 무한 갱신 및 Race Condition 버그 수정
- **커밋**: `20a5cfe` fix(planner): 탭 전환 시 플래너 데이터 무한 갱신 및 Race Condition 버그 완벽 수정
- **작업 내용**:
  - `src/components/PlaceCard/hooks/usePlannerData.js`에서 기존 `TOOLKIT` 모드 체크 로직을 최신 명칭인 `PLANNER` 로 변경.
  - React 18의 렌더링 사이클에 대응하기 위해 `usePlannerData.js`에 렌더링 중 동기적 상태 업데이트 패턴(Render Phase State Update)을 도입하여, 탭 진입 시 `isPlannerLoading` 플래그가 비동기적 딜레이 없이 즉시 `true`가 되도록 보강.
  - `src/components/PlaceCard/tabs/PlannerTab.jsx` 내부에서 `isPlannerLoading`이 `false`가 될 때 `isRemoteUpdating`을 강제로 해제해버리던 논리적 오류(악성 useEffect)를 제거하여 무한 자동 생성 트리거 원인을 차단.
  - 백엔드 Edge Function 에러 반환 시에도 클라이언트의 로딩 상태(`isRemoteUpdating`)가 정상 해제되도록 `else` 예외 처리 보강.
- **예상 효과**:
  - DB에 이미 저장된 플래너 툴킷 데이터가 있을 경우 불필요한 AI 생성 재호출을 방지하여 API 비용을 절감하고, 사용자에게 불필요한 대기 시간을 없앰.
  - 플래너 탭의 안정성과 사용성 대폭 개선.

---

## 🚀 다음 세션 진행 가이드 (Next Steps)
1. **[Phase 8-3] 복잡한 여행지 시스템 연동 고도화 (현재 진행 대기)**:
   - 검색 시스템 모달과 연동하여 복잡한 여행지 탐색 리스트 기획 및 구현
   - 생성된 툴킷에 파트너사(제휴) 예약 링크 자동 연동 고도화 (Phase 8-4)
2. **[Phase 9-2] 여행지 데이터 100개 추가 (Phase 2 대기)**
3. **[Phase 10] 백엔드 프롬프트 개선 및 A/B 테스트 검증**
