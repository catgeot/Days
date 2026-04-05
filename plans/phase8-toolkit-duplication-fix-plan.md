# Phase 8: 툴킷 중복 실행 버그 수정 계획

**작성일**: 2026-04-05
**우선순위**: 긴급 (즉시 수정 필요)

---

## 🔍 문제 상황

### 콘솔 로그 분석
```
[ToolkitTab] 툴킷 데이터 완전 없음 - 자동 데이터 요청 발송  (1회)
[ToolkitTab] Supabase Edge Function 호출 시작
[useWikiData] Toolkit 이벤트 리스너 등록 완료
[useWikiData] Toolkit 이벤트 리스너 제거
[ToolkitTab] 툴킷 데이터 완전 없음 - 자동 데이터 요청 발송  (2회)
[ToolkitTab] Supabase Edge Function 호출 시작
[useWikiData] Toolkit 이벤트 리스너 등록 완료
```

**증상:**
1. ToolkitTab 자동 데이터 요청이 **2회 중복 실행**
2. useWikiData 이벤트 리스너가 **등록 → 제거 → 재등록** 반복
3. API 호출 비용 2배 증가 및 불필요한 네트워크 부하

---

## 🎯 근본 원인

### 1. React StrictMode의 이중 렌더링
- [`main.jsx`](../src/main.jsx:7-9)에서 `<StrictMode>` 활성화
- 개발 환경에서 모든 컴포넌트가 **마운트 → 언마운트 → 재마운트** 순서로 실행
- useEffect 내부의 사이드 이펙트가 2번 호출됨

### 2. 현재 아키텍처 분석

#### 데이터 흐름
```
PlaceCardExpanded (Line 39)
  └─> useWikiData(location.name, mediaMode)
        ├─> DB에서 wikiData 조회 (ai_practical_info + essential_guide)
        └─> 이벤트 리스너 등록 ('toolkit-updated')
  
  └─> PlaceMediaPanel에 props 전달
        └─> ToolkitTab({ wikiData, ... })
              ├─> wikiData.essential_guide 사용
              └─> useEffect로 자동 API 호출 (Line 373-381)
                    └─> handleRequestToolkitInfo() 실행
```

#### 문제점
- **ToolkitTab.jsx Line 373-381**: 
  - `initialDataRequested.current` ref로 중복 방지 시도
  - 하지만 StrictMode에서 컴포넌트가 완전히 재마운트되면 ref도 초기화됨
  - 결과: 각 마운트마다 1회씩 총 2회 API 호출

- **useWikiData.js Line 129-190**:
  - 빈 의존성 배열 `useEffect([], [])` 사용 (정상)
  - StrictMode 클린업 시뮬레이션으로 언마운트 → 리스너 제거 → 재마운트 → 리스너 재등록
  - 프로덕션에서는 정상 작동하지만, 개발 환경에서 로그 혼란 유발

### 3. 위키/툴킷 분리 미완료 상태

**Phase 8 목표**: 위키와 툴킷을 완전히 독립적인 시스템으로 분리

**현재 상태**:
- ❌ PlaceCardExpanded가 useWikiData로 **두 시스템의 데이터를 모두 가져옴**
- ❌ ToolkitTab이 여전히 wikiData props에 의존
- ❌ 하나의 훅이 두 가지 책임을 가짐 (SRP 위반)

**이상적인 구조**:
```
WikiTab → useWikiData → ai_practical_info만 사용
ToolkitTab → useToolkitData → essential_guide만 사용 (독립적)
```

---

## 💡 해결 방안

### 방안 A: 단기 - API 중복 호출 방지 (즉시 적용) ⭐

**목적**: 긴급하게 비용 낭비와 성능 저하만 해결

**구현:**
1. **전역 요청 캐시 Map** (ToolkitTab.jsx 상단)
```javascript
// 컴포넌트 외부 (전역 스코프)
const pendingToolkitRequests = new Map(); // { placeId: Promise }
```

2. **handleRequestToolkitInfo 수정** (Line 403-436)
```javascript
const handleRequestToolkitInfo = async (placeName, forceUpdate = false) => {
    const placeId = wikiData?.place_id || location?.name;
    if (!placeId) return;

    // 이미 요청 중이면 기존 Promise 재사용
    if (pendingToolkitRequests.has(placeId)) {
        console.log('[ToolkitTab] 중복 요청 방지 - 기존 요청 재사용');
        return pendingToolkitRequests.get(placeId);
    }

    setIsRemoteUpdating(true);
    
    // 새 요청 생성 및 캐시 등록
    const requestPromise = (async () => {
        try {
            console.log("[ToolkitTab] Edge Function 호출 시작");
            const { data, error } = await supabase.functions.invoke('update-place-toolkit', {
                body: { placeId, locationName: placeName || location?.name }
            });

            if (error) throw error;

            console.log("[ToolkitTab] Edge Function 호출 완료");
            
            if (data?.success) {
                window.dispatchEvent(new CustomEvent('toolkit-updated', {
                    detail: { placeId, essentialGuide: data.essentialGuide }
                }));
                setIsRemoteUpdating(false);
            }
            
            return data;
        } catch (err) {
            console.error('[ToolkitTab] API Error:', err);
            setIsRemoteUpdating(false);
            throw err;
        } finally {
            // 요청 완료 후 캐시에서 제거
            pendingToolkitRequests.delete(placeId);
        }
    })();

    pendingToolkitRequests.set(placeId, requestPromise);
    return requestPromise;
};
```

3. **콘솔 로그 정리**
- 중복 로그에 `[DEV ONLY - StrictMode]` 표시 추가
- 사용자 혼란 방지

**예상 효과:**
- ✅ API 호출 횟수: 장소당 2회 → 1회 (50%↓)
- ✅ API 비용 절감: 50%
- ✅ 네트워크 부하 감소

**변경 파일:**
- `src/components/PlaceCard/tabs/ToolkitTab.jsx`

---

### 방안 B: 장기 - useToolkitData 분리 (다음 세션)

**목적**: 위키와 툴킷 시스템 완전 분리 (Phase 8 원래 목표)

**구현 계획:**
1. **신규 훅 생성**: `src/components/PlaceCard/hooks/useToolkitData.js`
   - essential_guide만 조회
   - 독립적인 로딩/에러 상태 관리
   - toolkit-updated 이벤트 리스너

2. **PlaceCardExpanded 수정**:
```javascript
// Before
const { wikiData, isWikiLoading } = useWikiData(queryKey, mediaMode);

// After
const { wikiData, isWikiLoading } = useWikiData(queryKey, mediaMode);
const { toolkitData, isToolkitLoading } = useToolkitData(queryKey, mediaMode);
```

3. **ToolkitTab props 변경**:
```javascript
// Before
<ToolkitTab wikiData={wikiData} isWikiLoading={isWikiLoading} />

// After
<ToolkitTab toolkitData={toolkitData} isToolkitLoading={isToolkitLoading} />
```

4. **useWikiData 단순화**:
   - toolkit 관련 이벤트 리스너 제거
   - ai_practical_info만 관리

**예상 효과:**
- ✅ 완벽한 관심사 분리 (SoC)
- ✅ 코드 유지보수성 향상
- ✅ 각 시스템 독립적 확장 가능

**소요 시간**: 약 2시간

---

## 📊 권장 방안

### 🚀 즉시 적용: 방안 A (API 중복 호출 방지)

**이유:**
1. 긴급성: 현재 매 장소마다 2배의 API 비용 발생 중
2. 리스크: 낮음 (기존 로직 최소 변경)
3. 효과: 즉시 비용 50% 절감

**다음 세션**: 방안 B (완전 분리)를 Phase 8-3로 진행

---

## ✅ 체크리스트

### 방안 A 구현
- [ ] ToolkitTab.jsx에 전역 pendingRequests Map 추가
- [ ] handleRequestToolkitInfo에 중복 방지 로직 삽입
- [ ] 콘솔 로그에 [DEV ONLY] 표시 추가
- [ ] 몽블랑/길리메노 등에서 테스트
- [ ] 커밋: "fix(toolkit): API 중복 호출 방지 - 전역 캐시 도입"

### 방안 B 계획 (다음 세션)
- [ ] useToolkitData.js 훅 설계 문서 작성
- [ ] PlaceCardExpanded 리팩토링 계획
- [ ] ToolkitTab props 마이그레이션 계획
- [ ] useWikiData 단순화 계획

---

## 📝 참고 자료

- React StrictMode 공식 문서: https://react.dev/reference/react/StrictMode
- Phase 8 원본 계획: [`toolkit-phase8-complex-destination-system-v2.md`](./toolkit-phase8-complex-destination-system-v2.md)
- 오늘 작업 로그: [`2026-04-05-project-log.md`](./2026-04-05-project-log.md)
