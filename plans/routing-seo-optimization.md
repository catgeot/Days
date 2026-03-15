# Routing 및 SEO 최적화 아키텍처 개선안

사용자의 제안에 따라 SEO 최적화와 공유 용이성 향상을 위해 라우팅 구조를 전면 개편합니다.

## 1. 리포트(DailyReport) 페이지의 주소 변경 (`/report` -> `/blog`)

현재 사용자의 여행 기록을 작성하고 보여주는 메뉴의 주소가 `/report`로 되어 있습니다. 이는 내부 시스템 보고서 같은 느낌을 주며 SEO에도 다소 불리합니다. 이를 범용적이고 친숙한 `/blog`로 변경합니다.

- **대상 라우트**:
  - `/report` -> `/blog` (대시보드 메인)
  - `/report/write` -> `/blog/write` (새 글 작성)
  - `/report/write/:id` -> `/blog/write/:id` (글 수정)
  - `/report/:id` -> `/blog/:id` (상세 글 보기)
- **적용 방안**:
  1. `src/App.jsx`의 라우트 패스 수정
  2. 시스템 내 모든 `navigate('/report...')` 및 `<Link to="/report...">`를 `/blog...`로 일괄 치환 (전역 검색 후 Replace)
  3. UI상에 노출되는 메뉴명이나 텍스트 중 "리포트"라는 단어도 문맥에 맞게 "블로그", "여행기", "Logbook" 등으로 점진적 수정 권장. (현재는 주소 변경 위주로 진행)

## 2. 장소 카드(PlaceCard) 탭 딥링킹(Deep Linking) 최적화

현재 장소 카드는 `/place/:slug` 하나의 주소를 공유하며, 내부의 갤러리(GALLERY), 영상(VIDEO), 백과(WIKI) 탭은 React 내부의 `useState(mediaMode)` 상태로만 관리되고 있습니다.
이로 인해 다음과 같은 문제점이 발생합니다.
1. "파리의 백과사전 정보"를 친구에게 카카오톡으로 공유할 수 없음 (무조건 갤러리로만 열림)
2. 검색 엔진(Google, Naver)이 영상 페이지나 위키 페이지를 개별 페이지로 인식하여 수집할 수 없음 (SEO 악화)
3. 브라우저 '뒤로 가기' 버튼을 누르면 이전 탭으로 돌아가는 게 아니라 아예 장소 카드가 닫혀버림 (UX 저하)

이를 해결하기 위해 탭 상태를 URL Parameter(Query String)와 연동합니다.

- **URL 구조 설계안**:
  - 기존: `/place/paris` (내부 상태: GALLERY)
  - 변경: `/place/paris?tab=gallery` (기본값)
  - 위키 탭 클릭 시: `/place/paris?tab=wiki`
  - 비디오 탭 클릭 시: `/place/paris?tab=video`
- **구현 방안 (`src/components/PlaceCard/modes/PlaceCardExpanded.jsx`)**:
  1. `react-router-dom`의 `useSearchParams` 훅 도입
  2. 내부 상태 `const [mediaMode, setMediaMode] = useState('GALLERY')`를 Query Parameter 동기화 방식으로 교체
  3. `setMediaMode(newMode)` 호출 시, `setSearchParams({ tab: newMode.toLowerCase() }, { replace: true })`를 실행하도록 수정
  4. 초기 마운트 시 URL에 `?tab=wiki`가 있으면 `mediaMode`의 초기값을 `WIKI`로 세팅.

이러한 개선을 통해 사이트의 공유 편의성(Shareability)이 대폭 향상되고, 검색 엔진 크롤러가 각 장소의 미디어별 특화 페이지를 독립적으로 인덱싱할 수 있게 됩니다.

---
위 계획에 따라 Code 모드에서 일괄 변경 및 리팩토링을 수행하겠습니다.