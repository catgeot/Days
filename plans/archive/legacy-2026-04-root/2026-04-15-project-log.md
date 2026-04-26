[⬅️ 이전 로그 보기 (2026-04-14)](./2026-04-14-project-log.md)

# 2026-04-15 프로젝트 진행 로그

## 1. 진행 내용

### [Phase 8-5] 스마트 트래블 툴킷(플래너 탭) UX 개선 및 제휴 서비스 확장
- **작업 목적**:
  - 플래너 탭을 단순한 정보 제공처가 아닌 **"A to Z 완벽한 준비"** 경험을 제공하는 종합 여행 준비 허브로 고도화함.
  - 가독성을 저해하는 긴 나열식 UI를 탈피하고, 여정 타임라인과 직관적인 액션 버튼을 연결하여 전환율을 높이고자 함.
- **주요 구현 사항 (`src/components/PlaceCard/tabs/PlannerTab.jsx`)**:
  - **신규 제휴 링크 및 마이크로카피 최적화**:
    - `여행자 보험 비교` (Tourmoz), `에어비앤비 숙소`, `근처 짐 보관소` (Bounce), `인기 레스토랑 예약` (TheFork) 등 신규 딥링크 버튼 추가.
    - 버튼 텍스트에 지역명을 동적으로 주입하되, 모바일 환경에서 텍스트가 줄바꿈되지 않도록 `truncate` 처리 및 문구 간소화 적용 (예: "{로마} 인기 투어", "{라로통가} 숙소 검색").
    - 이집트 e-Visa 공식 포털, 인도 e-Visa 공식 신청 링크를 `OFFICIAL_VISA_LINKS` 매핑 테이블에 하드코딩으로 추가하여 할루시네이션(외교부 폴백) 방지.
  - **3단계 시각적 그룹화(섹션화) 레이아웃 적용**:
    - 기존 1단 그리드로 나열되던 정보를 3개의 의미 단위 섹션으로 분리하여 가독성 개선:
      1. **🛫 출발 전 필수 준비**: 비자, 항공권, 숙소, 안전 및 보험
      2. **🛬 현지 도착 및 이동**: 공항 픽업, 페리, 유심/와이파이
      3. **🌴 현지 100% 즐기기**: 교통 패스, 앱, 지도/명소
  - **상세 여정 플래너(JourneyTimeline) 내 액션 버튼 동적 삽입**:
    - AI가 생성한 타임라인 각 단계(`step.title`)에 특정 키워드(예: '공항/픽업', '페리', '숙소', '출발/항공')가 포함되어 있을 경우, 해당 단계 바로 옆에 소형 **[예약하기] 버튼**이 즉각적으로 노출되도록 `getActionForStep` 함수 추가.
- **기대 효과**:
  - 사용자는 여행 준비 단계별로 필요한 액션을 명확히 인지하게 되어 서비스 체류 시간과 제휴 수익 전환율(CTA)이 동반 상승할 것으로 기대.
  - 라로통가 같은 다단계 복잡한 여행지의 경우 타임라인 단계에서 바로 예약을 진행할 수 있어 UX가 극대화됨.

## 2. 추가 진행 내용 (마이리얼트립 파트너스 연동 및 리팩토링)

### [Phase 8-7] 플래너 탭(PlannerTab) 전면 컴포넌트 리팩토링
- **작업 목적**:
  - `PlannerTab.jsx` 파일이 920줄 이상으로 비대해져 유지보수성이 저하됨에 따라, 컴포넌트/로직/상수를 철저하게 분리하는 전면 구조 개편 진행.
- **주요 구현 사항 (`src/components/PlaceCard/tabs/planner/`)**:
  - **상수 분리**: `constants.js` 생성 (`THEME_COLORS`, `LOADING_MESSAGES`, `OFFICIAL_VISA_LINKS` 등 분리)
  - **비즈니스 로직 분리**: `utils.js` 생성 (`getMultiLinks` 등 복잡한 제휴 링크 발급 로직과 텍스트 정제 함수 분리)
  - **서브 컴포넌트 분리**: `components/` 디렉토리를 신설하여 하위 UI 요소를 개별 파일로 분할
    - `ToolkitCard.jsx`: 개별 카드 컴포넌트
    - `JourneyTimeline.jsx`: 여정 타임라인 및 액션 버튼 로직 (`getActionForStep`)
    - `PreTravelChecklist.jsx`: 준비사항 체크리스트
    - `MrtDynamicLink.jsx` / `MrtTimelineAction.jsx`: 마이리얼트립 동적 링크 버튼
    - `HotelWidget.jsx`: 임시 비활성 위젯
  - **메인 래퍼 최적화**: 메인 파일 `PlannerTab.jsx`는 상태 관리와 전체 레이아웃 배치만 담당하도록 350줄 수준으로 대폭 축소.
- **기대 효과**:
  - 기능 추가나 디자인 수정 시 해당 파일만 찾아서 빠르고 안전하게 수정 가능.
  - 전반적인 가독성과 코드 유지보수성이 획기적으로 향상됨.

### [Phase 8-6] 링크 전략 고도화 및 파트너사 전환 (마이리얼트립 도입)
- **작업 목적**:
  - 전환율이 낮거나 수익이 발생하지 않는 기존 링크(에어비앤비 등)를 제거하고, 전 세계 강력한 인프라를 갖춘 **마이리얼트립(MyRealTrip) 제휴 링크**로 교체함.
  - 마이리얼트립 파트너스 API(`MYLINK:WRITE`)를 활용하여 동적 여행지별 제휴 링크를 자동 발급받는 시스템(PoC) 구축.
- **주요 구현 사항**:
  - `supabase/functions/mrt-link-generator/index.ts` Edge Function 생성: 
    - 브라우저에서 직접 API를 호출하지 않고 백엔드를 통해 마이리얼트립 파트너스 API를 호출하여 단축 제휴 링크를 발급받음.
    - API 인증 실패나 서버 장애 시 서비스가 크래시되지 않도록, 원본 마이리얼트립 검색 결과 URL로 자동 Fallback 되도록 견고하게 구현.
  - `src/utils/affiliate.js`: `generateMrtLink(query)` 유틸리티 함수 추가 (비동기 처리).
  - `src/components/PlaceCard/tabs/PlannerTab.jsx` 고도화:
    - 비동기로 링크를 발급받아 상태를 업데이트하는 `<MrtDynamicLink />` 및 `<MrtTimelineAction />` 컴포넌트 신규 도입.
    - 숙박(`accommodation`) 파트의 **구글 호텔 검색**과 **에어비앤비** 링크를 삭제하고, **[숙소 검색]**과 **[한인민박 검색]** 두 개의 마이리얼트립 전용 버튼으로 분리 대체함.
- **기대 효과**:
  - 동적 링크 생성 아키텍처가 검증되었으며, 다음 세션부터 투어, 패스, 항공권 등 다른 영역의 링크도 마이리얼트립으로 손쉽게 전환/확장 가능해짐.

## 3. 변경된 파일
- `src/components/PlaceCard/tabs/PlannerTab.jsx` (경량화)
- `src/components/PlaceCard/tabs/planner/` (신규 디렉토리)
  - `constants.js` (케냐 eTA 및 짐 보관소 매핑 추가)
  - `utils.js` (클룩/MRT 하이브리드 투어 버튼 및 짐 보관소 매핑 적용)
  - `components/*.jsx` (ToolkitCard, JourneyTimeline 등 6개 파일)
- `src/components/PlaceCard/common/WhiteLabelWidget.jsx` (createPortal 적용)
- `src/utils/affiliate.js`
- `supabase/functions/mrt-link-generator/index.ts`
- `supabase/functions/mrt-link-generator/deno.json`
- `plans/phase8-6-mrt-integration-plan.md` (기획 문서 생성)
- `plans/2026-04-15-project-log.md`

## 4. 추가 수정 사항 (버그 픽스 및 최적화)
- **[Bug Fix] 플래너 탭 케냐 eTA 링크 매핑 오류 수정**: 
  - `constants.js`의 `OFFICIAL_VISA_LINKS` 배열에 케냐 eTA 공식 웹사이트(`https://www.etakenya.go.ke/`) 매핑을 추가하여, AI 안내 문구에 맞춰 정확한 링크가 노출되도록 조치함.
- **[UI Fix] 모바일 환경 항공권 검색 모달(Travelpayouts) 닫기 버튼 가림 현상 수정**:
  - `WhiteLabelWidget.jsx`의 모달 렌더링 방식을 `createPortal`로 변경하여 부모 컨테이너의 stacking context 제약(z-index 함정)을 완벽히 탈피함 (`z-[9999]`).
  - 모바일 OS의 Safe Area(상단 노치, 상태표시줄 등)를 고려해 헤더에 `paddingTop: 'max(1rem, env(safe-area-inset-top))'` 스타일을 적용하여 닫기 버튼 시인성 확보.
- **[Phase 8-7] 마이리얼트립 링크 적용 확대 및 툴킷 최적화**:
  - **투어 영역 하이브리드 배치**: 클룩(글로벌 어트랙션/패스 강점)과 마이리얼트립(한국어 가이드 워킹 투어 강점)의 버튼을 분리하고 나란히 배치하여 사용자의 선택권 보장 (`utils.js`).
  - **글로벌 짐 보관소 동적 매핑**: 비자 링크 아키텍처를 응용하여 `constants.js`에 `LUGGAGE_STORAGE_LINKS` 매핑을 신설. 일본(ecbo cloak), 유럽(Nannybag) 등 지역 특화 짐 보관 서비스 업체를 우선 매칭하고, 그 외 지역은 글로벌 커버리지가 높은 Bounce로 폴백(Fallback) 연결하도록 `utils.js` 로직 고도화.
- **[Phase 8-3] Planner Hub - 항공권 화이트라벨 링크 연결 및 투어 카테고리 재배치**:
  - 기존 상세 여정 플래너(`JourneyTimeline.jsx`)에서 작동하지 않던 `search.kyte.travel` 항공권 검색 버튼을 Travelpayouts 화이트라벨 통합 도메인(`flights.gateo.kr`)으로 변경하여 툴킷의 항공권 파트와 통일성 및 전환율을 높임.
  - 추가로 `WhiteLabelWidget.jsx`를 확장(`customTrigger` 지원)하여, 타임라인에서 항공권 검색 버튼 클릭 시 새 탭이 아닌 **통합 모달 검색창**이 즉시 뜨도록 UX를 개선함.
  - 상세 여정 플래너 내 항공권 검색, 공항 픽업 버튼의 색상을 숙소 검색과 동일한 눈에 띄는 색상(Rose)으로 통일하여 시인성 극대화.
  - `utils.js`에서 교통 및 패스(`transport`)에 있던 투어/액티비티(Klook) 및 한국어 가이드 투어(MRT) 제휴 상품 링크를 명소 파트(`map_poi`)로 이전하여 논리적인 카테고리 분류를 달성함.

## 6. 추가 진행 내용 (복잡한 여행지 큐레이션 및 파트너 링크 세분화)

### [Phase 8-3 & 9] 복잡한 여행지 시스템 연동 및 큐레이션 최적화
- **작업 목적**:
  - 사용자 질문(AI 텍스트)의 맥락을 정확하게 파싱하여, 정보 제공을 넘어 즉각적인 "예약(Action)"으로 이어지도록 브릿지를 강화함.
  - 부족했던 글로벌 서비스 커버리지를 보완하고, 비서 앱 연동을 위한 예약 추적 기반을 마련함.
- **주요 구현 사항**:
  - **비자/서류 다중 딥링크 생성 (`constants.js`, `utils.js`)**: 
    - `OFFICIAL_VISA_LINKS`에 쿡 제도, 라로통가(NZeTA 대상) 및 특수 지역 키워드를 추가.
    - 기존에는 단 하나의 비자 링크만 노출되었으나, 아르헨티나 여행 시 '미국 경유(ESTA), 캐나다 경유(eTA)' 정보가 있는 경우 **매칭되는 모든 비자 링크 버튼을 동시에 노출**하도록 개선.
    - (Bug Fix) AI 텍스트 내의 'eTA' 단어 하나 때문에 스리랑카, 케냐 등이 전부 뜨는 할루시네이션 현상을 해결하기 위해, 텍스트 파싱 시 **국가명 키워드가 동반될 때만** 링크를 추가하는 엄격한 조건식 적용.
  - **AI 숙소 큐레이션 동적 버튼 고도화 (`utils.js`)**:
    - AI가 추천하는 특정 숙박 지역명을 `[@지역명@]` 스마트 링크 패턴으로 추출하도록 정규식을 개편.
    - 추출된 세부 지역명과 상위 지명을 자동 결합(예: `뮤리 해변 라로통가 숙소`)하여 마이리얼트립 검색 퀄리티를 대폭 상향시킴.
    - 버튼이 너무 많이 생성되어 UI를 해치는 파리(1구, 4구 등)의 사례를 막기 위해, 각 줄(line)에서 첫 번째 매칭만 버튼으로 만들고, '주의', '피해야' 등의 단어가 포함된 줄은 추천에서 스킵하는 지능형 필터링 추가.
  - **식당 예약 커버리지 및 수익화 세분화 (`constants.js`, `utils.js`)**:
    - TheFork 링크 연결 시 잘못된 검색 쿼리(`search?cityId=`)로 인해 에러가 나는 버그를 수정하여 파라미터가 없는 사이트 홈으로 안전하게 연결되도록 조치.
    - 매핑되지 않은 범용 지역(아시아 포함, 예: 발데스 반도)에 대해서는 Klook 레스토랑 통합 검색(`search/result/?query=레스토랑`)으로 동적 폴백되도록 아키텍처 개편.
  - **여정 타임라인 내 불필요한 액션 방지 (`JourneyTimeline.jsx`)**:
    - 타임라인 단계 제목에 '환승'이나 '경유'라는 단어가 포함된 경우, '공항' 키워드가 있더라도 불필요한 공항 픽업 버튼이 렌더링되지 않도록 예외 처리 로직 추가.
  - **Aviasales (Travelpayouts) 파라미터 최적화 (`WhiteLabelWidget.jsx`)**:
    - 화이트라벨 모달(`flights.gateo.kr`) 호출 시 `origin=SEL` 및 `destination_name` 파라미터가 정확히 주입되도록 수정.
    - 추후 비서 앱 연동 및 개인화 서비스를 대비하여, Travelpayouts Statistics API에서 예약 내역을 수집/추적할 수 있도록 `marker={user_id}` 형태의 Sub ID 매개변수를 모달 호출 파라미터에 세팅 (현재는 `toolkit_session` 값으로 기초 구현).

## 7. Next Steps
- [ ] **[Phase 9-2] 여행지 데이터 100개 추가 (Phase 2 대기)**
- [ ] **[Phase 10] 백엔드 프롬프트 개선 (DB 필드 구조 개선 등) 및 A/B 테스트 검증**
- [ ] **[Phase 8-8] 짐 보관소 세부 매핑 고도화**: 추후 Nannybag 어필리에이트 승인 완료 시 적용.
