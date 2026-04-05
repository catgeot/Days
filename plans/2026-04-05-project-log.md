# 2026-04-05 프로젝트 로그

## 1. 개요
*   **작업자**: AI Assistant (Roo)
*   **주요 작업**: [Phase 8] 복잡한 여행지 특화 시스템 구축 - 하이브리드 모델 라우팅 및 엣지 함수 분리를 통한 단일 소스 원칙 재정립

## 2. 세부 작업 내역

### 2.1. 하이브리드 모델 라우팅 (Hybrid Model Routing) 도입
*   **배경**: 기존에 위키 본문과 툴킷 데이터가 단일 마크다운(`ai_practical_info`)에 결합되어 있어, 스토리텔링과 예약 정보 추출이라는 성격이 다른 작업을 한 모델이 처리하다 보니 품질 저하 및 파싱 에러 위험 존재.
*   **해결책**:
    *   **위키 전담**: `gemini-2.5-pro`를 사용하여 창의적이고 생생한 로컬 정보만 마크다운으로 생성하도록 `update-place-wiki` 엣지 함수 분리.
    *   **툴킷 전담 (신규)**: `gemini-3.1-pro`의 강력한 추론/웹 검색 능력을 활용하여 복잡도 점수, 타임라인, 비자/페리 예약 링크 등 엄격한 JSON 구조만 생성하는 `update-place-toolkit` 엣지 함수 신설.
*   **관련 커밋 제안**: `feat(ai): 하이브리드 모델 라우팅 적용 및 툴킷 엣지 함수(update-place-toolkit) 분리`

### 2.2. 프론트엔드 파싱 제거 및 `essential_guide` JSON 복원
*   **배경**: 불안정한 정규식 마크다운 파싱을 제거하고, 예약 수익과 직결되는 데이터를 견고하게 관리하기 위함.
*   **해결책**:
    *   `src/utils/aiDataParser.js`에서 툴킷 추출 로직을 하위 호환성 유지 목적으로만 남기고, 신규 데이터는 빈 컬럼이었던 `essential_guide` (jsonb)를 다시 부활시켜 사용.
    *   `ToolkitTab.jsx`에서 `wikiData?.essential_guide`를 최우선 데이터 소스로 읽어오도록 수정.
*   **관련 커밋 제안**: `refactor(toolkit): 마크다운 파싱 의존성 제거 및 essential_guide JSON 연동`

### 2.3. 복잡한 여행지 확장 UI 개발 (`ToolkitTab.jsx`)
*   **배경**: 길리 메노, 보라카이 등 다단계 이동이나 사전 비자/관광세 납부가 필요한 지역의 정보를 명확히 보여주기 위함.
*   **해결책**:
    *   `is_complex`가 true일 때 노출되는 **복잡도 경고 배지** 추가.
    *   **`PreTravelChecklist` 컴포넌트**: 출발 전 필요한 E-비자, 관광세 예약 링크를 상단에 배치.
    *   **`JourneyTimeline` 컴포넌트**: 공항 도착부터 페리 탑승까지의 다단계 이동 소요 시간을 가시적인 타임라인 UI로 구현.
    *   **특화 카드**: '공항 이동(airport_transfer)', '페리 예약(ferry_booking)' 전용 툴킷 카드를 조건부 렌더링.
*   **관련 커밋 제안**: `feat(toolkit): 복잡한 여행지(길리 메노 등)를 위한 체크리스트 및 타임라인 UI 확장`

### 2.4. 레거시 데이터 강제 갱신 로직 및 디버깅
*   **배경**: 기존(초기 텍스트 버전) 데이터가 `essential_guide`에 들어있는 '길리 메노', '보라카이' 등의 경우, 데이터가 존재한다고 판단하여 새로운 구조화 요청을 보내지 않는 문제.
*   **해결책**:
    *   툴킷 화면 하단에 `Force Update Toolkit` 텍스트 버튼 추가 (평소에는 흐릿하게 노출).
    *   버튼 클릭 시 `update-place-toolkit` 강제 호출.
*   **에러 디버깅**:
    *   **401 Unauthorized**: 엣지 함수 배포 시 `--no-verify-jwt` 옵션 누락으로 인한 인증 오류 해결.
    *   **500 (API Model NotFound)**: 사용자의 '3.1 pro' 언급을 그대로 API에 적용(`gemini-3.1-pro-preview`)했다가 모델 인식 불가 에러가 발생. 안정화 버전인 `gemini-2.5-pro`로 교체하여 정상 작동 확인.
    *   수동 업데이트 성공 시 `window.location.reload()`를 호출해 최신 데이터를 강제 반영하도록 보완.

### 2.5. 스마트 툴킷 강제 갱신 버그 해결 및 UX 최적화
*   **배경**: 툴킷 수동 갱신(강제 업데이트) 완료 후 `window.location.reload()`가 호출되어, React Router 상태가 소실되고 초기 화면(홈)으로 강제 추방되는 문제 발생. 또한, 이 과정에서 33초 간격의 자동 무한 루프 갱신이 일어나는 버그가 동반됨. 추가적으로, 새로고침 현상을 해결한 직후 강제 갱신 시 DB 반영 속도와 프론트엔드 상태 패칭 속도 간의 Race Condition(경쟁 상태)으로 인해 새로운 툴킷 데이터가 화면에 즉시 보이지 않는 문제 보고.
*   **해결책**:
    *   **무한 자동 갱신 방지**: 레거시 14일 자동 업데이트 로직(`WIKI_AUTO_UPDATE_DAYS`)이 툴킷 탭에서 잘못 작동하여 반복적으로 트리거되던 것을 비활성화.
    *   **홈으로 추방되는 문제 해결 (Soft Reload 도입)**: `ToolkitTab.jsx`에서 `window.location.reload()` 코드를 완전히 삭제. 대신 API 호출 성공 시 `window.dispatchEvent(new CustomEvent('toolkit-updated'))`를 발생시킴.
    *   **Race Condition 해소 (즉시 상태 반영)**: 엣지 함수에서 리턴받은 최신 `essential_guide` JSON 데이터를 이벤트 페이로드에 포함시켜 브로드캐스트함.
    *   `useWikiData.js`에서 해당 이벤트를 감지하면, 백그라운드 DB 재조회(fetchWikiData)를 기다리지 않고 **리액트 로컬 상태(`wikiData`)에 페이로드의 새 데이터를 즉시 덮어씌워** 지연 없는 화면 갱신 보장.
    *   **업데이트 일자 동기화**: `update-place-toolkit` 엣지 함수에서 데이터 업데이트 시 `ai_info_updated_at` 타임스탬프 필드도 반드시 갱신하도록 백엔드 로직 수정 및 배포 완료.

### 2.6. Phase 8 버그 수정 완료 (2026-04-05 오후) ✅
*   **Race Condition 완벽 해결**:
    *   **문제**: 툴킷 강제 갱신 후 데이터가 DB에는 반영되지만 화면에 즉시 표시되지 않는 문제
    *   **원인**: 이벤트 리스너가 `useEffect` 내부에서 `placeId`, `mediaMode` 의존성으로 등록되어, 해당 값이 변경되지 않으면 이벤트를 캡처하지 못함
    *   **해결책**:
        *   `useWikiData.js`에서 이벤트 리스너를 컴포넌트 마운트 시 한 번만 등록 (빈 의존성 배열)
        *   최신 상태를 참조하기 위해 `useRef` 활용 (`wikiDataRef`, `placeIdRef`)
        *   이벤트 핸들러에서 ref를 통해 항상 최신 `placeId` 비교
        *   엣지 함수에서 리턴받은 `essentialGuide` JSON을 즉시 로컬 상태에 반영
        *   백그라운드 동기화는 1.5초 지연 후 별도로 실행
    *   **관련 파일**: [`src/components/PlaceCard/hooks/useWikiData.js`](src/components/PlaceCard/hooks/useWikiData.js:109-171)

*   **Gemini API 모델 폴백 로직 추가**:
    *   **문제**: Gemini 3.1 Pro API 일일 한도(250건) 초과 시 툴킷 생성 실패
    *   **해결책**:
        *   `update-place-toolkit` 엣지 함수에 모델 폴백 메커니즘 구현
        *   우선 순위: `gemini-3.1-pro-preview` → `gemini-2.5-pro`
        *   429 또는 RESOURCE_EXHAUSTED 에러 발생 시 자동으로 다음 모델 시도
        *   사용된 모델을 콘솔에 로깅하여 디버깅 용이
    *   **관련 파일**: [`supabase/functions/update-place-toolkit/index.ts`](supabase/functions/update-place-toolkit/index.ts:92-152)

*   **엣지 함수 재배포 (401 에러 해결)**:
    *   프로젝트 로그에 해결되었다고 기록되었으나 실제로는 JWT 인증 설정 미적용 상태였음
    *   `--no-verify-jwt` 옵션으로 재배포하여 401 Unauthorized 에러 완전 해결
    *   배포 명령어: `npx supabase functions deploy update-place-toolkit --project-ref phdjnbfitvmrguqzverm --no-verify-jwt`

*   **ToolkitTab 스크롤 UX 개선**:
    *   **문제**: 툴킷 탭 재진입 시 또는 강제 갱신 완료 후 스크롤 위치가 하단에 머물러 있음
    *   **원인**: 컴포넌트 분리 후 독립적인 스크롤 컨테이너(`overflow-y-auto`)를 가지게 되어 명시적인 스크롤 제어 필요
    *   **해결책**:
        *   스크롤 컨테이너에 `scrollContainerRef` 연결
        *   `isActive`와 `isLoading` 상태 변화 감지 시 `scrollTop = 0`으로 강제 리셋
        *   150ms 지연을 두어 DOM 렌더링 완료 후 스크롤 동작 실행
    *   **관련 파일**: [`src/components/PlaceCard/tabs/ToolkitTab.jsx`](src/components/PlaceCard/tabs/ToolkitTab.jsx:330-395)

*   **ToolkitTab 불필요한 2.5초 지연 제거**:
    *   기존 `setTimeout(() => setIsRemoteUpdating(false), 2500)` 로직 제거
    *   이벤트 기반 즉시 반영이 제대로 작동하므로 API 성공 직후 로딩 상태 즉시 해제
    *   사용자 경험 개선: 강제 갱신 버튼 클릭 후 응답 속도 체감 2.5초 단축

*   **관련 커밋 제안**:
    ```bash
    git add .
    git commit -m "fix(phase8): Race Condition 완벽 해결 및 툴킷 UX 개선

- Race Condition 해결: 이벤트 리스너 마운트 시 한 번만 등록 (useRef 활용)
- Gemini API 모델 폴백 로직 추가 (3.1 Pro → 2.5 Pro)
- 엣지 함수 401 에러 해결 (--no-verify-jwt 재배포)
- 툴킷 탭 스크롤 자동 상단 리셋 기능 추가
- 불필요한 2.5초 지연 제거로 UX 개선

변경 파일:
- src/components/PlaceCard/hooks/useWikiData.js
- src/components/PlaceCard/tabs/ToolkitTab.jsx
- supabase/functions/update-place-toolkit/index.ts"
    ```

## 3. 다음 단계 (Next Steps)
*   **검색 시스템 연동**: 검색 모달과 연동하여 Phase 8-3 (복잡한 여행지 탐색 리스트) 기획 및 구현.
*   **모바일 UX 검토**: 타임라인 및 체크리스트가 모바일 환경에서 잘 보이는지 사용자 피드백 반영.

## 4. 세션 종료 안내
*   **작업 완료일**: 2026-04-05
*   **소요 시간**: 약 3시간
*   **주요 성과**:
    *   ✅ Phase 8 핵심 버그 완전 해결 (Race Condition)
    *   ✅ API 안정성 향상 (모델 폴백)
    *   ✅ 사용자 경험 개선 (스크롤 리셋, 지연 제거)
*   **다음 세션 시작 제시어**:
    ```
    ".ai-context.md와 2026-04-05-project-log.md 확인 후, Phase 8-3 복잡한 여행지 탐색 시스템 구현 시작"
    ```
