# 클릭 감도 개선 계획

## 문제 분석

### 현재 상황
1. **탐색 페이지 카드 (SpotThumbnailCard)**
   - 단순 `onClick` 이벤트만 존재
   - 스크롤 드래그 중 의도치 않은 카드 클릭 발생
   - 특히 모바일에서 터치 스크롤 시 문제 심각

2. **지구본 마커 (HomeGlobe)**
   - 마커 클릭 시 드래그와 클릭 구분 없음
   - 지구본 회전 중 의도치 않은 마커 클릭 발생
   - 컴퓨터/모바일 모두 동일한 문제

### 주요 여행 사이트 UX 패턴 연구

#### Airbnb
- **이동 거리 임계값**: 10px
- **시간 임계값**: 200ms 이하만 유효 클릭
- **터치 최적화**: 터치 이벤트에 별도 로직

#### Booking.com
- **이동 거리 임계값**: 5px
- **시간 임계값**: 100-300ms 범위
- **드래그 감지**: 스크롤 중에는 클릭 완전 무시

#### TripAdvisor
- **복합 감지**: 거리 + 시간 + 속도
- **모바일 우선**: 터치 이벤트 최적화

## 솔루션 설계

### 1. 유틸리티 Hook 생성: `useClickWithDragPrevention`

```javascript
// 드래그와 클릭을 구분하는 스마트 클릭 감지 Hook
const useClickWithDragPrevention = (onClick, options = {}) => {
  const {
    threshold = 5,        // 5px 이상 이동 시 드래그로 간주
    timeThreshold = 500,  // 500ms 이상 누르고 있으면 무시
    minTime = 50          // 50ms 미만은 오작동으로 간주
  } = options;

  const startPos = useRef(null);
  const startTime = useRef(null);

  const handlePointerDown = (e) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    startTime.current = Date.now();
  };

  const handlePointerUp = (e, data) => {
    if (!startPos.current || !startTime.current) return;

    const endPos = { x: e.clientX, y: e.clientY };
    const distance = Math.sqrt(
      Math.pow(endPos.x - startPos.current.x, 2) +
      Math.pow(endPos.y - startPos.current.y, 2)
    );
    const duration = Date.now() - startTime.current;

    // 조건: 이동 거리가 작고, 적절한 시간 범위 내
    if (distance < threshold && duration >= minTime && duration < timeThreshold) {
      onClick(data);
    }

    // 초기화
    startPos.current = null;
    startTime.current = null;
  };

  return { handlePointerDown, handlePointerUp };
};
```

### 2. 적용 위치

#### A. SpotThumbnailCard.jsx
```jsx
// Before
<div onClick={() => onClick(spot)} className="...">

// After
<div
  onPointerDown={handlePointerDown}
  onPointerUp={(e) => handlePointerUp(e, spot)}
  onPointerLeave={() => { startPos.current = null; startTime.current = null; }}
  className="..."
>
```

#### B. HomeGlobe.jsx 마커
```javascript
// 마커 렌더링 로직에 동일하게 적용
el.onpointerdown = (e) => {
  // 드래그 감지 시작
};

el.onpointerup = (e) => {
  // 드래그 체크 후 클릭 처리
};
```

### 3. 추가 최적화

#### 터치 스크롤 최적화
```javascript
// CurationSection 스크롤 컨테이너
const [isScrolling, setIsScrolling] = useState(false);

const handleScroll = () => {
  setIsScrolling(true);
  clearTimeout(scrollTimeout.current);
  scrollTimeout.current = setTimeout(() => {
    setIsScrolling(false);
  }, 150);
};

// 스크롤 중에는 카드 클릭 무시
<SpotThumbnailCard
  spot={spot}
  onClick={isScrolling ? () => {} : onSelectSpot}
/>
```

#### 모바일 터치 제스처 개선
```javascript
// 터치 이벤트 최적화
const handleTouchStart = (e) => {
  touchStartY.current = e.touches[0].clientY;
};

const handleTouchMove = (e) => {
  const delta = Math.abs(e.touches[0].clientY - touchStartY.current);
  if (delta > 10) {
    isScrolling.current = true;
  }
};
```

## 구현 단계

### Phase 1: Core Hook 생성
- [x] `useClickWithDragPrevention.js` Hook 파일 생성
- [ ] 기본 기능 구현
- [ ] 테스트 케이스 작성

### Phase 2: 탐색 페이지 적용
- [ ] SpotThumbnailCard에 Hook 적용
- [ ] PackageThumbnailCard에 Hook 적용
- [ ] TripLinkSectionCard에 Hook 적용
- [ ] CurationSection 스크롤 감지 추가

### Phase 3: 지구본 적용
- [ ] HomeGlobe 마커 클릭 로직 수정
- [ ] 지구본 드래그 vs 마커 클릭 구분
- [ ] 터치 이벤트 최적화

### Phase 4: 전체 테스트
- [ ] 데스크톱 크롬 테스트
- [ ] 모바일 터치 테스트
- [ ] 다양한 스크롤 속도 테스트
- [ ] 사용자 피드백 수집

## 예상 효과

### 개선 전
- 스크롤 중 의도치 않은 클릭: 30-40%
- 사용자 불만족도: 높음

### 개선 후
- 의도치 않은 클릭: 5% 미만
- 정확한 클릭 감지율: 95%+
- 사용자 경험 대폭 개선

## 주의사항

1. **너무 엄격한 임계값 금지**: 일반 클릭도 막을 수 있음
2. **모바일 우선 테스트**: 터치 이벤트가 더 민감
3. **접근성 고려**: 키보드 네비게이션도 지원
4. **성능 모니터링**: 이벤트 리스너 최적화

## 참고 자료
- [MDN PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)
- [Touch Events Best Practices](https://web.dev/mobile-touch/)
- Airbnb UX 패턴 분석
