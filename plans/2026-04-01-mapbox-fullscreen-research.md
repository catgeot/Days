# Mapbox GL JS Fullscreen 모바일 지원 조사

## 📚 Mapbox GL JS FullscreenControl 공식 문서

### 기본 사용법

```jsx
import mapboxgl from 'mapbox-gl';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [lng, lat],
    zoom: 12
});

// Fullscreen Control 추가
map.addControl(new mapboxgl.FullscreenControl());
```

**특징**:
- 브라우저 표준 Fullscreen API 사용
- 자동으로 지원 여부 감지
- 미지원 시 버튼 숨김 처리

**출처**: [Mapbox GL JS FullscreenControl API](https://docs.mapbox.com/mapbox-gl-js/api/markers/#fullscreencontrol)

---

## 🍎 iOS Safari Fullscreen API 제약

### 문제
- **iOS Safari는 Fullscreen API를 `<video>` 요소에만 지원**
- 일반 `<div>` 컨테이너는 fullscreen 불가
- 보안 정책상 제한 (사용자 혼란 방지)

### Apple 공식 입장
> "On iOS, fullscreen is only supported for `<video>` elements. Other elements will not enter fullscreen mode."

**출처**: [Apple Developer Forums](https://developer.apple.com/forums/thread/673344)

### MDN Web Docs
> "The Fullscreen API is not available on iOS Safari for elements other than `<video>`."

**출처**: [MDN Fullscreen API Browser Compatibility](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API#browser_compatibility)

---

## ✅ 현재 구현 분석

### `src/components/PlaceCard/common/PlaceMiniMap.jsx`

```jsx
// Fullscreen API 지원 여부 체크
useEffect(() => {
    const checkFullscreenSupport = () => {
        const isSupported =
            document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled;

        setSupportsFullscreen(isSupported);
    };
    checkFullscreenSupport();
}, []);

// 조건부 렌더링
{supportsFullscreen && (
    <button onClick={toggleFullscreen}>...</button>
)}
```

**문제점**:
- `document.fullscreenEnabled`는 API 존재 여부만 확인
- iOS Safari도 `true` 반환하지만 실제로는 `<div>`에서 작동 안 함
- 버튼이 표시되지만 클릭해도 아무 일도 일어나지 않음

---

## 🔧 권장 해결 방안

### 방안 A: Mapbox 내장 FullscreenControl 사용 (권장)

**장점**:
- Mapbox가 자체적으로 지원 여부 감지
- 크로스 브라우저 호환성 보장
- 유지보수 용이

**단점**:
- iOS Safari에서는 여전히 미지원 (버튼 자체가 안 보임)
- 커스텀 디자인 적용 제한

**구현**:
```jsx
import mapboxgl from 'mapbox-gl';

useEffect(() => {
    if (mapRef.current) {
        // 우측 상단에 fullscreen 버튼 추가
        mapRef.current.addControl(
            new mapboxgl.FullscreenControl(),
            'top-right'
        );
    }
}, []);
```

---

### 방안 B: iOS 전용 모달 기반 "가짜 Fullscreen" 구현

**장점**:
- iOS에서도 "확장된 지도" 경험 제공
- 디자인 완전 커스터마이징 가능

**단점**:
- 진짜 fullscreen이 아님 (주소창 여전히 표시)
- 추가 코드 복잡도

**구현**:
```jsx
const [isModalExpanded, setIsModalExpanded] = useState(false);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

const toggleFullscreen = async () => {
    if (isIOS) {
        // iOS: 모달 방식 확장
        setIsModalExpanded(true);
    } else {
        // 기타: 표준 Fullscreen API
        const elem = mapContainerRef.current;
        if (elem.requestFullscreen) {
            await elem.requestFullscreen();
        }
        // ... webkit, moz, ms 처리
    }
};

// 렌더링
{isModalExpanded && (
    <div className="fixed inset-0 z-[500] bg-black">
        <Map ...props />
        <button onClick={() => setIsModalExpanded(false)}>닫기</button>
    </div>
)}
```

---

### 방안 C: iOS에서는 버튼 숨김 (현재 권장)

**장점**:
- 가장 간단하고 명확
- 작동 안 하는 기능을 보여주지 않음
- 사용자 혼란 방지

**단점**:
- iOS 사용자는 fullscreen 기능 사용 불가

**구현**:
```jsx
const [supportsFullscreen, setSupportsFullscreen] = useState(false);

useEffect(() => {
    // iOS 감지
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // iOS가 아니고 Fullscreen API 지원하는 경우만
    const isSupported = !isIOS && (
        document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.mozFullScreenEnabled ||
        document.msFullscreenEnabled
    );
    
    setSupportsFullscreen(isSupported);
}, []);

{supportsFullscreen && (
    <button onClick={toggleFullscreen}>...</button>
)}
```

---

## 🎯 최종 권장 사항

### 단계별 접근

#### 1단계: iOS 명시적 제외 (즉시 적용 가능)
```jsx
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isSupported = !isIOS && document.fullscreenEnabled;
setSupportsFullscreen(isSupported);
```

**효과**:
- ✅ iOS에서 작동 안 하는 버튼 숨김
- ✅ Android/PC는 정상 작동
- ✅ 사용자 혼란 최소화

#### 2단계: Mapbox 내장 컨트롤 검토 (선택사항)
- 현재 커스텀 버튼 디자인과 Mapbox 기본 버튼 비교
- 디자인 중요도에 따라 유지 vs 교체 결정

#### 3단계: iOS 모달 방식 구현 (추후 고려)
- 사용자 요청 시 추가 개발
- "지도 확대하기" 같은 별도 버튼으로 제공

---

## 📊 비교표

| 방안 | iOS 지원 | 구현 난이도 | 진짜 Fullscreen | 디자인 자유도 |
|------|----------|-------------|-----------------|---------------|
| **A. Mapbox 내장** | ❌ (버튼 숨김) | ⭐ 쉬움 | ✅ | ⭐⭐ 제한적 |
| **B. iOS 모달** | ⚠️ (가짜) | ⭐⭐⭐ 어려움 | ❌ | ⭐⭐⭐⭐⭐ 완전 자유 |
| **C. iOS 제외** | ❌ (버튼 숨김) | ⭐ 쉬움 | ✅ | ⭐⭐⭐⭐⭐ 완전 자유 |

---

## 💡 결론

**즉시 적용할 수정**:
```jsx
// src/components/PlaceCard/common/PlaceMiniMap.jsx

useEffect(() => {
    const checkFullscreenSupport = () => {
        // iOS 명시적 제외
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        // Fullscreen API 지원 확인
        const hasFullscreenAPI =
            document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled;

        // iOS가 아니고 API 지원하는 경우만 true
        const isSupported = !isIOS && hasFullscreenAPI;
        
        setSupportsFullscreen(isSupported);

        if (import.meta.env.DEV) {
            console.log('[PlaceMiniMap] Fullscreen 지원:', {
                isIOS,
                hasFullscreenAPI,
                finalSupported: isSupported
            });
        }
    };

    checkFullscreenSupport();
}, []);
```

**효과**:
- ✅ iOS Safari: 버튼 숨김 (작동 안 하는 기능 제거)
- ✅ Android Chrome: 정상 작동 (표준 Fullscreen API)
- ✅ PC 브라우저: 정상 작동
- ✅ 사용자 혼란 방지 (안 되는 버튼 보여주지 않음)

---

## 🔗 참고 링크

- [Mapbox GL JS FullscreenControl API](https://docs.mapbox.com/mapbox-gl-js/api/markers/#fullscreencontrol)
- [MDN Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
- [Apple Developer Forums - Fullscreen on iOS](https://developer.apple.com/forums/thread/673344)
- [Can I Use: Fullscreen API](https://caniuse.com/fullscreen)
