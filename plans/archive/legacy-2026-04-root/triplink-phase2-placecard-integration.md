# 트립링크 Phase 2: 장소 카드 패키지 버튼 연동 계획

**작성일**: 2026-04-20  
**목표**: 장소 카드(PlaceCard)의 위키탭과 플래너탭에 트립링크 패키지 버튼을 추가하여 맥락형 패키지 상품 노출

---

## 1. 현재 상황 분석

### ✅ 완료된 작업 (Phase 1)
- `TripLinkSectionCard.jsx`: Unsplash 사진 기반 네이티브 썸네일 카드 구현
- `TripLinkModal.jsx`: 대화면 모달 팝업 (1024x768 iframe 렌더링)
- `tripLinkPackages.js`: 테마별 패키지 데이터 구조 (family, longhaul, resort)
- `SearchDiscoveryModal`: 홈 탐색창 에디터스 픽에 인피드 광고 형태로 패키지 카드 노출

### 🎯 Phase 2 목표
1. **여행지별 키워드 동적 매핑 시스템 구축**
   - 각 장소(예: 다낭, 파리, 홋카이도)에 적합한 패키지를 자동으로 매칭
   - 사용자가 트립링크에서 수집한 iframe 링크를 관리할 수 있는 데이터 구조 설계

2. **PlaceCard 통합**
   - 위키탭 하단: "제미나이 최신 정보 요청" 버튼 옆에 패키지 버튼 추가
   - 플래너탭 상단: "앱으로 여정 보내기" 버튼 제거 후 패키지 버튼 배치

---

## 2. 여행지 키워드 동적 매핑 전략

### 2.1 매핑 데이터 구조 설계

**목표**: 
- 장소명(한글/영문)과 트립링크 패키지를 연결하는 매핑 테이블 생성
- 유연한 확장성: 사용자가 새로운 링크를 추가할 때마다 쉽게 업데이트 가능

**제안 구조** (`src/pages/Home/data/tripLinkDestinationMap.js`):

```javascript
// 여행지별 트립링크 패키지 매핑
export const DESTINATION_PACKAGE_MAP = {
  // 베트남 (가족/휴양)
  "다낭": ["family-vietnam-danang", "resort-vietnam-beach"],
  "나트랑": ["family-vietnam-nhatrang"],
  "푸꾸옥": ["resort-vietnam-phuquoc"],
  "호이안": ["family-vietnam-hoian"],
  
  // 일본 (가족/근거리)
  "홋카이도": ["family-japan-hokkaido"],
  "북해도": ["family-japan-hokkaido"],
  "삿포로": ["family-japan-hokkaido"],
  "오사카": ["family-japan-osaka"],
  "도쿄": ["family-japan-tokyo"],
  "후쿠오카": ["family-japan-fukuoka"],
  
  // 유럽 (장거리/일주)
  "파리": ["longhaul-europe-west"],
  "로마": ["longhaul-europe-west"],
  "런던": ["longhaul-europe-west"],
  "바르셀로나": ["longhaul-europe-west"],
  "프라하": ["longhaul-europe-east"],
  "부다페스트": ["longhaul-europe-east"],
  "크로아티아": ["longhaul-europe-east"],
  "두브로브니크": ["longhaul-europe-east"],
  
  // 남태평양/동남아 (휴양/에어텔)
  "괌": ["resort-pacific-guam"],
  "사이판": ["resort-pacific-saipan"],
  "코타키나발루": ["resort-sea-kotakinabalu"],
  "쿠알라룸푸르": ["resort-sea-kl"],
  "발리": ["resort-sea-bali"],
  "푸켓": ["resort-sea-phuket"],
  "보라카이": ["resort-sea-boracay"],
  
  // 중국어권
  "타이베이": ["family-asia-taipei"],
  "타이중": ["family-asia-taichung"],
  "홍콩": ["family-asia-hongkong"],
  "마카오": ["family-asia-macau"],
  
  // 기타 아시아
  "방콕": ["family-asia-bangkok"],
  "치앙마이": ["family-asia-chiangmai"],
  "싱가포르": ["family-asia-singapore"],
};

// 패키지 ID를 실제 패키지 객체로 변환하는 매핑
export const PACKAGE_DETAILS = {
  // 가족/효도 (베트남)
  "family-vietnam-danang": {
    id: "family-vietnam-danang",
    type: "iframe",
    adKey: "hbxakj", // 다낭/호이안/나트랑/푸꾸옥 통합
    targetKeyword: "Da Nang",
    title: "베트남 다낭/나트랑",
    description: "가족 휴양 특가 패키지",
    width: 1024,
    height: 768,
    category: "family"
  },
  
  // 가족/효도 (일본)
  "family-japan-hokkaido": {
    id: "family-japan-hokkaido",
    type: "iframe",
    adKey: "iosw2r",
    targetKeyword: "Hokkaido",
    title: "일본 홋카이도",
    description: "감성 가득한 온천/가족 여행",
    width: 1024,
    height: 768,
    category: "family"
  },
  
  // 장거리 (서유럽)
  "longhaul-europe-west": {
    id: "longhaul-europe-west",
    type: "iframe",
    adKey: "wx9egs",
    targetKeyword: "Paris",
    title: "서유럽 핵심 일주",
    description: "전문가 동행 프리미엄 패키지",
    width: 1024,
    height: 768,
    category: "longhaul"
  },
  
  // 장거리 (동유럽)
  "longhaul-europe-east": {
    id: "longhaul-europe-east",
    type: "iframe",
    adKey: "8zfodz",
    targetKeyword: "Prague",
    title: "동유럽/발칸 3국",
    description: "낭만 가득한 장거리 추천 패키지",
    width: 1024,
    height: 768,
    category: "longhaul"
  },
  
  // 휴양/에어텔 (남태평양)
  "resort-pacific-guam": {
    id: "resort-pacific-guam",
    type: "iframe",
    adKey: "1c4mmw",
    targetKeyword: "Guam",
    title: "남태평양 괌/사이판",
    description: "완벽한 에어텔/올인클루시브",
    width: 1024,
    height: 768,
    category: "resort"
  },
  
  // 휴양/에어텔 (동남아)
  "resort-sea-kotakinabalu": {
    id: "resort-sea-kotakinabalu",
    type: "iframe",
    adKey: "nnpyr1",
    targetKeyword: "Kota Kinabalu",
    title: "말레이시아 코타키나발루",
    description: "노을이 아름다운 특가 에어텔",
    width: 1024,
    height: 768,
    category: "resort"
  },
  
  // TODO: 사용자가 수집한 링크를 여기에 추가
  // "패키지ID": { ... }
};
```

### 2.2 패키지 필터링 유틸리티 함수

**파일**: `src/utils/tripLinkMatcher.js`

```javascript
import { DESTINATION_PACKAGE_MAP, PACKAGE_DETAILS } from '../pages/Home/data/tripLinkDestinationMap';

/**
 * 여행지명(한글/영문)으로 적합한 패키지 목록 반환
 * @param {Object} location - 장소 객체 { name, name_en, country, ... }
 * @returns {Array} - 패키지 객체 배열
 */
export const getPackagesForDestination = (location) => {
  if (!location) return [];
  
  const searchKeys = [
    location.name,           // 한글명: 다낭
    location.name_en,        // 영문명: Da Nang
    location.destination,    // destination 필드
    location.city,           // city 필드
  ].filter(Boolean);
  
  const packageIds = new Set();
  
  // 검색 키워드로 매핑 테이블 탐색
  searchKeys.forEach(key => {
    const normalizedKey = key.trim().toLowerCase();
    
    // 정확히 일치하는 매핑 찾기
    Object.keys(DESTINATION_PACKAGE_MAP).forEach(destKey => {
      if (destKey.toLowerCase() === normalizedKey || 
          normalizedKey.includes(destKey.toLowerCase()) ||
          destKey.toLowerCase().includes(normalizedKey)) {
        DESTINATION_PACKAGE_MAP[destKey].forEach(pkgId => packageIds.add(pkgId));
      }
    });
  });
  
  // 패키지 ID를 실제 객체로 변환
  const packages = Array.from(packageIds)
    .map(id => PACKAGE_DETAILS[id])
    .filter(Boolean);
  
  // 매칭된 패키지가 없으면 국가/대륙 기반 폴백
  if (packages.length === 0) {
    const fallbackPackages = getFallbackPackages(location);
    packages.push(...fallbackPackages);
  }
  
  return packages;
};

/**
 * 폴백: 국가/대륙 기반으로 일반 패키지 추천
 */
const getFallbackPackages = (location) => {
  const country = location.country?.toLowerCase() || '';
  const continent = location.continent?.toLowerCase() || '';
  
  // 유럽
  if (continent.includes('europe') || continent.includes('유럽')) {
    return [PACKAGE_DETAILS['longhaul-europe-west']].filter(Boolean);
  }
  
  // 동남아
  if (['vietnam', 'thailand', 'malaysia', 'indonesia', 'philippines'].some(c => country.includes(c))) {
    return [PACKAGE_DETAILS['resort-sea-kotakinabalu']].filter(Boolean);
  }
  
  // 일본
  if (country.includes('japan') || country.includes('일본')) {
    return [PACKAGE_DETAILS['family-japan-hokkaido']].filter(Boolean);
  }
  
  // 남태평양
  if (['guam', 'saipan', 'palau'].some(c => country.includes(c))) {
    return [PACKAGE_DETAILS['resort-pacific-guam']].filter(Boolean);
  }
  
  return [];
};
```

---

## 3. PlaceCard 위키탭 버튼 추가

### 3.1 현재 구조 분석
- **파일**: `src/components/PlaceCard/views/PlaceWikiDetailsView.jsx`
- **현재 버튼**: 하단 고정된 "제미나이에게 최신 정보 요청" 버튼 (1개)
- **목표**: 이 버튼 옆에 "패키지 상품 보기" 버튼 추가 (2개 나란히 배치)

### 3.2 구현 계획

**변경 사항**:
1. `PlaceWikiDetailsView`에 `onOpenPackageModal` prop 추가
2. 하단 버튼 영역을 flexbox로 변경하여 2개 버튼 나란히 배치
3. 모바일: 버튼을 세로로 쌓거나 적절히 줄바꿈
4. PC: 버튼을 가로로 나란히 배치

**버튼 디자인**:
- 제미나이 버튼: 기존 파란색 유지
- 패키지 버튼: 보라색/그라데이션 (`from-purple-600 to-blue-600`)
- 아이콘: `Package` 또는 `Briefcase`

---

## 4. PlaceCard 플래너탭 버튼 추가

### 4.1 현재 구조 분석
- **파일**: `src/components/PlaceCard/tabs/PlannerTab.jsx`
- **현재 버튼**: "앱으로 전체 일정 보내기" 버튼 (PC 상단 우측, 모바일 하단 고정)
- **목표**: 이 버튼을 제거하고 "패키지로 여행 준비하기" 버튼으로 교체

### 4.2 구현 계획

**변경 사항**:
1. `handleAppBridgeClick` 로직을 `handleOpenPackageModal`로 교체
2. 버튼 텍스트: "패키지로 간편하게 준비하기"
3. 버튼 위치는 기존과 동일 (PC 상단, 모바일 하단)
4. 클릭 시 해당 여행지에 맞는 패키지 모달 오픈

**조건부 렌더링**:
- 해당 여행지에 매칭되는 패키지가 있을 때만 버튼 표시
- 매칭된 패키지가 없으면 버튼 숨김 (기존 앱 전송 버튼도 제거)

---

## 5. TripLinkModal 재사용 구조

### 5.1 현재 문제
- `TripLinkModal`이 `SearchDiscoveryModal` 내부에서만 사용됨
- PlaceCard에서도 사용하려면 전역 또는 상위 컴포넌트로 이동 필요

### 5.2 해결 방안

**옵션 A: 모달을 PlaceCard 레벨로 이동**
- `PlaceCardExpanded`에서 `TripLinkModal` 상태 관리
- 위키탭과 플래너탭에서 `onOpenPackageModal` 콜백으로 모달 오픈

**옵션 B: 전역 모달 컨텍스트 생성**
- `TripLinkModalContext` 생성
- 앱 최상위에서 모달을 관리하고 어디서든 열 수 있도록 구현

**권장**: 옵션 A (PlaceCard 레벨로 이동)
- 단순하고 직관적
- SearchDiscoveryModal과 PlaceCard에서 각각 독립적으로 모달 관리
- 상태 격리로 부작용 최소화

---

## 6. 구현 단계별 체크리스트

### Phase 2-1: 여행지 키워드 동적 매핑 (우선 작업)
- [ ] `tripLinkDestinationMap.js` 파일 생성
- [ ] `DESTINATION_PACKAGE_MAP` 기본 매핑 데이터 입력
- [ ] `PACKAGE_DETAILS` 기본 패키지 상세 정보 입력
- [ ] `tripLinkMatcher.js` 유틸리티 함수 개발
- [ ] 매핑 로직 테스트 (콘솔 로그로 확인)

### Phase 2-2: PlaceCard 모달 통합
- [ ] `TripLinkModal.jsx`를 `src/components/PlaceCard/modals/`로 복사
- [ ] `PlaceCardExpanded`에 모달 상태 추가 (`selectedPackage`, `setSelectedPackage`)
- [ ] `onOpenPackageModal` prop을 위키탭과 플래너탭에 전달

### Phase 2-3: 위키탭 버튼 추가
- [ ] `PlaceWikiDetailsView`에 패키지 버튼 UI 추가
- [ ] 하단 버튼 영역 레이아웃 변경 (1개 → 2개)
- [ ] 현재 여행지에 맞는 패키지 필터링 적용
- [ ] 패키지가 있을 때만 버튼 표시
- [ ] 모바일/PC 반응형 스타일링

### Phase 2-4: 플래너탭 버튼 추가
- [ ] `PlannerTab`에서 앱 전송 버튼 제거
- [ ] 패키지 버튼으로 교체
- [ ] 현재 여행지에 맞는 패키지 필터링 적용
- [ ] 조건부 렌더링 (패키지 없으면 버튼 숨김)

### Phase 2-5: 테스트 및 검증
- [ ] 다낭 → 베트남 패키지 노출 확인
- [ ] 파리 → 서유럽 패키지 노출 확인
- [ ] 홋카이도 → 일본 패키지 노출 확인
- [ ] 매핑 없는 여행지 → 폴백 로직 확인
- [ ] 모바일/PC 반응형 확인

---

## 7. 향후 확장 계획

### 7.1 트립링크 API 연동 (추후)
- 현재는 수동으로 iframe 링크를 수집하여 매핑
- 트립링크 API가 제공되면 자동 동기화 시스템 구축
- Supabase DB 테이블(`triplink_packages`) 생성하여 관리

### 7.2 어드민 패널 개발 (장기)
- 관리자가 직접 여행지-패키지 매핑을 추가/수정할 수 있는 UI
- 패키지 생명주기 관리 (시작일, 종료일)
- 노출 우선순위 설정

### 7.3 사용자 행동 분석
- GA4 이벤트: `package_button_click`, `package_modal_open`
- 어떤 여행지에서 패키지 클릭이 많은지 추적
- 전환율 분석 (클릭 → 외부 사이트 이동)

---

## 8. 주의사항 및 Best Practices

### 8.1 버튼 노출 원칙
- **맥락적 노출**: 해당 여행지에 실제 패키지가 있을 때만 버튼 표시
- **비침습적 디자인**: 기존 UI와 이질감 없는 색상/크기 유지
- **명확한 문구**: "패키지 상품 보기", "패키지로 간편하게 준비하기" 등

### 8.2 성능 최적화
- 패키지 필터링 로직은 메모이제이션 적용 (`useMemo`)
- 모달은 조건부 렌더링 (`selectedPackage && <TripLinkModal ... />`)
- 불필요한 리렌더링 방지

### 8.3 광고 표시 규정 준수
- 버튼에 "AD" 또는 "광고" 표시 (공정위 규정)
- 모달 상단에 "gateo x 트립링크 제휴 상품" 명시
- 사용자에게 패키지 상품임을 명확히 전달

---

## 9. 데이터 수집 가이드 (사용자 작업)

사용자가 트립링크에서 각 지역별 동적 배너 iframe 링크를 수집할 때 다음 형식으로 정리:

**수집 템플릿**:
```
여행지: [여행지명]
카테고리: [family/longhaul/resort]
adKey: [iframe URL의 adKey 부분]
대표 키워드: [Unsplash 검색용 영문 키워드]
제목: [패키지 제목]
설명: [패키지 한 줄 설명]
```

**예시**:
```
여행지: 제주도
카테고리: family
adKey: abc123
대표 키워드: Jeju Island
제목: 제주도 가족 패키지
설명: 한라산과 해변을 즐기는 힐링 여행
```

수집된 데이터를 `DESTINATION_PACKAGE_MAP`과 `PACKAGE_DETAILS`에 순차적으로 추가하면 됩니다.

---

## 10. 완료 기준 (Definition of Done)

- [ ] 위키탭과 플래너탭에 패키지 버튼이 정상적으로 표시됨
- [ ] 버튼 클릭 시 해당 여행지에 맞는 패키지 모달이 열림
- [ ] 모달에서 트립링크 iframe이 정상적으로 렌더링됨
- [ ] 매핑되지 않은 여행지는 폴백 로직으로 일반 패키지 노출
- [ ] 모바일/PC 모두 반응형으로 작동
- [ ] 로그 파일과 컨텍스트 파일 업데이트 완료
- [ ] 사용자 테스트 및 피드백 수집 완료
