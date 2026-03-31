# 유럽 밀집도 개선 종합 계획

**작성일**: 2026-03-31  
**목표**: 유럽 지역 시각적 밀집감 개선 (프라하, 빈, 로마, 베니스 등)

---

## 📊 현황 분석

### 거리 분석 결과
```
✅ 150km 이내 중첩: 0쌍 (최적화 완료)

⚠️ 200-250km 구간 (시각적 밀집):
- 프라하 ↔ 빈: 251km (둘 다 T1, 표시 중)
- 로마 ↔ 피렌체: 231km (둘 다 T1, 표시 중)
- 피렌체 ↔ 베니스: 204km (둘 다 T1, 표시 중)
```

### 유럽 지역 현황
```
총 38개 여행지
├─ 표시: 22개 (58%)
└─ 숨김: 16개 (42%)

카테고리별:
- Urban: 11개 (대부분 T1)
- Culture: 8개 (대부분 T1)
- Nature: 2개
- Paradise: 1개 (산토리니)
```

---

## 🎯 개선 전략 (3단계)

### 전략 1: 지구본 마커 크기 최적화 (우선)
**목표**: 모바일 터치 최적화 + 시각적 여유 공간 확보

**현재 상태 확인 필요**:
- HomeGlobe.jsx의 pointRadius 설정
- 모바일/데스크톱 반응형 크기
- 터치 영역 (최소 44x44px 권장)

**권장 조정**:
```javascript
// 모바일: 더 작게 (밀집도 개선)
// 데스크톱: 현재 유지 또는 약간 축소
```

---

### 전략 2: 카테고리 재분류
**목표**: Urban → Culture 이동하여 카테고리 분산

#### 2.1 재분류 후보 (Urban → Culture)

**최우선 후보** (역사/문화 랜드마크 중심):
1. **에딘버러** (Edinburgh) - T1
   - 키워드: 스코틀랜드, **성**, **해리포터**, 프린지, **중세**
   - 이유: 에딘버러 성이 핵심 명소

2. **암스테르담** (Amsterdam) - T1
   - 키워드: 운하, **안네의집**, **반고흐**, 자전거, 튤립
   - 이유: 박물관과 역사 유적 중심

3. **스톡홀름** (Stockholm) - T1
   - 키워드: 스웨덴, 섬, 감라스탄, **바사박물관**, **노벨상**
   - 이유: 바사 박물관 등 문화 유적

**추가 고려 후보**:
4. **모스크바** (Moscow) - T1
   - 키워드: 대륙, 대도시, **역사/문화**
   - 이유: 크렘린, 붉은 광장 등 역사 유적

5. **베를린** (Berlin) - T1
   - 키워드: **베를린장벽**, **브란덴부르크문**, **역사**, 클럽, 예술
   - 이유: 현대사 중심 문화 도시

#### 2.2 재분류 효과
```
재분류 전:
- Urban: 11개 (밀집)
- Culture: 8개

재분류 후 (5개 이동):
- Urban: 6개 (분산)
- Culture: 13개 (균형)
```

---

### 전략 3: 이탈리아 집중 관리
**문제**: 로마, 피렌체, 베니스 모두 T1이면서 200-250km 간격

**해결 방안 A**: 피렌체 숨김 (가장 덜 필수적)
```
현재: 로마(✅) - 피렌체(✅) - 베니스(✅)
변경: 로마(✅) - 피렌체(❌) - 베니스(✅)

효과:
- 이탈리아 표시: 3개 → 2개
- 시각적 밀집도: 크게 개선
- 피렌체는 검색/리스트로 접근 가능
```

**해결 방안 B**: 피렌체 Culture 유지, Tier 조정 검토
```
피렌체는 이미 Culture 카테고리
→ Tier는 변경 불가 (T1 유지)
→ 방안 A (숨김 처리)가 현실적
```

---

## 🔧 구체적 실행 계획

### Step 1: 마커 크기 확인 및 조정

**파일**: [`src/pages/Home/components/HomeGlobe.jsx`](../src/pages/Home/components/HomeGlobe.jsx)

**확인 항목**:
```javascript
// pointRadius 설정 찾기
pointRadius={...}
pointAltitude={...}
```

**권장 설정** (예시):
```javascript
// 모바일 최적화
const isMobile = window.innerWidth < 768;
const pointRadius = isMobile ? 0.3 : 0.5; // 기존보다 20-30% 축소
```

---

### Step 2: 카테고리 재분류 실행

**파일**: [`src/pages/Home/data/travelSpots.js`](../src/pages/Home/data/travelSpots.js)

**변경 목록**:
```javascript
// 1. 에딘버러: Urban → Culture
{
  id: 741,
  name: "에딘버러",
  category: "culture",  // "urban" → "culture"
  primaryCategory: "culture",
  categories: ["culture", "urban"]
}

// 2. 암스테르담: Urban → Culture
{
  id: 105,
  name: "암스테르담",
  category: "culture",  // "urban" → "culture"
  primaryCategory: "culture",
  categories: ["culture", "urban"]
}

// 3. 스톡홀름: Urban → Culture
{
  id: 743,
  name: "스톡홀름",
  category: "culture",  // "urban" → "culture"
  primaryCategory: "culture",
  categories: ["culture", "urban"]
}

// 4. 모스크바: Urban → Culture (선택)
{
  id: 102,
  name: "모스크바",
  category: "culture",  // "urban" → "culture"
  primaryCategory: "culture",
  categories: ["culture", "urban"]
}

// 5. 베를린: Urban → Culture (선택)
{
  id: 107,
  name: "베를린",
  category: "culture",  // "urban" → "culture"
  primaryCategory: "culture",
  categories: ["culture", "urban"]
}
```

**검증**:
```bash
# 카테고리 변경 후 개수 확인
node scripts/verify-categories.cjs
```

---

### Step 3: 이탈리아 밀집도 개선

**옵션 A**: 피렌체 숨김 (권장)
```javascript
{
  id: 111,
  name: "피렌체",
  showOnGlobe: false,  // true → false
  // 검색과 리스트에서는 계속 접근 가능
}
```

**옵션 B**: 베니스 숨김 (대안)
```javascript
{
  id: 106,
  name: "베니스",
  showOnGlobe: false,  // true → false
}
```

**권장**: 옵션 A (피렌체 숨김)
- 이유: 로마와 베니스가 더 아이코닉
- 피렌체는 예술/문화 중심으로 Culture 카테고리에서 충분히 노출

---

### Step 4: 추가 고려사항

#### 4.1 스위스 산악 지역
```
현재 숨김: 취리히, 제네바
표시 중: 체르마트 (Nature)

→ 적절히 분산됨, 변경 불필요
```

#### 4.2 북유럽
```
표시 중: 코펜하겐, 스톡홀름, 오슬로 (표시는 숨김)

→ 거리 충분, 변경 불필요
```

#### 4.3 스페인
```
표시 중: 바르셀로나만
숨김: 마드리드, 세비야

→ 이미 최적화됨
```

---

## 📋 실행 체크리스트

### Phase 1: 분석 및 준비 ✅
- [x] 유럽 거리 분석
- [x] 중첩 쌍 확인 (150km 이내: 0쌍)
- [x] 200-250km 구간 확인
- [x] 카테고리 재분류 후보 선정

### Phase 2: 실행 (다음 단계)
- [ ] Step 2.1: 마커 크기 확인 및 조정
- [ ] Step 2.2: 카테고리 재분류 (5개: Urban → Culture)
- [ ] Step 2.3: 피렌체 showOnGlobe = false 처리
- [ ] Step 2.4: 데이터 저장 및 백업

### Phase 3: 검증
- [ ] 개발 서버 테스트
- [ ] 지구본 시각적 밀집도 확인
- [ ] 모바일 터치 테스트
- [ ] 검색 기능 확인 (숨겨진 여행지 접근 가능)
- [ ] 카테고리 리스트 확인

---

## 📊 예상 효과

### 변경 전
```
유럽 표시: 22개
├─ Urban: 11개 (밀집)
├─ Culture: 8개
└─ 기타: 3개

시각적 밀집 구간:
- 이탈리아: 3개 (로마, 피렌체, 베니스)
- 중부 유럽: 2개 (프라하, 빈)
```

### 변경 후
```
유럽 표시: 21개 (-1개)
├─ Urban: 6개 (-5개, 분산)
├─ Culture: 13개 (+5개, 균형)
└─ 기타: 2개

시각적 밀집 구간:
- 이탈리아: 2개 (로마, 베니스) ✅ 개선
- 중부 유럽: 2개 (프라하, 빈) → 유지
```

### 개선 지표
```
1. Urban 밀집도: 11개 → 6개 (-45%)
2. 이탈리아 밀집도: 3개 → 2개 (-33%)
3. 카테고리 균형: Urban/Culture 11:8 → 6:13 (균형)
4. 총 표시 개수: 100개 → 99개 (미미한 감소)
```

---

## 🎯 최종 권장사항

### 최우선 실행 (즉시)
1. **피렌체 숨김 처리** (showOnGlobe = false)
   - 효과: 이탈리아 밀집도 즉시 개선
   - 리스크: 없음 (검색/리스트 접근 가능)

2. **카테고리 재분류 3개** (최소)
   - 에딘버러: Urban → Culture
   - 암스테르담: Urban → Culture
   - 스톡홀름: Urban → Culture

### 추가 고려 (선택)
3. **카테고리 재분류 2개 추가**
   - 모스크바: Urban → Culture
   - 베를린: Urban → Culture

4. **마커 크기 조정**
   - 모바일: 20-30% 축소
   - 터치 영역 유지

---

## 🔄 롤백 계획

만약 변경 후 문제가 발생하면:

```bash
# 백업에서 복원
cp src/pages/Home/data/travelSpots-phase2-optimized.js src/pages/Home/data/travelSpots.js

# 또는 Git으로 되돌리기
git checkout src/pages/Home/data/travelSpots.js
```

---

**다음 단계**: 사용자 승인 후 Step 2 실행
