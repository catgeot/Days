# 2026-04-18 프로젝트 진행 로그

[⬅️ 이전 로그 보기 (2026-04-17)](./2026-04-17-project-log.md)

## 금일 작업 요약

### 1. 트립링크 패키지 연동: 홈 탐색창 인피드(In-feed) 큐레이션 고도화
*   **변경 배경**: 기존 자유여행 카드만 있던 홈 탐색 창(`SearchDiscoveryModal`)에 상업적인 패키지 상품 리스트를 전면 노출할 경우 발생할 수 있는 유저 거부감을 최소화하기 위해, **하이브리드 인피드(In-feed) 광고 방식** 도입.
*   **작업 내용**:
    1.  **큐레이션 테마 3종 변경**: 기획서에 맞춰 가족/효도(아시아/단거리), 장거리/유럽(유럽/미주), 에어텔/올인클루시브(휴양)로 테마 제목 및 문구, 아이콘 수정.
    2.  **데이터 타겟팅 적용**: 각 테마의 성격에 맞는 주요 목적지(다낭, 삿포로, 파리, 괌, 몰디브 등)를 `familyTargets`, `longhaulTargets`, `resortTargets`로 명시하여 큐레이션 데이터 추출 로직(`curationData`) 업데이트.
    3.  **데이터 구조체 생성**: `src/pages/Home/data/tripLinkPackages.js` 파일을 신설하여 테마별로 제휴 링크를 삽입할 수 있는 `TRIPLINK_PACKAGES` 구조체 템플릿(데이터 2개씩) 세팅.
    4.  **UI 컴포넌트 개발**: 기존 `SpotThumbnailCard`를 베이스로 하되, 외부 링크로 바로 이동하며 `[트립링크 단독 특가]` 등의 배지를 포함한 `PackageThumbnailCard.jsx` 신규 컴포넌트 개발.
    5.  **인피드 배치**: `CurationSection.jsx`를 수정하여, 가로 스크롤 여행지 카드 리스트 중 **2번째(index 1)와 6번째(index 5) 자리**에 트립링크 패키지 네이티브 카드가 자연스럽게 삽입되도록 로직 연동 완료.

### 2. 누락된 트립링크 패키지 타겟 목적지 DB 추가
*   **변경 배경**: 홈 탐색창 큐레이션 테마(`familyTargets`, `longhaulTargets`, `resortTargets`)에 선언된 목적지 중 기존 `travelSpots.js`에 누락된 핵심 패키지 여행지들을 추가하기 위함.
*   **작업 내용**:
    *   총 10개 장소(다낭, 삿포로, 오사카, 후쿠오카, 칭다오, 두브로브니크, 사이판, 푸꾸옥, 코타키나발루, 호놀룰루)에 대한 `id`, `slug`, `lat`, `lng`, `categories`, `keywords` 등 완전한 JSON 데이터 구조체 작성.
    *   `travelSpots.js` 배열 끝에 해당 10개 데이터를 성공적으로 병합 완료.
    *   (추가 요청) 추가로 사용자 피드백에 따라 누락된 10개 장소(북해도, Sant Joan, 미야코지마, Kala Patthar, 페로 제도, 키리바시, 카보베르데, 블레드, 라스페치아, 코토르) 신규 DB 데이터로 병합 완료.

### 3. 홈 화면 핫딜 배너 팝업 기획 및 개발 (취소됨)
*   **변경 배경**: 긴급 모객 및 특가 상품 홍보를 위한 트립링크 배너 노출.
*   **작업 내용**:
    *   트립링크 링크 방식(단축 URL, iframe, 이미지 링크) 분석 후, UI 반응형과 디자인 일관성을 위해 단축 URL 방식을 메인으로 채택하는 `triplink-hotdeal-plan.md` 기획서 작성.
    *   우측 상단 팝업 컴포넌트(`HotDealBanner.jsx`)를 구현하고 로컬 스토리지 기반 '오늘 하루 보지 않기' 기능을 완성했으나, **사용자의 피드백("홈 화면에서는 조용한 탐색 컨셉 훼손 우려로 링크 팝업 제거")을 수용하여 최종적으로 롤백 및 삭제 처리**함.

### 4. 지오코딩 검색 결과 우선순위 필터링 (스코어링) 도입
*   **변경 배경**: "미야 코지마"와 같이 지오코딩 API (Nominatim) 검색 시, 관광 목적의 섬/도시보다 대도시의 행정구(예: 오사카 미야코지마 구)가 우선적으로 반환되어 장소 카드 확장 시 엉뚱한 정보가 노출되는 이슈 해결.
*   **작업 내용**:
    *   `src/pages/Home/lib/geocoding.js` 파일의 `getCoordinatesFromAddress` 함수 내에 Nominatim API 응답 결과를 분석하는 `calculatePlaceScore` 함수 신설.
    *   `island`, `city`, `town`, `tourism` 속성에는 가점을, `suburb`, `borough`, `station` 속성에는 감점을 부여.
    *   동일 검색어(예: 미야코지마)에 대해 행정 구역(오사카 구)보다 실제 여행지(오키나와 섬)가 최우선으로 선택되도록 재정렬(Sorting) 로직 적용 및 안정성(null 방어) 확보.

### 5. 탐색창(SearchDiscoveryModal) 검색 오타 검증 로딩 스피너 구현 및 라우팅 안정화
*   **변경 배경**: 사용자가 존재하지 않는 지명이나 오타를 입력했을 때, 지오코딩 API 실패 후 AI 교정 프록시를 타는 동안 지연 시간(1~3초)이 발생함. 대기 시간 동안 아무런 피드백이 없어 멈춘 것으로 오인할 수 있는 UX 문제를 해결.
*   **작업 내용**:
    *   `SearchDiscoveryModal.jsx` 내부에 `isAILoading` 상태를 신설하고, 검색 트리거(Enter 및 아이콘 클릭) 발생 시 비동기 대기(`await onSearch`)를 하며 모달 내부에 풀스크린 로딩 스피너("AI가 목적지를 탐색하고 있습니다...") 오버레이를 노출.
    *   비동기 적용 후 발생한 버그(로딩 후 장소 카드가 뜨자마자 모달 닫힘과 동시에 `index.jsx`의 `useEffect` 초기화 로직이 동작해 카드가 바로 닫히는 현상) 해결.
    *   `navigate` 시 기존 URL Query Parameter를 이용한 방식 대신 `state: { fromSearch: true }`를 넘기는 방식으로 변경하고, 초기화 훅에서 이를 예외 처리하도록 구조를 개선하여 안정적인 장소 카드 진입 UX 구축.

## 변경된 파일 목록
*   `src/pages/Home/components/SearchDiscoveryModal.jsx` (로딩 스피너 UI 및 비동기 처리 추가)
*   `src/pages/Home/index.jsx` (onSearch 비동기 로직 적용 및 예외 라우팅 처리 추가)
*   `src/pages/Home/components/SearchDiscovery/CurationSection.jsx` (인피드 광고 삽입 로직)
*   `src/pages/Home/components/SearchDiscovery/PackageThumbnailCard.jsx` (신규 파일)
*   `src/pages/Home/data/tripLinkPackages.js` (신규 파일)
*   `src/pages/Home/data/travelSpots.js` (신규 목적지 10개 추가)
*   `plans/triplink-hotdeal-plan.md` (핫딜 배너 팝업 기획 문서 추가)
*   `src/pages/Home/lib/geocoding.js` (지오코딩 검색 결과 스코어링 로직 추가)

## Next Steps (다음 세션 작업)
*   [x] **완료**: 금일 제안된 테마별 타겟 여행지 중 `travelSpots.js`에 누락된 목적지(10개: 다낭, 삿포로, 오사카, 후쿠오카, 칭다오, 두브로브니크, 사이판, 푸꾸옥, 코타키나발루, 호놀룰루) 파악 및 신규 데이터 추가.
*   [x] **취소**: 홈 화면 우측 상단 핫딜/골프 동적 배너 팝업 UI 신규 구현. (사용자 피드백 반영: 홈 화면의 조용한 탐색 컨셉 훼손 우려로 링크 팝업 노출 취소)
*   [ ] `tripLinkPackages.js` 내 더미 데이터를 트립링크에서 실제로 생성한 링크 및 최신 상품 정보로 교체.
*   [ ] 향후 시험 종료 후, 각 여행지 상세 카드(`PlaceCard`) 진입 시 해당 여행지의 패키지 상품을 동적 링크로 렌더링하는 아키텍처 고도화 검토.
