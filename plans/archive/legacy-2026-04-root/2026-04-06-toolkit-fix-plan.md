# 스마트 툴킷 간헐적 데이터 변경 수정 계획

**날짜**: 2026-04-06  
**우선순위**: 🔥 긴급  
**예상 소요**: 30분

---

## 🚨 최종 진단

### 근본 원인
`useToolkitData` 훅이 **mediaMode 변경 시 데이터를 null로 리셋**하는 구조로 인해, 일시적으로 `toolkitData`가 `null`이 되면서 UI가 **빈 상태**를 보여주거나, **구버전 데이터(place_wiki.essential_guide)**로 fallback하는 문제

### 문제 발생 시나리오

```javascript
// useToolkitData.js:19-27
useEffect(() => {
  if (!placeId) return;
  
  setToolkitData(null);  // ⚠️ 매번 null로 리셋
  setIsToolkitLoading(false);
  
  if (mediaMode !== 'TOOLKIT') {
    return;  // TOOLKIT 모드가 아니면 데이터 로드 안 함
  }
  
  fetchToolkitData();  // TOOLKIT 모드일 때만 로드
}, [placeId, mediaMode]);
```

**타임라인**:
1. 사용자가 다른 탭으로 이동 (GALLERY → WIKI)
2. `mediaMode` 변경 → `useEffect` 트리거
3. `toolkitData = null` 리셋
4. `mediaMode !== 'TOOLKIT'`이므로 조기 종료
5. **`toolkitData`는 null 상태로 유지**
6. 사용자가 다시 TOOLKIT 탭으로 돌아옴
7. `mediaMode = 'TOOLKIT'` → 데이터 패칭 시작
8. **순간적으로 null → 로딩 → 데이터 표시**

### DB 상태
- `place_wiki.essential_guide`: pre_travel 1개 (구버전, 2026-04-01)
- `place_toolkit.essential_guide`: pre_travel 2개 (신버전, 2026-04-06)

---

## ✅ 해결 방안

### 방안 1: 데이터 리셋 조건 변경 (권장) ⭐

**파일**: [`src/components/PlaceCard/hooks/useToolkitData.js`](../src/components/PlaceCard/hooks/useToolkitData.js)

**현재 (L19-27)**:
```javascript
useEffect(() => {
  if (!placeId) return;
  
  setToolkitData(null);  // ❌ 무조건 리셋
  setIsToolkitLoading(false);
  
  if (mediaMode !== 'TOOLKIT') {
    return;
  }
  
  fetchToolkitData();
}, [placeId, mediaMode]);
```

**수정 후**:
```javascript
useEffect(() => {
  if (!placeId) return;
  
  // ✅ TOOLKIT 모드가 아니면 아무것도 하지 않음 (데이터 유지)
  if (mediaMode !== 'TOOLKIT') {
    return;
  }
  
  // ✅ placeId 변경 시에만 리셋 (mediaMode 변경 시에는 유지)
  let isSubscribed = true;
  
  const fetchToolkitData = async () => {
    setIsToolkitLoading(true);
    
    // ... 기존 로직 유지
  };
  
  fetchToolkitData();
  
  return () => {
    isSubscribed = false;
  };
}, [placeId, mediaMode]);
```

**또는 더 명확하게**:
```javascript
// placeId 변경 시에만 리셋
useEffect(() => {
  setToolkitData(null);
  setIsToolkitLoading(false);
}, [placeId]);

// TOOLKIT 모드일 때만 데이터 로드
useEffect(() => {
  if (!placeId || mediaMode !== 'TOOLKIT') return;
  
  let isSubscribed = true;
  
  const fetchToolkitData = async () => {
    // 이미 데이터가 있으면 로딩 표시 안 함
    if (!toolkitData) {
      setIsToolkitLoading(true);
    }
    
    // ... 기존 패칭 로직
  };
  
  fetchToolkitData();
  
  return () => {
    isSubscribed = false;
  };
}, [placeId, mediaMode]);
```

---

### 방안 2: place_wiki.essential_guide 데이터 정리

**파일**: Supabase SQL Editor

**목적**: 혼동을 방지하기 위해 구버전 데이터 제거

```sql
-- place_wiki 테이블의 essential_guide 컬럼을 NULL로 설정
UPDATE place_wiki 
SET essential_guide = NULL 
WHERE place_id = '보라카이';

-- 또는 전체 마이그레이션
UPDATE place_wiki 
SET essential_guide = NULL 
WHERE essential_guide IS NOT NULL;
```

**장점**:
- 데이터 소스 단일화
- 혼동 방지

**단점**:
- 백업 데이터 손실
- 되돌리기 어려움

**권장**: 먼저 방안 1을 적용하고, 안정화 후 방안 2 실행

---

### 방안 3: Gemini AI 일관성 개선 (장기)

**파일**: [`supabase/functions/update-place-toolkit/index.ts`](../supabase/functions/update-place-toolkit/index.ts)

**수정 위치**: L112

**현재**:
```typescript
generationConfig: {
  responseMimeType: "application/json"
}
```

**수정 후**:
```typescript
generationConfig: {
  responseMimeType: "application/json",
  temperature: 0.3,  // 낮을수록 일관성 ↑ (기본값 1.0)
  topP: 0.8,
  topK: 40
}
```

---

## 📋 실행 계획

### 1단계: 즉시 수정 (우선순위 1)
- [x] 문제 진단 완료
- [ ] `useToolkitData.js` 수정 (방안 1)
- [ ] 로컬 테스트 (보라카이 탭 이동 반복)
- [ ] 커밋

### 2단계: DB 정리 (우선순위 2)
- [ ] `place_wiki.essential_guide` NULL 처리 (방안 2)
- [ ] 다른 장소들도 점검

### 3단계: AI 개선 (우선순위 3)
- [ ] `temperature` 파라미터 추가 (방안 3)
- [ ] Edge Function 재배포
- [ ] 신규 장소로 테스트

---

## 🧪 테스트 시나리오

1. **보라카이 장소 카드 열기**
2. **툴킷 탭 진입** → pre_travel 2개 확인
3. **다른 탭으로 이동** (GALLERY, WIKI 등)
4. **툴킷 탭으로 다시 돌아오기** (5회 반복)
5. **매번 동일한 데이터 표시 확인** ✅

---

## 📝 커밋 메시지 (예시)

```bash
fix(toolkit): useToolkitData 데이터 리셋 로직 개선

- mediaMode 변경 시 toolkitData를 null로 리셋하지 않도록 수정
- placeId 변경 시에만 데이터 리셋하여 탭 전환 시 데이터 유지
- 간헐적 데이터 변경 버그 해결 (보라카이 pre_travel 항목 불일치)

변경 파일:
- src/components/PlaceCard/hooks/useToolkitData.js

Related: #[이슈번호], phase8-3-toolkit-db-migration.md
```

---

**다음 단계**: Code 모드로 전환하여 수정 진행
