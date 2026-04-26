# 트립링크 모바일 모달 버그 분석 및 해결 방안

**작성일**: 2026-04-20  
**우선순위**: 🔥 High (Phase 2 구현 전 필수 수정)

---

## 1. 버그 현상

### 사용자 보고 내용
> "모바일에서 트립링크 모달을 열면, 사진은 줄로 보이고, 텍스트는 정상으로 보임  
> 이후 모달을 닫고 재진입 하면 내용이 정상적으로 뜸"

### 재현 시나리오
1. **첫 진입**: 홈 탐색창 → 에디터스 픽 → 트립링크 패키지 카드 클릭
2. **증상**: 모달이 열리면 카드의 배경 사진이 표시되지 않거나 줄로 보임 (레이아웃 깨짐)
3. **재진입**: 모달 닫고 → 다시 같은 카드 클릭
4. **결과**: 사진이 정상적으로 로드됨

---

## 2. 원인 분석

### 2.1 핵심 문제: 비동기 이미지 로딩과 IntersectionObserver 딜레이

#### 관련 파일: `TripLinkSectionCard.jsx`

```javascript
// 문제가 되는 코드
const TripLinkSectionCard = ({ pkg, onClick }) => {
  const [inView, setInView] = useState(false);
  
  // usePlaceGallery는 비동기로 이미지를 로드
  const { images, isImgLoading } = usePlaceGallery(dummySpot);
  const bgImgUrl = images && images.length > 0 ? (images[0].urls?.regular || images[0].url) : null;

  useEffect(() => {
    let timeoutId;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 🚨 문제: 500ms 딜레이
          timeoutId = setTimeout(() => {
            setInView(true);
            observer.disconnect();
          }, 500);
        }
      },
      { rootMargin: '200px' }
    );
    // ...
  }, []);

  return (
    <div>
      {/* 🚨 문제: inView가 true일 때만 이미지 렌더링 */}
      {inView && bgImgUrl ? (
        <img src={bgImgUrl} alt={pkg.title} loading="lazy" />
      ) : (
        <div className="bg-gradient-to-br from-sky-400 via-sky-200/80 to-[#d4a373]">
          {/* 그라디언트 배경만 보임 */}
        </div>
      )}
    </div>
  );
};
```

### 2.2 문제 발생 시퀀스

```
첫 진입 시:
1. 카드 컴포넌트 마운트
2. IntersectionObserver 등록
3. 카드가 뷰포트에 진입 감지
4. 500ms 딜레이 시작
5. usePlaceGallery가 비동기로 이미지 요청 (Unsplash API)
6. ⏱️ 500ms 후 inView = true
7. 🚨 하지만 아직 images 배열이 비어있음 (API 응답 대기 중)
8. bgImgUrl = null → 그라디언트 배경만 표시
9. ⏱️ 1-2초 후 API 응답 도착
10. 🚨 하지만 이미 inView 조건부 렌더링이 끝나서 리렌더링이 안됨

재진입 시:
1. 카드 컴포넌트 마운트
2. usePlaceGallery가 sessionStorage 캐시에서 즉시 이미지 로드
3. IntersectionObserver 500ms 딜레이 시작
4. ✅ 500ms 이내에 이미 images 배열이 채워져 있음
5. 500ms 후 inView = true
6. ✅ bgImgUrl에 값이 있어서 이미지 정상 렌더링
```

### 2.3 부가 요인

1. **모바일 네트워크 속도**: WiFi보다 느린 4G/5G에서 API 응답이 더 지연됨
2. **React 렌더링 타이밍**: `inView` 상태가 변경되어도 `images`가 아직 비어있으면 조건부 렌더링이 실패
3. **usePlaceGallery 캐싱 로직**: 첫 로드 시 캐시가 없으면 네트워크 요청이 필수

---

## 3. 해결 방안

### 방안 A: IntersectionObserver 딜레이 제거 (권장 ⭐)

**장점**:
- 간단하고 직관적
- 카드가 즉시 이미지 로드를 시작
- 재진입 시와 동일한 UX 제공

**단점**:
- 횡스크롤 영역에 많은 카드가 있으면 초기 로딩 부담 증가 (현재는 카드 10개 미만이므로 문제없음)

**구현**:
```javascript
// TripLinkSectionCard.jsx
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        // 딜레이 제거: 즉시 setInView
        setInView(true);
        observer.disconnect();
      }
    },
    { rootMargin: '200px' }
  );
  // ...
}, []);
```

### 방안 B: 초기 상태를 `inView = true`로 설정

**장점**:
- IntersectionObserver 로직을 완전히 제거 가능
- 모든 카드가 즉시 로딩

**단점**:
- Lazy loading 최적화 효과 상실
- 메모리 및 네트워크 부담 증가

**구현**:
```javascript
const TripLinkSectionCard = ({ pkg, onClick }) => {
  const [inView, setInView] = useState(true); // 기본값을 true로 변경
  // IntersectionObserver useEffect 제거
  // ...
};
```

### 방안 C: 이미지 로딩 완료 전까지 스켈레톤 UI 표시

**장점**:
- 사용자에게 로딩 상태를 명확히 전달
- 레이아웃 깨짐 방지

**단점**:
- 근본적인 해결책이 아님
- 여전히 첫 로드가 느림

**구현**:
```javascript
{inView && (
  bgImgUrl ? (
    <img src={bgImgUrl} alt={pkg.title} loading="lazy" />
  ) : (
    <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-sky-200/80 to-[#d4a373] flex items-center justify-center">
      {isImgLoading && (
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
      )}
    </div>
  )
)}
```

---

## 4. 권장 해결책

### 🎯 방안 A + 방안 C 조합 (최적화된 접근)

1. **IntersectionObserver 딜레이를 제거**하여 카드가 뷰포트에 진입하자마자 이미지 로딩 시작
2. **이미지 로딩 중 스피너 표시**하여 사용자 피드백 개선
3. **이미지 로드 실패 시 그라디언트 배경 유지**

### 수정할 파일

**파일**: `src/pages/Home/components/SearchDiscovery/TripLinkSectionCard.jsx`

**변경 사항**:
```javascript
// Before (Line 24-27)
timeoutId = setTimeout(() => {
  setInView(true);
  observer.disconnect();
}, 500);

// After (딜레이 제거)
setInView(true);
observer.disconnect();
```

---

## 5. 추가 최적화 고려사항

### 5.1 이미지 프리로드 전략

**홈 탐색창이 열릴 때 주요 패키지 이미지를 미리 로드**:

```javascript
// SearchDiscoveryModal.jsx
useEffect(() => {
  if (isOpen) {
    // 주요 패키지의 targetKeyword로 이미지 프리로드
    const preloadKeywords = ['Da Nang', 'Paris', 'Hokkaido', 'Guam'];
    preloadKeywords.forEach(keyword => {
      // usePlaceGallery 훅을 호출하여 캐시에 저장
      // 실제 구현은 복잡할 수 있으므로 Phase 3 고려
    });
  }
}, [isOpen]);
```

### 5.2 sessionStorage 캐시 정책 개선

**현재**: `usePlaceGallery`가 24시간 TTL로 캐싱  
**개선**: 트립링크 패키지 이미지는 TTL을 7일로 연장 (변동이 적으므로)

---

## 6. 테스트 계획

### 6.1 수동 테스트

1. **모바일 디바이스** (실제 기기 또는 Chrome DevTools 모바일 에뮬레이션)
2. **네트워크 쓰로틀링**: Slow 3G, Fast 3G, 4G
3. **캐시 비우기**: 시크릿 모드 또는 캐시 삭제 후 테스트
4. **시나리오**:
   - 홈 탐색창 열기 → 트립링크 카드 클릭 (첫 진입)
   - 모달 닫기 → 다시 카드 클릭 (재진입)
   - 다른 카테고리의 트립링크 카드 클릭

### 6.2 검증 기준

- ✅ 첫 진입 시 2초 이내에 이미지가 표시됨
- ✅ 이미지 로딩 중 스피너가 표시됨
- ✅ 재진입 시 즉시 이미지가 표시됨 (캐시)
- ✅ 모바일에서 레이아웃 깨짐 없음

---

## 7. 다음 단계

1. **즉시 수정**: IntersectionObserver 딜레이 제거 (방안 A)
2. **Phase 2 진행**: 버그 수정 후 PlaceCard 통합 작업 착수
3. **향후 개선**: 이미지 프리로드 및 캐싱 전략 고도화 (Phase 3)

---

## 8. 관련 이슈

- Phase 1에서 동일한 패턴을 사용한 `SpotThumbnailCard`도 같은 문제가 있을 수 있음
- 모든 IntersectionObserver 기반 lazy loading 로직 검토 필요
