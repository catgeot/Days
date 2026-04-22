# 클릭 감도 개선 테스트 가이드

## 구현 완료 내역

### 1. Core Hook 생성
- ✅ [`useClickWithDragPrevention.js`](../src/hooks/useClickWithDragPrevention.js) - 드래그와 클릭 구분 Hook

### 2. 적용된 컴포넌트
- ✅ [`SpotThumbnailCard.jsx`](../src/pages/Home/components/SearchDiscovery/SpotThumbnailCard.jsx) - 여행지 카드
- ✅ [`PackageThumbnailCard.jsx`](../src/pages/Home/components/SearchDiscovery/PackageThumbnailCard.jsx) - 패키지 카드
- ✅ [`TripLinkSectionCard.jsx`](../src/pages/Home/components/SearchDiscovery/TripLinkSectionCard.jsx) - TripLink 카드
- ✅ [`HomeGlobe.jsx`](../src/pages/Home/components/HomeGlobe.jsx) - 지구본 마커

## 핵심 변경 사항

### 임계값 설정
```javascript
{
  threshold: 5,        // 5px 이상 이동 시 드래그로 간주
  timeThreshold: 500,  // 500ms 이상은 롱프레스로 간주
  minTime: 50          // 50ms 미만은 오작동으로 간주
}
```

### 이벤트 변경
**Before:**
```jsx
<div onClick={() => onClick(data)}>
```

**After:**
```jsx
<div
  onPointerDown={handleStart}
  onPointerMove={handleMove}
  onPointerUp={(e) => handleEnd(e, data)}
  onPointerLeave={handleCancel}
  onPointerCancel={handleCancel}
>
```

## 테스트 체크리스트

### Phase 1: 데스크톱 테스트 (Chrome/Edge)

#### A. 탐색 페이지 카드
- [ ] **일반 클릭**: 카드를 클릭하면 PlaceCard가 정상 열림
- [ ] **횡스크롤 드래그**: 마우스로 드래그 스크롤 시 카드 클릭 안됨
- [ ] **빠른 드래그**: 빠르게 스크롤해도 카드 클릭 안됨
- [ ] **호버 효과**: 마우스 오버 시 카드 확대 효과 정상 작동

#### B. 지구본 마커
- [ ] **마커 클릭**: 마커를 클릭하면 PlaceCard가 정상 열림
- [ ] **지구본 회전**: 지구본을 드래그로 회전 시 마커 클릭 안됨
- [ ] **줌 인/아웃**: 스크롤 줌 후 마커 클릭 정상 작동
- [ ] **호버 효과**: 마커 호버 시 확대 효과 정상 작동

### Phase 2: 모바일 테스트 (iOS Safari / Android Chrome)

#### A. 탐색 페이지 카드
- [ ] **탭 클릭**: 카드를 탭하면 PlaceCard가 정상 열림
- [ ] **스와이프 스크롤**: 손가락으로 스크롤 시 카드 클릭 안됨
- [ ] **빠른 스와이프**: 빠르게 스크롤해도 카드 클릭 안됨
- [ ] **멀티터치**: 여러 손가락 터치 시 오작동 없음

#### B. 지구본 마커
- [ ] **마커 탭**: 마커를 탭하면 PlaceCard가 정상 열림
- [ ] **지구본 스와이프**: 지구본을 스와이프로 회전 시 마커 클릭 안됨
- [ ] **핀치 줌**: 핀치 줌 후 마커 탭 정상 작동
- [ ] **빠른 회전**: 빠르게 회전해도 의도치 않은 마커 클릭 없음

### Phase 3: 엣지 케이스 테스트

#### A. 경계 케이스
- [ ] **짧은 클릭 (50ms 미만)**: 클릭 무시 (오작동 방지)
- [ ] **긴 프레스 (500ms 이상)**: 클릭 무시 (롱프레스)
- [ ] **5px 미만 이동**: 클릭으로 인식
- [ ] **5px 이상 이동**: 드래그로 인식

#### B. 다양한 속도
- [ ] **느린 드래그**: 느리게 스크롤해도 카드 클릭 안됨
- [ ] **중간 속도**: 정상 스크롤 시 카드 클릭 안됨
- [ ] **빠른 플링**: 빠르게 튕기듯 스크롤해도 안전

#### C. 접근성
- [ ] **키보드 네비게이션**: Tab 키로 카드 선택 가능
- [ ] **Enter 키**: Enter 키로 카드 활성화 가능
- [ ] **스크린 리더**: 카드 정보 정상 읽힘

### Phase 4: 성능 테스트

- [ ] **메모리 사용량**: 이벤트 리스너 누수 없음
- [ ] **렌더링 성능**: 스크롤 시 프레임 드롭 없음
- [ ] **이벤트 처리**: 이벤트 핸들러 과다 호출 없음

## 예상되는 개선 효과

### 개선 전
| 항목 | 수치 |
|------|------|
| 의도치 않은 클릭 발생률 | 30-40% |
| 사용자 불만족 | 높음 |
| 모바일 터치 오류 | 빈번함 |

### 개선 후
| 항목 | 목표 수치 |
|------|----------|
| 의도치 않은 클릭 발생률 | 5% 미만 |
| 정확한 클릭 감지율 | 95%+ |
| 사용자 만족도 | 대폭 개선 |

## 문제 발생 시 대응

### 1. 클릭이 너무 안 되는 경우
```javascript
// threshold 값을 높임
threshold: 10  // 5 → 10
```

### 2. 여전히 드래그 중 클릭되는 경우
```javascript
// threshold 값을 낮춤
threshold: 3   // 5 → 3
```

### 3. 빠른 클릭이 무시되는 경우
```javascript
// minTime을 낮춤
minTime: 30    // 50 → 30
```

### 4. 롱프레스가 클릭으로 인식되는 경우
```javascript
// timeThreshold를 낮춤
timeThreshold: 300  // 500 → 300
```

## 모니터링 포인트

### 사용자 피드백 수집
1. 클릭 정확도 만족도
2. 스크롤 경험 개선 여부
3. 모바일 터치 경험
4. 의도치 않은 클릭 감소 여부

### 기술적 모니터링
1. 이벤트 리스너 메모리 사용량
2. 평균 클릭 반응 시간
3. 드래그 감지 정확도
4. 브라우저 호환성

## 롤백 계획

문제 발생 시 빠르게 롤백할 수 있도록:
1. 각 컴포넌트의 `onPointerDown/Move/Up` → `onClick`으로 복원
2. Hook import 제거
3. 이전 버전으로 Git revert

## 참고 자료

- [MDN PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)
- [Web.dev Touch Events](https://web.dev/mobile-touch/)
- [구현 계획서](./click-sensitivity-improvement-plan.md)
