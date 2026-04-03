# 2026-04-01 세션 5차 - 모바일 테스트 피드백 수정 계획

## 📋 발견된 문제

### 1. ❌ AI 버튼이 화면 하단에서 떠 있음
- **현재 상태**: `bottom-16` (64px 여백)
- **문제**: 모바일에는 공통 네비게이션 푸터가 없는데, 마치 푸터를 피하듯 떠 있음
- **원인**: 이전 수정에서 "하단 네비게이션과 겹치지 않도록"이라는 요구사항을 잘못 해석
- **실제 구조**: 
  - 모바일: AI 버튼 자체가 푸터 (하단에 완전히 붙어야 함)
  - PC: 좌측 PlaceWikiNavView 패널에 고정

### 2. ❌ AI 확장 후 버튼이 사라짐 (닫을 방법 없음)
- **현재 코드**: `{!isAiExpanded && <div>AI 버튼</div>}`
- **문제**: AI 로컬 왓슨이 열리면 버튼이 완전히 사라져서 다시 닫을 수 없음
- **필요한 동작**: 
  - 버튼 항상 표시
  - 토글 기능: 열기 ↔ 닫기
  - 레이블 변경: "AI 정보 묻기" ↔ "로컬 왓슨 닫기"

### 3. ❌ 맵박스 풀스크린 버튼이 모바일에서 작동 안 함
- **현재 구현**: 브라우저 Fullscreen API 직접 사용
- **문제**: iOS Safari 등 일부 모바일 브라우저에서 미지원
- **조사 필요**: Mapbox GL JS 자체 fullscreen control 사용 가능 여부

---

## 🔧 해결 방안

### 방안 1: AI 버튼 푸터 위치 수정

**파일**: `src/components/PlaceCard/views/PlaceWikiDetailsView.jsx`

**변경 전** (라인 556):
```jsx
<div className="fixed md:static bottom-16 left-0 right-0 p-4 md:p-0 md:mt-10 z-[160] 
     bg-[#05070a]/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none 
     border-t border-white/10 md:border-none">
```

**변경 후**:
```jsx
<div className="fixed md:static bottom-0 left-0 right-0 p-4 md:p-0 md:mt-10 z-[160] 
     bg-[#05070a]/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none 
     border-t border-white/10 md:border-none">
```

**변경 사항**: `bottom-16` → `bottom-0`

**효과**:
- ✅ 모바일에서 AI 버튼이 화면 최하단에 딱 붙음
- ✅ 진짜 푸터처럼 동작 (떠 있지 않음)
- ✅ PC는 영향 없음 (md:static으로 본문 내부 유지)

---

### 방안 2: AI 토글 기능 구현

**파일**: `src/components/PlaceCard/views/PlaceWikiDetailsView.jsx`

#### 2-1. 조건부 렌더링 제거

**변경 전** (라인 555):
```jsx
{!isAiExpanded && (
    <div className="fixed md:static bottom-0 ...">
        <button onClick={handleRequestAiInfo}>
            AI에게 안전 로컬 정보 묻기
        </button>
    </div>
)}
```

**변경 후**:
```jsx
<div className="fixed md:static bottom-0 left-0 right-0 p-4 md:p-0 md:mt-10 z-[160] 
     bg-[#05070a]/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none 
     border-t border-white/10 md:border-none">
    <button 
        onClick={() => {
            if (isAiExpanded) {
                setIsAiExpanded(false);
            } else {
                handleRequestAiInfo(placeName || wikiData?.title);
            }
        }}
        className="w-full group flex items-center justify-center gap-3 px-6 py-4 
                   bg-gradient-to-r from-blue-600/30 to-purple-600/30 
                   hover:from-blue-600/40 hover:to-purple-600/40 
                   rounded-2xl transition-all duration-300 shadow-2xl 
                   border border-blue-500/30 hover:border-blue-400/50 
                   backdrop-blur-md min-h-[56px]"
    >
        <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
        <span className="text-base font-bold text-white tracking-wide">
            {isAiExpanded ? '로컬 왓슨 닫기' : 'AI에게 안전 로컬 정보 묻기'}
        </span>
        {isAiExpanded && <ChevronDown size={20} />}
    </button>
</div>
```

#### 2-2. AI 섹션 닫을 때 스크롤 처리

**추가 로직**:
```jsx
const handleToggleAi = () => {
    if (isAiExpanded) {
        // 닫을 때: AI 섹션 위로 스크롤 후 닫기
        setIsAiExpanded(false);
        setLocalAiResponse(null); // 선택사항: 데이터도 초기화
        
        // 부드럽게 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // 열 때: 기존 handleRequestAiInfo 호출
        handleRequestAiInfo(placeName || wikiData?.title);
    }
};
```

**효과**:
- ✅ 버튼 항상 표시 (푸터 역할 유지)
- ✅ 토글로 AI 섹션 열기/닫기 가능
- ✅ 사용자에게 명확한 피드백 (레이블 변경)
- ✅ 닫을 때 깔끔하게 상단으로 스크롤

---

### 방안 3: 맵박스 풀스크린 모바일 지원 조사

#### 조사 항목:
1. **Mapbox GL JS NavigationControl fullscreen 옵션**
   - 공식 문서: https://docs.mapbox.com/mapbox-gl-js/api/markers/#navigationcontrol
   - `new mapboxgl.NavigationControl({ showCompass: false })` 에 fullscreen 옵션 확인

2. **iOS Safari Fullscreen API 제약**
   - iOS는 `<video>` 요소에만 fullscreen API 지원
   - 일반 `<div>`는 fullscreen 불가능 (보안 정책)
   - 대안: 모달/오버레이 방식의 "가짜 풀스크린" 구현

3. **Mapbox 공식 예제**
   - Fullscreen control example 코드 확인
   - 모바일 대응 방법 조사

#### 예상 해결 방안:

**A안: Mapbox 내장 컨트롤 사용**
```jsx
useEffect(() => {
    if (mapRef.current) {
        // Fullscreen control 추가
        mapRef.current.addControl(
            new mapboxgl.FullscreenControl(),
            'top-right'
        );
    }
}, []);
```

**B안: iOS 전용 "확장 모드" 구현**
```jsx
// iOS 감지
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

// iOS: 모달 방식 fullscreen
// Android/Desktop: 표준 Fullscreen API
const toggleFullscreen = () => {
    if (isIOS) {
        // 모달 오버레이로 지도 확장
        setIsModalFullscreen(true);
    } else {
        // 기존 Fullscreen API
        document.requestFullscreen();
    }
};
```

**효과**:
- ✅ 크로스 플랫폼 풀스크린 지원
- ✅ iOS에서도 "확장된" 지도 경험 제공
- ✅ Mapbox 공식 방법 사용 시 유지보수 용이

---

## 📊 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/PlaceCard/views/PlaceWikiDetailsView.jsx` | 1. AI 버튼 bottom-16→bottom-0<br>2. 조건부 렌더링 제거<br>3. 토글 기능 구현 |
| `src/components/PlaceCard/common/PlaceMiniMap.jsx` | iOS 명시적 제외 (fullscreen 버튼 숨김) |

---

## 🎯 예상 효과

### AI 버튼 (위키 탭 푸터)
- ✅ **모바일**: 화면 최하단에 완전히 붙음 (진짜 푸터)
- ✅ **PC**: 영향 없음 (좌측 패널 + 본문 내부)
- ✅ **UX**: 항상 접근 가능, 열기/닫기 자유로움
- ✅ **일관성**: 버튼이 사라지지 않아 혼란 방지

### 맵박스 풀스크린
- ✅ **iOS Safari**: 버튼 숨김 (Fullscreen API 미지원)
- ✅ **Android/PC**: 정상 작동 (표준 API 사용)
- ✅ **명확한 UX**: 안 되는 기능은 보여주지 않음

---

## 🚨 사용자 확인 필수 항목 (`.ai-context.md` 규칙 준수)

수정 후 **반드시** 사용자가 직접 테스트해야 할 항목:

### 1. 모바일 AI 버튼 (위키 탭)
- [ ] 화면 **최하단에 완전히 붙어** 있는가? (띄워져 있지 않은가?)
- [ ] 클릭 시 AI 로컬 왓슨 섹션이 열리는가?
- [ ] AI 열린 상태에서 버튼이 **계속 표시**되는가?
- [ ] 버튼 레이블이 **"로컬 왓슨 닫기"**로 변경되는가?
- [ ] "닫기" 클릭 시 AI 섹션이 사라지고 상단으로 스크롤되는가?

### 2. 맵박스 풀스크린
- [ ] **iOS Safari**: 풀스크린 버튼이 **표시되지 않는가?** (의도된 동작)
- [ ] **Android Chrome**: 버튼이 표시되고 클릭 시 전체화면 진입되는가?
- [ ] **PC 브라우저**: 정상 작동하는가?

### 3. 전체 UX
- [ ] 스크롤 동작이 자연스러운가?
- [ ] AI 버튼이 본문과 겹치지 않는가?
- [ ] 라이트박스 등 다른 기능과 충돌 없는가?
- [ ] 콘솔에 에러가 없는가?

**⚠️ 중요**: AI가 임의로 "완료"라고 선언하지 않습니다. 위 항목을 모두 테스트하신 후 명시적으로 확인해주세요.

---

## 📌 다음 단계 및 현재 상태

- [x] 모바일 테스트 피드백 분석 완료
- [x] 해결 방안 설계 및 문서화
- [x] 맵박스 공식 문서 조사 완료
- [ ] **👉 사용자 승인 대기** (이 계획 검토)
- [ ] Code 모드 전환 (실제 코드 수정)
- [ ] 사용자 테스트 대기 (모바일 실기기 확인)
- [ ] 로그 업데이트 및 커밋

---

## 🔗 참고 자료

- 상세 조사: [`plans/2026-04-01-mapbox-fullscreen-research.md`](plans/2026-04-01-mapbox-fullscreen-research.md)
- [Mapbox GL JS FullscreenControl API](https://docs.mapbox.com/mapbox-gl-js/api/markers/#fullscreencontrol)
- [MDN Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
- [Apple Developer Forums - Fullscreen on iOS](https://developer.apple.com/forums/thread/673344)
- [Can I Use: Fullscreen API](https://caniuse.com/fullscreen)

---

## 📝 수정 요약

### 3가지 문제 → 3가지 해결책

| 문제 | 현재 상태 | 수정 방향 | 효과 |
|------|----------|----------|------|
| AI 버튼 띄워짐 | `bottom-16` | `bottom-0` | 진짜 푸터처럼 최하단 붙음 |
| AI 확장 시 버튼 사라짐 | `{!isAiExpanded && ...}` | 항상 표시, 토글 | 열기/닫기 자유로움 |
| iOS 풀스크린 미작동 | API 존재만 확인 | iOS 명시적 제외 | 안 되는 버튼 숨김 |

**모든 수정은 모바일 UX 개선에 집중**되어 있으며, PC 환경에는 영향을 주지 않습니다.
