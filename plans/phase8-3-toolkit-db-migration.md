# Phase 8-3: Toolkit Database Migration & Frontend Integration Plan

**작성일**: 2026-04-06
**목표**: `place_wiki` 테이블에 종속되어 있던 툴킷 데이터(`essential_guide`)를 완전히 분리된 신규 테이블 `place_toolkit`으로 마이그레이션하여 데이터 독립성을 확보하고, 프론트엔드/백엔드 로직을 분리합니다. 이를 통해 향후 앱 이관 시 필요한 예약 정보, 타임라인 등의 데이터를 위키 정보와 독립적으로 다룰 수 있도록 구조를 개선합니다. 또한 툴킷 탭 신규 진입 시 로딩 UI 복원과 AI 프록시 상태 점검 가이드라인을 수립합니다.

---

## 1. 데이터베이스 스키마 설계 및 데이터 이관 (Supabase SQL)

### 1.1. 신규 테이블: `place_toolkit` 생성
기존 위키와 독립적인 툴킷 전용 테이블을 생성합니다. 향후 알림(notification)이나 일정 연동 등을 고려하여 명시적인 업데이트 시간을 별도로 관리합니다.

```sql
-- 1. 테이블 생성
CREATE TABLE public.place_toolkit (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    place_id TEXT NOT NULL UNIQUE,  -- 'travel_spots' 또는 'savedTrips'의 대상지 식별자 (외래키 성격)
    essential_guide JSONB,          -- AI가 생성한 구조화된 툴킷 JSON 데이터
    toolkit_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), -- 툴킷 데이터 최종 갱신 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 검색 성능 향상을 위한 인덱스 생성
CREATE INDEX idx_place_toolkit_place_id ON public.place_toolkit(place_id);
```

### 1.2. 기존 데이터 이관 (Migration)
기존 `place_wiki` 테이블에 저장되어 있던 `essential_guide` (JSON 데이터)를 신규 `place_toolkit` 테이블로 복사합니다.

```sql
-- 3. 데이터 이관 실행
INSERT INTO public.place_toolkit (place_id, essential_guide, toolkit_updated_at, created_at)
SELECT 
    place_id, 
    essential_guide, 
    ai_info_updated_at, -- 기존 업데이트 시간을 툴킷 업데이트 시간으로 사용 (초기 동기화)
    ai_info_updated_at  -- 생성 시간도 동일하게 설정
FROM 
    public.place_wiki
WHERE 
    essential_guide IS NOT NULL;
```
*(참고: 안전을 위해 당분간 `place_wiki` 테이블의 `essential_guide` 컬럼은 삭제하지 않고 그대로 유지합니다.)*

---

## 2. 백엔드 로직 수정 (Edge Function)

### 2.1. `supabase/functions/update-place-toolkit/index.ts`
AI(Gemini)가 생성한 JSON 데이터를 기존 `place_wiki`가 아닌 신규 `place_toolkit` 테이블에 `upsert` 하도록 변경합니다.

**변경 내용 요약:**
```typescript
// TO-BE (place_toolkit에 upsert)
const { error: dbError } = await supabaseAdmin
  .from('place_toolkit')
  .upsert({
    place_id: String(placeId),
    essential_guide: essentialGuideJson,
    toolkit_updated_at: new Date().toISOString()
  }, { onConflict: 'place_id' });
```

---

## 3. 프론트엔드 리팩토링 및 신규 훅 생성

### 3.1. 신규 훅 생성: `src/components/PlaceCard/hooks/useToolkitData.js`
*   **목적**: `place_toolkit` 테이블 데이터를 독립적으로 조회/관리.
*   **주요 기능**:
    *   `supabase.from('place_toolkit').select('*').eq('place_id', placeId)` 쿼리 실행.
    *   14일 이상 경과된 오래된 툴킷 데이터 자동 갱신 트리거 로직 (`WIKI_AUTO_UPDATE_DAYS` 상수 활용, 혹은 별도의 툴킷 전용 상수 필요 시 분리 검토).
    *   기존 `useWikiData`에 있던 `window.addEventListener('toolkit-updated')` 이벤트 리스너를 이쪽으로 완전히 이관.
*   **반환값**: `{ toolkitData, isToolkitLoading, isToolkitError }`

### 3.2. 기존 훅 정리: `src/components/PlaceCard/hooks/useWikiData.js`
*   **목적**: 순수하게 `place_wiki` 테이블의 `ai_practical_info` (백과 본문)만 관리.
*   **삭제 대상**:
    *   `toolkit-updated` 이벤트 리스너 제거 (Race condition 방지 로직 포함하여 전체).
    *   툴킷 갱신 시 `ai_info_updated_at`을 강제로 덮어씌우는 등의 부수적 로직 제거.
    *   (의존성 분리 완료 후 순수 위키 데이터만 반환).

### 3.3. 컴포넌트 데이터 주입 구조 변경
*   **`src/components/PlaceCard/modes/PlaceCardExpanded.jsx`**:
    *   상단에서 `useToolkitData` 훅을 새로 호출.
    *   `<PlaceMediaPanel>`에 `toolkitData`, `isToolkitLoading` props를 추가로 전달.
*   **`src/components/PlaceCard/panels/PlaceMediaPanel.jsx`**:
    *   `PlaceCardExpanded`로부터 받은 props를 `<ToolkitTab>` 컴포넌트로 패스.
*   **`src/components/PlaceCard/tabs/ToolkitTab.jsx`**:
    *   더 이상 `wikiData.essential_guide`를 참조하지 않고, 전달받은 `toolkitData.essential_guide`를 직접 참조.
    *   기존에 남아있던 구버전 파싱 호환 로직(`parseAiPracticalInfo(sourceAiInfo)`)은 `toolkitData`가 전혀 없는 경우에 한해 최후의 fallback으로만 제한적으로 남기거나 제거 검토 (마이그레이션이 완료되었으므로 제거 권장).
    *   `handleRequestToolkitInfo` 함수 내의 중복 요청 방지 로직(pendingToolkitRequests Map)은 그대로 유지.

---

## 4. UI/UX 개선

### 4.1. 툴킷 탭 신규 진입 시 로딩 상태창 (Progress) 복원
*   **문제**: Phase 8에서 툴킷 탭의 불필요한 2.5초 지연을 제거하고 이벤트 기반 즉시 반영으로 변경하면서, **최초 진입 시(데이터가 아예 없을 때)** 진행되는 AI 생성 로딩창 UI 렌더링에 문제가 생겼거나 일시적으로 보이지 않게 되었음.
*   **해결 방안**:
    *   `ToolkitTab.jsx` 내의 `isLoading` 상태 계산 로직 점검.
    *   `useToolkitData` 훅에서 반환하는 `isToolkitLoading` 상태와, 컴포넌트 자체의 `isRemoteUpdating` 상태를 조합하여 로딩 중일 때 `LOADING_MESSAGES_NEW` 메시지 배열이 순차적으로 보여지는 프로그레스바 UI가 명확히 렌더링되도록 수정.

### 4.2. 모바일 UX 렌더링 검토 (타임라인, 체크리스트)
*   **목적**: 복잡한 여행지(길리 메노, 보라카이 등) 진입 시 노출되는 `<PreTravelChecklist>`, `<JourneyTimeline>` 컴포넌트가 모바일 디바이스 해상도(width: 320px ~ 430px)에서 글자 잘림, 여백 붕괴, 좌우 스크롤 등이 발생하지 않는지 확인.
*   **점검 포인트**:
    *   Tailwind 클래스의 반응형(`md:`, `text-xs md:text-sm` 등)이 적절히 적용되었는지 확인.
    *   필요 시 패딩/마진 미세 조정 (크롬 DevTools 모바일 뷰어 기준).

---

## 5. AI 프록시 상태 점검 및 컨텍스트 파일 업데이트 가이드라인

### 5.1. AI 모델 점검 가이드 (컨텍스트 명문화)
최근 작업에서 프록시 확인 누락이나 폴백 모델 부재로 인한 장애가 있었습니다. 이를 방지하기 위해 `.ai-context.md`에 명시적인 점검 가이드라인을 추가합니다.

*   **주 모델 및 폴백 모델 정의 (2026.04 기준)**:
    *   **위키 전담 (텍스트)**: 주 모델 `gemini-2.5-pro` (안정성 우선).
    *   **툴킷 전담 (JSON/추론)**: 주 모델 `gemini-3.1-pro-preview` / 폴백 모델 `gemini-2.5-pro`.
*   **작업 전 필수 확인 (Pre-flight Check)**:
    *   프록시 엣지 함수(`gemini-proxy`, `update-place-toolkit` 등) 수정 시 반드시 `deno.json` 의존성 확인.
    *   에러 발생 시 즉각적으로 다음 모델로 전환되는 루프(try-catch 및 continue)가 제대로 구현되어 있는지 확인.
    *   API 한도(Quota) 초과(`429 Too Many Requests`, `RESOURCE_EXHAUSTED`) 에러 코드 처리가 명확한지 확인.

### 5.2. `.ai-context.md` 업데이트
위의 가이드라인을 `.ai-context.md`의 "🤖 AI 어시스턴트 핵심 행동 원칙" 또는 "최근 수정 사항" 섹션에 추가하여, 향후 AI가 관련 로직 수정 시 항상 참고하도록 합니다.

---

## 6. 다음 세션(Next Session) 작업 순서 요약

1.  Supabase SQL 에디터에서 테이블 생성 및 마이그레이션 쿼리 실행.
2.  `supabase/functions/update-place-toolkit/index.ts` 코드 수정 및 엣지 함수 배포 (`--no-verify-jwt` 옵션 잊지 말 것).
3.  `useToolkitData.js` 훅 파일 생성.
4.  `useWikiData.js` 리팩토링 (툴킷 코드 제거).
5.  `PlaceCardExpanded.jsx`, `PlaceMediaPanel.jsx`, `ToolkitTab.jsx` 순차적으로 props 연결 및 로딩 UI 버그 수정.
6.  로컬 테스트 환경 구동 (`npm run dev`) 후 모바일 UX 테스트 및 로딩 UI 작동 확인.
7.  `.ai-context.md` 파일 내 프록시 가이드라인 업데이트.
8.  모든 변경사항 커밋 및 `2026-04-06-project-log.md` 작성 후 종료.
