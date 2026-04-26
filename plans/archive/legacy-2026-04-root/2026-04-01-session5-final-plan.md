# 2026-04-01 세션 5차 - 최종 수정 계획 (간소화)

## 💡 핵심 아이디어

**모바일 지도 크기를 크게 만들면 fullscreen 버튼이 필요 없다!**

---

## 🎯 최종 해결 방안 (3가지 수정)

### 1. ✅ AI 버튼 푸터 위치 수정

**파일**: `src/components/PlaceCard/views/PlaceWikiDetailsView.jsx:556`

```jsx
// 변경 전
<div className="fixed md:static bottom-16 left-0 right-0 ...">

// 변경 후
<div className="fixed md:static bottom-0 left-0 right-0 ...">
```

**효과**: 모바일에서 화면 최하단에 완전히 붙음

---

### 2. ✅ AI 토글 기능 구현 (버튼 항상 표시)

**파일**: `src/components/PlaceCard/views/PlaceWikiDetailsView.jsx:555`

```jsx
// 변경 전: 조건부 렌더링 (AI 열리면 버튼 사라짐)
{!isAiExpanded && (
    <div>
        <button onClick={handleRequestAiInfo}>
            AI에게 안전 로컬 정보 묻기
        </button>
    </div>
)}

// 변경 후: 항상 표시, 토글 기능
<div className="fixed md:static bottom-0 left-0 right-0 p-4 md:p-0 md:mt-10 z-[160] 
     bg-[#05070a]/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none 
     border-t border-white/10 md:border-none">
    <button 
        onClick={() => {
            if (isAiExpanded) {
                setIsAiExpanded(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
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

**효과**:
- 버튼 항상 표시 (푸터 역할 유지)
- AI 열기/닫기 토글
- 닫을 때 상단으로 부드럽게 스크롤

---

### 3. ✅ 모바일 지도 크기 확대 (fullscreen 버튼 완전 제거)

**파일**: `src/components/PlaceCard/common/PlaceMiniMap.jsx:131`

#### 변경 전 (현재)
```jsx
className={`w-full h-64 md:h-96 rounded-2xl ...`}
```
- 모바일: h-64 (256px)
- PC: h-96 (384px)
- fullscreen 버튼 있음 (iOS에서 작동 안 함)

#### 변경 후 (제안) ⚠️ 스크롤 충돌 주의
```jsx
className={`w-full h-96 md:h-[500px] rounded-2xl ...`}
```
- **모바일: h-96 (384px)** - 현재 256px에서 50% 증가
- **PC: 500px**
- **fullscreen 버튼 완전 제거**

**⚠️ 중요**: 모바일에서 지도가 너무 크면 터치 스크롤 문제 발생!
- 지도 터치 시 페이지 스크롤이 막힘
- 사용자가 지도 영역에 갇힐 수 있음
- **적절한 크기 유지 필요**: 화면의 50-60% 정도가 적당

#### 추가 변경 1: fullscreen 관련 코드 모두 삭제

**제거할 코드**:
1. 상태 변수
```jsx
const [isFullscreen, setIsFullscreen] = useState(false);
const [supportsFullscreen, setSupportsFullscreen] = useState(false);
```

2. Fullscreen 감지 로직
```jsx
useEffect(() => {
    const checkFullscreenSupport = () => { ... };
    checkFullscreenSupport();
}, []);
```

3. Fullscreen 토글 함수
```jsx
const toggleFullscreen = async () => { ... };
```

4. Fullscreen 상태 감지
```jsx
useEffect(() => {
    const handleFullscreenChange = () => { ... };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
}, []);
```

5. Fullscreen 버튼
```jsx
{supportsFullscreen && (
    <button onClick={toggleFullscreen}>
        <Maximize2 size={20} />
    </button>
)}
```

#### 추가 변경 2: 모바일 터치 스크롤 최적화

**문제**: 지도가 크면 터치 시 페이지 스크롤이 막힘

**해결**: Mapbox 터치 동작 설정

```jsx
<Map
    ref={mapRef}
    // 세로 스크롤 허용 (지도 위에서도 스크롤 가능)
    touchAction="pan-y"
    // 드래그 팬 임계값 높이기 (약간 드래그해야 지도 이동)
    dragPan={{
        linearity: 0.3,
        easing: (t) => t,
        deceleration: 2400,
        maxSpeed: 1400
    }}
    // 모바일에서 스크롤 줌 비활성화
    scrollZoom={false}
    // 더블탭 줌은 허용
    doubleClickZoom={true}
    // 터치 줌은 허용 (두 손가락)
    touchZoomRotate={true}
    ...
/>
```

**효과**:
- ✅ 지도 위에서도 세로 스크롤 가능
- ✅ 의도치 않은 지도 이동 방지
- ✅ 필요 시 두 손가락으로 줌/회전 가능

---

**종합 효과**:
- ✅ 모바일에서 지도가 충분히 크게 보임 (384px, +50%)
- ✅ 터치 스크롤 문제 해결 (`touchAction: pan-y`)
- ✅ iOS fullscreen 문제 자체가 사라짐
- ✅ 코드 간소화 (~100줄 감소)
- ✅ 유지보수 용이

---

## 📊 지도 크기 비교

| 디바이스 | 현재 크기 | 제안 크기 | 증가율 | 화면 비율 |
|----------|-----------|-----------|--------|----------|
| **모바일** | 256px (h-64) | **384px (h-96)** | **+50%** | ~58% |
| **PC** | 384px (h-96) | **500px** | **+30%** | - |

### 모바일 화면 (375px × 667px 기준, iPhone SE)

- 현재: 지도가 화면의 **38%**
- 제안: 지도가 화면의 **58%** ⬆️ (+20%p)

**적절한 크기!**
- ✅ 충분히 크게 보임
- ✅ 스크롤 여유 공간 확보 (화면의 42%)
- ✅ fullscreen 버튼 불필요

---

## 🎨 대안: 다양한 크기 옵션

### 옵션 A: Tailwind 클래스 (권장) ⭐
```jsx
className="w-full h-96 md:h-[500px]"
```
- 모바일: h-96 (384px)
- PC: 500px
- **장점**: 적절한 크기, 스크롤 여유 있음

### 옵션 B: 고정 픽셀
```jsx
className="w-full h-[400px] md:h-[500px]"
```
- 장점: 예측 가능
- 단점: Tailwind 클래스보다 덜 표준적

### 옵션 C: 뷰포트 단위 (비권장)
```jsx
className="w-full h-[55vh] md:h-[500px]"
```
- 장점: 모바일 화면 크기에 비례
- 단점: 작은 화면에서 너무 클 수 있음, 스크롤 문제 악화

**최종 권장**: **옵션 A** (h-96 / 500px) - 적절한 크기 + 스크롤 여유

---

## 📝 수정 파일 요약

| 파일 | 수정 내용 | 코드 변화 |
|------|----------|----------|
| `PlaceWikiDetailsView.jsx` | 1. AI 버튼 bottom-16→bottom-0<br>2. 조건부 렌더링 제거<br>3. 토글 기능 구현 | +30줄 |
| `PlaceMiniMap.jsx` | 1. 지도 높이 확대 (h-64→h-96)<br>2. **fullscreen 코드 전부 삭제**<br>3. 터치 스크롤 최적화 설정 | -75줄 |

**총 코드 변화**: -50줄 (간소화!)

---

## 🎯 예상 효과

### AI 버튼
- ✅ 모바일: 화면 최하단에 완전히 붙음
- ✅ 항상 접근 가능, 열기/닫기 자유로움
- ✅ PC: 영향 없음

### 지도
- ✅ 모바일: 384px로 충분히 크게 보임 (+50%)
- ✅ 터치 스크롤 최적화로 사용자 갇힘 방지
- ✅ fullscreen 기능 자체가 불필요해짐
- ✅ iOS/Android 플랫폼 차이 없음 (동일한 경험)
- ✅ 코드 간소화로 버그 가능성 감소

---

## 🚨 사용자 테스트 항목

### 1. 모바일 AI 버튼
- [ ] 화면 **최하단에 완전히 붙어** 있는가?
- [ ] 클릭 시 AI 로컬 왓슨 섹션이 열리는가?
- [ ] AI 열린 상태에서 버튼이 **계속 표시**되는가?
- [ ] 버튼 레이블이 **"로컬 왓슨 닫기"**로 변경되는가?
- [ ] "닫기" 클릭 시 AI 섹션이 사라지고 상단으로 스크롤되는가?

### 2. 모바일 지도 크기 및 스크롤
- [ ] **모바일**: 지도가 충분히 크게 보이는가? (384px, +50%)
- [ ] **모바일**: 지도 위에서 **아래로 스크롤이 되는가?** (중요!)
- [ ] **모바일**: 지도 드래그가 너무 민감하지 않은가?
- [ ] **모바일**: 두 손가락 줌/회전이 작동하는가?
- [ ] **모바일**: fullscreen 버튼이 **사라졌는가?** (의도된 동작)
- [ ] **PC**: 지도가 적절한 크기인가? (500px)
- [ ] **전체**: 2D/3D 토글 버튼은 정상 작동하는가?

### 3. 전체 UX
- [ ] 스크롤 동작이 자연스러운가?
- [ ] 지도가 본문과 잘 어울리는가?
- [ ] 콘솔에 에러가 없는가?

---

## 📌 다음 단계

- [x] 모바일 테스트 피드백 분석
- [x] 해결 방안 설계
- [x] 간소화된 최종 계획 수립
- [ ] **👉 사용자 승인 대기**
- [ ] Code 모드 전환 및 구현
- [ ] 사용자 테스트 대기
- [ ] 로그 업데이트 및 커밋

---

## 💡 핵심 변화

### Before (이전 계획)
- iOS fullscreen 미지원 → 버튼 숨김 또는 모달 구현
- 복잡한 크로스 브라우저 대응
- 플랫폼별 다른 경험

### After (최종 계획) ⭐
- **지도 크기를 아예 크게 만듦**
- fullscreen 버튼 완전 제거
- 모든 플랫폼 동일한 경험
- **코드 간소화 (-80줄)**

---

## 🔗 관련 문서

- 상세 계획: [`plans/2026-04-01-session5-fix-plan.md`](plans/2026-04-01-session5-fix-plan.md)
- Mapbox 조사: [`plans/2026-04-01-mapbox-fullscreen-research.md`](plans/2026-04-01-mapbox-fullscreen-research.md)

---

## 📐 시각적 비교

```
┌─────────────────────────────┐
│  현재 모바일 (256px)         │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │      지도 영역       │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  fullscreen 버튼 필요 →     │
│  (iOS에서 작동 안 함 ❌)     │
└─────────────────────────────┘

┌─────────────────────────────┐
│  제안 모바일 (384px)         │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │                     │   │
│  │      지도 영역       │   │
│  │   충분히 큼 + 적절   │   │
│  │  (터치 스크롤 가능)  │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  [스크롤 여유 공간 42%]      │
│  fullscreen 버튼 불필요 ✅   │
└─────────────────────────────┘
```

**결론**: 단순하고 효과적이며 **사용성을 고려**한 해결책! 🎉
