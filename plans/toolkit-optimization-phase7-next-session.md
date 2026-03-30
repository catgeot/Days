# 스마트 툴킷 Phase 7 - 버그 수정 및 최종 개선 계획

## 📊 현재 세션 평가 (Phase 6 완료)

### ✅ 성공적으로 완료된 작업
- **토큰 사용량**: 77,023 / 200,000 (38.5%)
- **컨텍스트 상태**: 양호 (50% 미만)
- **커밋 수**: 5개 (단계별 관리 용이)
- **사용자 피드백**: "툴킷의 내용이 많이 좋아졌어!"

### ✅ Phase 6 달성 내용
1. 스마트 링크 구글 검색 통합
2. 로딩 동기화 개선
3. 카드 순서 여행 플래닝 흐름으로 재배치
4. 카테고리별 색상 테마 적용 (8가지)
5. UI/UX 추가 개선 (이모지, 터치 영역)

---

## 🐛 발견된 버그 및 개선 사항

### 1. 로딩 동기화 문제 (Critical)

#### 현상
```
- 툴킷 탭에서 직접 실행 시 로딩 상태가 지속됨
- 다른 탭(위키 등)을 방문했다가 돌아와야 완성됨
- Phase 6 Step 2에서 개선했으나 여전히 발생
```

#### 원인 분석 필요
- `useWikiData.js`의 폴링 메커니즘 확인
- `wikiData?.ai_practical_info === '[[LOADING]]'` 상태 전환 확인
- 이벤트 리스너 (`request-ai-info`) 타이밍 이슈
- DB 폴링 간격 및 상태 동기화 문제

#### 해결 방안
1. 폴링 로직 강화 (3초 → 2초로 단축?)
2. 로딩 상태 디버깅 로그 추가
3. 탭 전환 시 강제 데이터 갱신 트리거
4. WebSocket 기반 실시간 업데이트 검토 (선택)

---

### 2. 강제 갱신 버튼 제거 (Medium)

#### 현재 위치
```jsx
// ToolkitTab.jsx:346-353
<button
    onClick={handleRemoteUpdate}
    className="p-1.5 hover:bg-blue-50..."
    title="AI 툴킷 강제 최신화 (관리자/테스트용)"
>
    <RefreshCw size={12} />
    <span className="text-[10px] font-bold">강제 갱신</span>
</button>
```

#### 제거 이유
- 일반 사용자에게 혼란 유발
- 로딩 문제가 해결되면 불필요
- 관리자용 기능은 숨김 처리 권장

#### 조치
- 버튼 완전 제거 또는
- 관리자 권한 체크 후 조건부 렌더링
- 키보드 단축키(Ctrl+Shift+R)로 대체 검토

---

### 3. 콘솔 로그 최적화 (Medium)

#### 문제 분석

**A. 반복되는 aiDataParser 경고**
```
[aiDataParser] 툴킷 데이터 분리 구분자(---[TOOLKIT_START]---)를 찾을 수 없습니다.
원본 전체를 위키로 처리합니다.
```

**원인:**
- 구버전 데이터(essential_guide 사용) 접근 시 발생
- 매 렌더링마다 반복 출력 (React 리렌더링)
- 10-20회 연속 출력

**해결:**
```javascript
// aiDataParser.js
let hasWarned = false; // 플래그 추가

export const parseAiPracticalInfo = (markdown) => {
    if (!markdown || markdown === '[[LOADING]]') {
        return { wikiContent: null, toolkitData: null };
    }

    const startMatch = markdown.match(startRegex);
    const endMatch = markdown.match(endRegex);

    if (!startMatch || !endMatch) {
        // 한 번만 경고
        if (!hasWarned) {
            console.warn("[aiDataParser] 툴킷 데이터 분리 구분자를 찾을 수 없습니다. Fallback 모드.");
            hasWarned = true;
        }
        return { wikiContent: markdown.trim(), toolkitData: null };
    }
    // ...
};
```

**B. 불필요한 디버깅 로그**
```
[tp] emerald monetization enabled
[tp] link_switcher convert links
📊 [Rank] Successfully added 'view' score
[Vercel Web Analytics] [view]
```

**조치:**
- Production 환경에서는 `console.log` 제거
- `console.warn`/`console.error`만 유지
- 개발 환경 체크: `if (import.meta.env.DEV)`

**C. 성공 로그 정리**
```
[aiDataParser] 툴킷 구분자 매칭 성공, 파싱 시작...
[aiDataParser] 툴킷 파싱 완료. (8개 항목 성공)
```

**조치:**
- 성공 로그는 상세 모드(verbose)에서만 출력
- 에러/경고만 기본 출력

---

### 4. 툴킷 항목별 가독성 개선 (Low-Medium)

#### 현재 문제점
- 불필요한 기호 (예: `**`, `*`, `|`)
- 부자연스러운 줄바꿈
- 텍스트 밀도 불균형

#### 개선 방안

**A. 백엔드 프롬프트 개선 (AI 출력 품질)**
```
supabase/functions/update-place-wiki/index.ts

현재 프롬프트에 추가:
- "각 항목은 2-3문장으로 간결하게 작성하세요"
- "불필요한 마크다운 기호를 사용하지 마세요"
- "자연스러운 경어체로 작성하세요"
- "핵심 정보를 먼저, 부가 정보를 나중에 배치하세요"
```

**B. 프론트엔드 텍스트 정제**
```javascript
// ToolkitTab.jsx - ToolkitCard 내부
const cleanAdviceText = (text) => {
    if (!text) return text;
    
    return text
        .replace(/\*\*/g, '') // ** 제거
        .replace(/\* /g, '• ') // 리스트 기호 통일
        .replace(/\n{3,}/g, '\n\n') // 과도한 줄바꿈 제거
        .trim();
};

<CopyableText 
    text={cleanAdviceText(data?.advice)} 
    locationName={location?.name} 
    type={type} 
/>
```

**C. 타이포그래피 개선**
```jsx
// ToolkitTab.jsx:184
<p className="text-sm text-gray-700 leading-relaxed mb-5 flex-1 select-text break-keep">
```

현재: `leading-relaxed` (1.625)
제안: `leading-normal` (1.5) 또는 커스텀 `leading-[1.7]`

---

## 🎯 Phase 7 구현 순서

### Priority 1: 버그 수정
1. **로딩 동기화 완벽 해결**
   - 폴링 로직 강화
   - 상태 전환 디버깅
   - 예상 시간: 1-1.5시간

2. **콘솔 로그 최적화**
   - aiDataParser 경고 중복 제거
   - Production 로그 필터링
   - 예상 시간: 30분

3. **강제 갱신 버튼 제거**
   - 버튼 UI 제거
   - 대체 기능 검토
   - 예상 시간: 15분

### Priority 2: 가독성 개선
4. **툴킷 텍스트 정제**
   - 프론트엔드 클린업 함수 추가
   - 타이포그래피 조정
   - 예상 시간: 30-45분

5. **백엔드 프롬프트 개선** (선택)
   - AI 출력 품질 향상
   - 예상 시간: 30분

---

## 📝 세션 관리 전략

### 현재 세션 종료 권장 이유
1. ✅ Phase 6 목표 100% 달성
2. ✅ 토큰 사용량 양호 (38.5%)
3. ✅ 명확한 커밋 이력 (5개)
4. 🔍 새로운 버그 발견 → 새 컨텍스트에서 집중 분석 필요

### 다음 세션 준비사항
1. 콘솔 로그 캡처본 준비
2. 로딩 재현 시나리오 작성
3. 테스트 케이스 리스트업

---

## ✅ Phase 7 완료 기준

### 필수 (Must Have)
- [ ] 툴킷 탭에서 직접 진입 시 정상 로딩 완료
- [ ] 콘솔 경고 메시지 80% 이상 감소
- [ ] 강제 갱신 버튼 제거 완료

### 선택 (Nice to Have)
- [ ] 툴킷 텍스트 가독성 20% 향상
- [ ] 백엔드 프롬프트 개선 적용
- [ ] 로딩 상태 시각적 피드백 개선

---

## 🔧 기술적 개선 아이디어

### A. 폴링 대신 WebSocket 검토
```javascript
// useWikiData.js 개선안
const useRealtimeWikiData = (placeId) => {
    useEffect(() => {
        const subscription = supabase
            .channel(`wiki:${placeId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'place_wiki',
                filter: `place_id=eq.${placeId}`
            }, (payload) => {
                setWikiData(payload.new);
            })
            .subscribe();

        return () => subscription.unsubscribe();
    }, [placeId]);
};
```

### B. 로딩 상태 머신
```javascript
const LOADING_STATES = {
    IDLE: 'idle',
    FETCHING: 'fetching',
    AI_PROCESSING: 'ai_processing',
    COMPLETED: 'completed',
    ERROR: 'error'
};

// 명확한 상태 전환으로 디버깅 용이
```

### C. 에러 바운더리
```jsx
<ErrorBoundary fallback={<ToolkitErrorView />}>
    <ToolkitTab {...props} />
</ErrorBoundary>
```

---

## 📚 참고 자료
- Phase 6 계획서: `plans/toolkit-optimization-phase6-plan.md`
- 콘솔 로그 분석: 위 사용자 제공 로그 참조
- React DevTools Profiler 사용 권장

---

**작성일**: 2026-03-30  
**다음 세션 예상 시간**: 2-3시간  
**우선순위**: 로딩 버그 > 콘솔 정리 > 가독성
