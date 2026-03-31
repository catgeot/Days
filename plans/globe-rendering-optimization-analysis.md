# 지구본 렌더링 최적화 분석 및 실행 계획

**작성일**: 2026-03-30  
**우선순위**: 🔥 HIGH (즉시 수정 필요)

---

## 🚨 발견된 문제

### 1. 메타데이터 미사용 문제

**현상**:
- `travelSpots.js`에 `showOnGlobe`와 `denseRegion` 메타데이터가 추가되었으나
- `HomeGlobe.jsx`에서 이 메타데이터를 **전혀 사용하지 않음**
- 결과적으로 100개 여행지가 **모두 지구본에 표시**되고 있음

**현재 코드 (HomeGlobe.jsx:213-219)**:
```javascript
const allMarkers = useMemo(() => {
    let result = [];
    const threshold = 0.05;
    const findMatchIndex = (lat, lng) => result.findIndex(m => Math.abs(m.lat - lat) < threshold && Math.abs(m.lng - lng) < threshold);

    travelSpots.forEach(spot => { 
        result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false });
    });
    // ...
}, [travelSpots, savedTrips, tempPinsData, activePinId]);
```

**문제점**:
- `showOnGlobe === false`인 8개 여행지도 지구본에 표시됨
- 200개로 확장 시 밀집 지역 최적화 전혀 작동하지 않음
- 유럽/아시아 밀집 지역이 아이콘으로 뒤덮일 것

---

## 📊 현재 데이터 분석

### travelSpots.js (100개)

#### 지구본 표시 상태
```
showOnGlobe: true   →  92개 (92%)
showOnGlobe: false  →   8개 (8%)
─────────────────────────────
총합:               100개
```

#### 숨겨진 8개 여행지 (showOnGlobe: false)

| ID | 이름 | 영문명 | 밀집지역 | 카테고리 |
|----|------|--------|----------|----------|
| 115 | 팔라완 | Palawan | southeast-asia | paradise |
| 117 | 발리 | Bali | southeast-asia | paradise |
| 205 | 후지산 | Mount Fuji | east-asia | nature |
| 507 | 로스앤젤레스 | Los Angeles | us-west-coast | adventure |
| 509 | 베를린 | Berlin | western-europe | adventure |
| 511 | 서울 | Seoul | east-asia | adventure |
| 604 | 암스테르담 | Amsterdam | western-europe | urban |
| 609 | 피렌체 | Florence | southern-europe | culture |

#### 밀집 지역 분석

| 밀집지역 ID | 지역명 | 숨겨진 수 | 대표 도시 |
|------------|--------|-----------|----------|
| `southeast-asia` | 동남아시아 | 2개 | 방콕, 싱가포르, 앙코르 와트 |
| `east-asia` | 동아시아 | 2개 | 도쿄, 홍콩, 타이베이, 상하이, 교토 |
| `western-europe` | 서유럽 | 2개 | 런던, 파리, 바르셀로나, 프라하 |
| `southern-europe` | 남유럽 | 1개 | 로마, 베니스 |
| `us-west-coast` | 미서부 해안 | 1개 | 샌프란시스코 |

---

## 🎯 최적화 전략

### Phase 1: 즉시 적용 (현재 100개)

#### 목표
- `showOnGlobe === true`인 92개만 지구본에 표시
- 밀집 지역 8개는 카테고리 트리나 검색으로만 접근

#### 구현 방법
**HomeGlobe.jsx 수정** (Line 218):
```javascript
// BEFORE (현재)
travelSpots.forEach(spot => { 
    result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false });
});

// AFTER (수정 필요)
travelSpots
    .filter(spot => spot.showOnGlobe !== false)  // showOnGlobe 필터링
    .forEach(spot => { 
        result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false });
    });
```

#### 예상 효과
- ✅ 지구본 마커 100개 → 92개 (8% 감소)
- ✅ 밀집 지역 시각적 혼잡도 완화
- ✅ Phase 2 확장 준비 완료

---

### Phase 2: 200개 확장 시 적용 (향후)

#### 목표
- 200개 중 **80-100개만 지구본 표시** (40-50%)
- 나머지 100-120개는 카테고리 트리/검색 전용

#### 밀집 지역 관리 전략

**1단계: 정적 필터링 (현재 적용)**
```
초기 로딩 시:
- showOnGlobe: true  → 80-100개 표시
- showOnGlobe: false → 100-120개 숨김
```

**2단계: 동적 LOD (향후 고려)**
```javascript
// 줌 레벨에 따른 점진적 표시
const visibleSpots = useMemo(() => {
    if (lodLevel === 0) {
        // 줌 아웃: Tier 1만 표시 (40개)
        return travelSpots.filter(s => s.tier === 1 && s.showOnGlobe);
    } else if (lodLevel === 1) {
        // 중간 줌: Tier 1-2 표시 (90개)
        return travelSpots.filter(s => s.tier <= 2 && s.showOnGlobe);
    } else {
        // 줌 인: 밀집 지역 포함 모두 표시 (200개)
        return travelSpots;
    }
}, [travelSpots, lodLevel]);
```

#### 밀집 지역별 표시 개수 제한

| 지역 | 총 여행지 | 지구본 표시 | 숨김 | 비율 |
|------|-----------|-------------|------|------|
| western-europe | 40개 | 15개 | 25개 | 37% |
| east-asia | 35개 | 12개 | 23개 | 34% |
| southeast-asia | 30개 | 10개 | 20개 | 33% |
| us-east-coast | 15개 | 8개 | 7개 | 53% |
| southern-europe | 20개 | 8개 | 12개 | 40% |
| 기타 지역 | 60개 | 47개 | 13개 | 78% |
| **합계** | **200개** | **100개** | **100개** | **50%** |

**원칙**:
- 밀집 지역: 30-40%만 표시
- 오지/섬: 70-80% 표시
- Tier 1 여행지는 최우선 표시

---

## 🔧 즉시 수정 필요 사항

### 1. HomeGlobe.jsx 수정 (필수)

**파일**: `src/pages/Home/components/HomeGlobe.jsx`  
**위치**: Line 218  
**내용**: `showOnGlobe` 필터링 로직 추가

```javascript
// Line 213-219 수정
const allMarkers = useMemo(() => {
    let result = [];
    const threshold = 0.05;
    const findMatchIndex = (lat, lng) => result.findIndex(m => Math.abs(m.lat - lat) < threshold && Math.abs(m.lng - lng) < threshold);

    // ⭐ showOnGlobe 필터링 추가
    travelSpots
        .filter(spot => spot.showOnGlobe !== false)
        .forEach(spot => { 
            result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false });
        });
    
    // ... (나머지 로직 동일)
}, [travelSpots, savedTrips, tempPinsData, activePinId]);
```

### 2. 검색 시스템 검증 (권장)

**확인 사항**:
- ☐ 숨겨진 8개 여행지도 검색 가능한지 확인
- ☐ 카테고리 필터에서 접근 가능한지 확인
- ☐ 검색 결과 클릭 시 지구본에 임시 핀 생성되는지 확인

**예상 동작**:
1. 사용자가 "발리" 검색
2. 검색 결과에 발리 표시 ✅
3. 클릭 시 지구본에 임시 핀(tempPin) 생성 ✅
4. PlaceCard 열림 ✅

---

## 📋 실행 체크리스트

### 즉시 실행 (Phase 1)

- [ ] **Step 1**: `HomeGlobe.jsx` Line 218 수정
  - `showOnGlobe !== false` 필터 추가
  
- [ ] **Step 2**: 로컬 테스트
  - 지구본 마커 개수 확인 (92개여야 함)
  - 숨겨진 8개 검색 가능 확인
  
- [ ] **Step 3**: 밀집 지역 시각 확인
  - 동남아시아 (발리, 팔라완 숨김)
  - 동아시아 (후지산, 서울 숨김)
  - 서유럽 (암스테르담, 베를린 숨김)
  
- [ ] **Step 4**: 커밋
  ```bash
  git commit -m "fix(globe): showOnGlobe 필터링 로직 적용
  
  - 100개 중 92개만 지구본 표시
  - 밀집 지역 8개는 검색/카테고리 접근
  - 200개 확장 준비 완료"
  ```

### Phase 2 준비사항 (200개 확장 시)

- [ ] **Step 1**: 나머지 100개 여행지 수집
  - AI 자동 추출 (Gemini API)
  - 기존 100개 제외 조건 추가
  
- [ ] **Step 2**: 밀집도 재분석
  - 200개 기준 밀집 지역 재정의
  - `showOnGlobe` 비율 조정 (50% 표시 목표)
  
- [ ] **Step 3**: `denseRegion` 확장
  - 새 밀집 지역 ID 추가 필요 시
  - 예: `central-europe`, `south-asia`, `australia-nz`
  
- [ ] **Step 4**: 동적 LOD 검토
  - 줌 레벨별 표시 로직 설계
  - 성능 테스트 (200개 기준)

---

## 🎨 시각적 비교

### Before (현재 - 잘못된 상태)
```
지구본 마커: 100개 전체 표시
문제점:
❌ 동남아시아 지역 아이콘 밀집
❌ 동아시아 (일본/한국/중국) 밀집
❌ 서유럽 (파리/런던/암스테르담) 밀집
```

### After (수정 후 - 올바른 상태)
```
지구본 마커: 92개 (선별 표시)
개선점:
✅ 밀집 지역 8개 숨김으로 시각적 여유 확보
✅ 대륙별 균형 잡힌 분포
✅ 중요 여행지(Tier 1) 시각적 강조

숨겨진 8개 접근 방법:
→ 검색창에서 "발리" 검색
→ 카테고리 트리에서 선택
→ 클릭 시 임시 핀으로 표시
```

---

## 💡 추가 고려사항

### 1. 사용자 경험 (UX)

**숨겨진 여행지 발견성**:
- ✅ 검색으로 찾을 수 있음
- ✅ 카테고리 트리로 탐색 가능
- ⚠️ 우연한 발견(Serendipity) 감소

**해결책**:
- "오늘의 숨은 여행지" 섹션 추가 (향후)
- 밀집 지역 줌 인 시 점진적 표시 (Phase 2)

### 2. 성능 (Performance)

**현재 (100개)**:
- 92개 마커: 브라우저 부담 낮음 ✅
- 렌더링 지연 없음 ✅

**200개 확장 시**:
- 100개 표시: 여전히 원활 ✅
- 줌 인 시 200개 전체 표시: 성능 테스트 필요 ⚠️

### 3. 데이터 무결성

**검증 필요**:
- [ ] `showOnGlobe === undefined`인 레거시 데이터 없는지 확인
- [ ] `null` vs `false` 처리 일관성 확인

**권장 필터 로직**:
```javascript
// 명시적 false만 제외
.filter(spot => spot.showOnGlobe !== false)

// 또는 명시적 true만 포함
.filter(spot => spot.showOnGlobe === true)
```

현재 데이터는 모두 명시적으로 `true`/`false` 설정됨 → 안전 ✅

---

## 📊 예상 효과

### 즉시 효과 (Phase 1)
- ✅ 지구본 시각적 혼잡도 **8% 감소**
- ✅ 밀집 지역 가독성 향상
- ✅ Phase 2 확장 기반 마련

### 장기 효과 (Phase 2)
- ✅ 200개 중 100개 표시로 **50% 밀도 유지**
- ✅ 카테고리 트리 탐색 가치 증대
- ✅ 확장 가능한 시스템 구축

---

## 🔗 관련 문서

- [`plans/phase9-2-phase1-completion-report.md`](phase9-2-phase1-completion-report.md) - Phase 1 완료 보고서
- [`plans/globe-optimization-plan.md`](globe-optimization-plan.md) - 구 최적화 계획 (업데이트 필요)
- [`plans/destination-scope-analysis.md`](destination-scope-analysis.md) - 여행지 수량 분석

---

## ✅ 다음 액션

### 1순위 (즉시)
1. `HomeGlobe.jsx` 수정 (5분)
2. 로컬 테스트 (10분)
3. 커밋 & 푸시 (2분)

### 2순위 (이번 세션)
1. Phase 2 실행 가이드 업데이트
2. AI 프롬프트 준비 (나머지 100개 추출)
3. 밀집도 분석 스크립트 작성

### 3순위 (다음 세션)
1. 나머지 100개 여행지 추가
2. 200개 기준 밀집도 재분석
3. 동적 LOD 구현 검토

---

**작성자**: AI Architect  
**검토 필요**: 사용자 승인 후 즉시 적용  
**우선순위**: 🔥 HIGH - 즉시 수정 권장
