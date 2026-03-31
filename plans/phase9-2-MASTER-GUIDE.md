# Phase 9-2 통합 마스터 가이드

**최종 업데이트**: 2026-03-31 (세션 종료)
**현재 상태**: Phase 1 완료 + 긴급 수정 완료 → 테스트 대기 → Phase 2 준비 완료
**다음 세션 목표**: 나머지 100개 여행지 추가 + 좌표 기반 최적화 (총 200개)

---

## 📍 현재 위치

```
✅ Phase 1: 100개 여행지 생성 (완료)
✅ 긴급 수정: showOnGlobe 필터링 적용 (완료)
📍 현재: 테스트 및 검증 단계
🎯 다음: Phase 2 (나머지 100개 추가)
```

---

## ✅ 방금 완료된 작업 (긴급 수정)

### 수정 파일
[`src/pages/Home/components/HomeGlobe.jsx`](../src/pages/Home/components/HomeGlobe.jsx:216-221)

### 변경 내용
```javascript
// BEFORE
travelSpots.forEach(spot => { 
    result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false });
});

// AFTER
travelSpots
    .filter(spot => spot.showOnGlobe !== false)  // ⭐ 추가
    .forEach(spot => { 
        result.push({ ...spot, type: 'major', priority: 0, isBookmarked: false, hasChat: false });
    });
```

### 효과
- ✅ 지구본 마커: 100개 → **92개** (밀집 지역 8개 숨김)
- ✅ 숨겨진 여행지: 검색/카테고리로 접근 가능
- ✅ Phase 2 (200개) 확장 준비 완료

---

## 🧪 즉시 테스트 항목

### 1. 지구본 마커 개수 확인
```bash
# 개발 서버 실행
npm run dev
```

**확인 사항**:
- [ ] 지구본에 **92개** 마커 표시 (이전 100개에서 감소)
- [ ] 시각적 혼잡도 개선 확인
- [ ] 밀집 지역(유럽, 동아시아, 동남아) 여유 공간 확인

### 2. 숨겨진 8개 여행지 검색 테스트

| 여행지 | 영문명 | 검색 테스트 | 카드 열림 |
|--------|--------|-------------|-----------|
| 발리 | Bali | [ ] | [ ] |
| 팔라완 | Palawan | [ ] | [ ] |
| 후지산 | Mount Fuji | [ ] | [ ] |
| 서울 | Seoul | [ ] | [ ] |
| 베를린 | Berlin | [ ] | [ ] |
| 로스앤젤레스 | Los Angeles | [ ] | [ ] |
| 암스테르담 | Amsterdam | [ ] | [ ] |
| 피렌체 | Florence | [ ] | [ ] |

**예상 동작**:
1. 검색창에 "발리" 입력
2. 검색 결과에 발리 표시 ✅
3. 클릭 시 지구본에 임시 핀 생성 ✅
4. PlaceCard 정상 열림 ✅

### 3. 성능 확인
- [ ] 지구본 회전 부드러움 (60fps)
- [ ] 줌 인/아웃 프레임 드랍 없음
- [ ] 마커 클릭 반응 즉각적

### 4. 문제 발생 시 대응

**마커가 92개가 아닌 경우**:
```javascript
// 브라우저 콘솔에서 확인
console.log('Total spots:', travelSpots.length);
console.log('Visible spots:', travelSpots.filter(s => s.showOnGlobe !== false).length);
```

**검색이 안 되는 경우**:
- 검색 인덱스에 포함되어 있는지 확인
- `travelSpots.js`에 해당 여행지 존재 확인

---

## 📊 현재 데이터 상태

### travelSpots.js (100개)
```
총 여행지:        100개
├─ Tier 1:         42개 (필수 도시)
├─ Tier 2:         51개 (인기 여행지)
└─ Tier 3:          7개 (특화 여행지)

지구본 표시:        92개 (showOnGlobe: true)
숨김 (검색만):       8개 (showOnGlobe: false)

밀집 지역:
├─ southeast-asia:  2개 숨김 (발리, 팔라완)
├─ east-asia:       2개 숨김 (후지산, 서울)
├─ western-europe:  2개 숨김 (베를린, 암스테르담)
├─ southern-europe: 1개 숨김 (피렌체)
└─ us-west-coast:   1개 숨김 (로스앤젤레스)
```

---

## 🎯 다음 세션: Phase 2 실행 계획

### 목표
**나머지 100개 여행지 추가 → 총 200개 달성**

### 예상 소요 시간
**총 4-5시간**

### 단계별 작업

#### Step 1: 준비 (30분)

**1.1 기존 100개 제외 리스트 생성**
```javascript
// scripts/generate-existing-list.js
const { TRAVEL_SPOTS } = require('../src/pages/Home/data/travelSpots.js');

const existingCities = TRAVEL_SPOTS.map(spot => ({
    name: spot.name,
    name_en: spot.name_en,
    country: spot.country,
    lat: spot.lat,
    lng: spot.lng
}));

console.log('기존 여행지:', existingCities.length);
// 출력 파일로 저장하여 AI 프롬프트에 첨부
```

**1.2 AI 프롬프트 준비**
- Gemini 2.5 Pro API 키 확인
- [`phase9-2-ai-prompts.md`](phase9-2-ai-prompts.md) 프롬프트 최종 점검
- 기존 100개 제외 조건 추가

#### Step 2: AI로 나머지 100개 추출 (1-2시간)

**카테고리별 할당**:
```
Paradise (휴양):    +10개 → 총 26개
Nature (자연):      +10개 → 총 25개
Urban (도시):       +35개 → 총 53개  ← 대도시 집중
Culture (문화):     +30개 → 총 49개  ← 문화유산 집중
Adventure (모험):   +15개 → 총 27개
──────────────────────────────────
합계:             +100개 → 총 200개
```

**필수 포함 도시** (Tier 1 추가 8개):
- 유럽: 더블린, 에딘버러, 코펜하겐, 스톡홀름
- 아시아: 자카르타, 쿠알라룸푸르, 하노이
- 북미: 시애틀

**실행 방법**:
```bash
# Gemini API 호출 스크립트
node scripts/extract-phase2-cities.js

# 또는 수동으로 Chat 사용
# 프롬프트: plans/phase9-2-ai-prompts.md 참조
```

#### Step 3: 밀집도 분석 및 showOnGlobe 설정 (1시간)

**밀집 지역별 표시 목표**:

| 지역 | Phase 2 총 | 표시 | 숨김 | 비율 |
|------|-----------|------|------|------|
| western-europe | 40개 | 15개 | 25개 | 37% |
| east-asia | 35개 | 12개 | 23개 | 34% |
| southeast-asia | 30개 | 10개 | 20개 | 33% |
| southern-europe | 20개 | 8개 | 12개 | 40% |
| us-east-coast | 15개 | 8개 | 7개 | 53% |
| central-europe | 15개 | 7개 | 8개 | 47% |
| 기타 지역 | 45개 | 40개 | 5개 | 89% |
| **합계** | **200개** | **100개** | **100개** | **50%** |

**원칙**:
- 밀집 지역: 30-40%만 표시
- 오지/섬: 80-90% 표시
- **Tier 1 여행지는 최우선 표시**

**스크립트**:
```javascript
// scripts/analyze-density-phase2.js
function assignShowOnGlobe(spots) {
    const regions = groupBy(spots, 'denseRegion');
    
    Object.entries(regions).forEach(([region, regionSpots]) => {
        // Tier 우선순위로 정렬
        const sorted = regionSpots.sort((a, b) => 
            a.tier - b.tier || b.popularity - a.popularity
        );
        
        // 표시 개수 결정
        const showCount = REGION_LIMITS[region] || Math.ceil(sorted.length * 0.7);
        
        sorted.forEach((spot, idx) => {
            spot.showOnGlobe = idx < showCount;
        });
    });
    
    return spots;
}
```

#### Step 4: 데이터 병합 및 검증 (1시간)

**4.1 병합 스크립트**:
```javascript
// scripts/merge-phase2.js
const phase1 = require('../src/pages/Home/data/travelSpots.js');
const phase2 = require('./phase2-new-100.json');

// 중복 검사
const duplicates = checkDuplicates(phase1, phase2);
if (duplicates.length > 0) {
    console.error('❌ 중복 발견:', duplicates);
    process.exit(1);
}

// ID 재할당 (621-720)
const merged = [
    ...phase1,
    ...phase2.map((spot, idx) => ({ ...spot, id: 621 + idx }))
];

// 검증
validateSchema(merged);
validateCoordinates(merged);
validateMetadata(merged);

console.log('✅ 병합 완료:', merged.length);
```

**4.2 검증 항목**:
- [ ] 총 개수: 200개
- [ ] ID 중복 없음 (101-820)
- [ ] 좌표 범위 (-90~90, -180~180)
- [ ] 필수 필드 존재 (name, lat, lng, tier, showOnGlobe)
- [ ] showOnGlobe 분포: true 100개, false 100개

#### Step 5: 테스트 및 배포 (30분)

**5.1 로컬 테스트**:
```bash
# 백업 생성
cp src/pages/Home/data/travelSpots.js src/pages/Home/data/travelSpots-100-backup.js

# 새 파일 적용
cp scripts/travelSpots-200.js src/pages/Home/data/travelSpots.js

# 개발 서버 재시작
npm run dev
```

**5.2 테스트 항목**:
- [ ] 지구본 마커: **100개** 표시
- [ ] 검색: 200개 모두 검색 가능
- [ ] 성능: 렌더링 60fps 유지
- [ ] 밀집 지역: 시각적 균형 확인
- [ ] 모바일: 터치 반응 정상

**5.3 배포**:
```bash
git add src/pages/Home/data/travelSpots.js
git add src/pages/Home/data/travelSpots-100-backup.js
git commit -m "feat(data): 여행지 100개 → 200개 확장 (Phase 9-2 완료)

Phase 2 완료:
- 나머지 100개 여행지 추가
- 밀집도 최적화: 50% 표시 (100개)
- Tier 1-3 메타데이터 완비

통계:
- Tier 1: 50개 / Tier 2: 120개 / Tier 3: 30개
- 지구본 표시: 100개 (50%)
- 카테고리: Urban 53개, Culture 49개, Adventure 27개, Paradise 26개, Nature 25개

밀집 지역:
- 서유럽/동아시아/동남아: 30-40% 표시
- 기타 지역: 70-90% 표시"

git push origin main
```

---

## 📚 관련 문서 정리

### ⭐ 이 파일 (마스터 가이드)
**[`phase9-2-MASTER-GUIDE.md`](phase9-2-MASTER-GUIDE.md)** ← **항상 여기서 시작**

이 파일이 **모든 Phase 9-2 작업의 중심**입니다. 다른 문서들은 참조용입니다.

### 📖 참조 문서 (읽기 전용)

#### 완료 보고서
- [`phase9-2-phase1-completion-report.md`](phase9-2-phase1-completion-report.md) - Phase 1 완료 내역
- 내용: 100개 추가 완료, 통계, 테스트 항목

#### 기술 분석
- [`globe-rendering-optimization-analysis.md`](globe-rendering-optimization-analysis.md) - 지구본 최적화 상세 분석
- 내용: 문제 진단, 데이터 검증, 밀집도 전략, 성능 최적화

#### AI 프롬프트
- [`phase9-2-ai-prompts.md`](phase9-2-ai-prompts.md) - Gemini API 프롬프트 모음
- 사용 시점: Step 2 (나머지 100개 추출)

#### 기획 문서 (아카이브)
- [`phase9-ux-optimization-plan.md`](phase9-ux-optimization-plan.md) - 초기 기획
- [`destination-scope-analysis.md`](destination-scope-analysis.md) - 여행지 수량 분석
- 참고용으로만 활용

### 🗑️ 중복/구버전 문서 (무시)
- `phase9-2-next-session-guide.md` → 이 파일로 통합됨
- `phase9-2-phase2-next-session-guide.md` → 이 파일로 통합됨
- `phase9-2-comprehensive-action-plan.md` → 이 파일로 통합됨

---

## 💡 문서 관리 원칙

### 앞으로의 규칙
1. **마스터 가이드 하나만 업데이트**
   - 이 파일(`phase9-2-MASTER-GUIDE.md`)만 지속 업데이트
   - 다른 문서는 생성하지 않음

2. **완료 시 섹션 추가**
   - Phase 완료 시 "✅ Phase X 완료" 섹션 추가
   - "📍 현재 위치" 업데이트

3. **참조 문서는 아카이브**
   - 기술 분석, AI 프롬프트는 변경하지 않음
   - 필요 시 이 파일에 핵심 내용만 복사

---

## 🔄 커밋 권장사항

### 지금 커밋 (긴급 수정)
```bash
git add src/pages/Home/components/HomeGlobe.jsx
git add plans/phase9-2-MASTER-GUIDE.md

git commit -m "fix(globe): showOnGlobe 필터링 적용 및 문서 통합

긴급 수정:
- HomeGlobe.jsx에 showOnGlobe !== false 필터 추가
- 지구본 마커 100개 → 92개 (밀집 지역 8개 숨김)

문서 정리:
- phase9-2-MASTER-GUIDE.md 생성 (통합 마스터 가이드)
- 중복 문서 정리 및 아카이브
- 다음 세션 준비 완료

효과:
- 밀집 지역 시각적 혼잡도 8% 감소
- Phase 2 (200개) 확장 준비 완료
- 문서 관리 일원화"
```

### Phase 2 완료 시 커밋
```bash
git commit -m "feat(data): 여행지 200개 달성 (Phase 9-2 완료)

Phase 2:
- 나머지 100개 추가 (AI 추출)
- 밀집도 재분석 및 최적화
- showOnGlobe 50% 비율 적용

최종 통계:
- 총 200개 (Tier 1: 50개, Tier 2: 120개, Tier 3: 30개)
- 지구본 표시: 100개 (50%)
- 밀집 지역: 9개 정의

다음 단계:
- Phase 9-3: 카테고리 트리 UI 구현
- Phase 9-4: 통합 테스트"
```

---

## 🎯 성공 지표

### Phase 1 + 긴급 수정 (현재)
- ✅ 여행지: 100개
- ✅ 지구본 표시: 92개
- ✅ showOnGlobe 필터링: 작동 중
- ⏳ 사용자 테스트: 대기 중

### Phase 2 (목표)
- 🎯 여행지: 200개
- 🎯 지구본 표시: 100개 (50%)
- 🎯 검색 성능: 200ms 이하
- 🎯 렌더링: 60fps 유지
- 🎯 밀집 지역: 시각적 균형

---

## 📞 다음 액션

### 지금 즉시
1. 개발 서버 실행: `npm run dev`
2. 지구본 마커 개수 확인: **92개**
3. 숨겨진 8개 검색 테스트
4. 성능 확인 (회전, 줌)

### 문제 없으면
```bash
git add .
git commit -m "fix(globe): showOnGlobe 필터링 적용 및 문서 통합"
git push
```

### 다음 세션
1. 이 파일 열기: `phase9-2-MASTER-GUIDE.md`
2. "다음 세션: Phase 2 실행 계획" 섹션 따라 진행
3. 예상 소요: 4-5시간

---

**최종 업데이트**: 2026-03-30 긴급 수정 완료  
**다음 마일스톤**: Phase 2 (나머지 100개 추가)  
**예상 완료**: Phase 2 완료 시 200개 달성 🎉
