# Phase 8: 복잡한 여행지 특화 시스템 구축 (최종안 - 완벽한 독립 아키텍처)

## 📋 배경 및 아키텍처 전환
과거 프로젝트에서 위키(로컬 팁)와 스마트 툴킷이 논리적으로 결합되어 있어 기능 확장에 병목이 발생하고 로직이 꼬이는 문제가 있었습니다.
두 기능은 사용하는 데이터 형태(마크다운 vs JSON)와 목적(스토리텔링 vs 수익성 예약)이 완전히 다르므로, **"위키 탭과 툴킷 탭은 서로 알 필요가 없는 완벽한 별개의 작품"**이어야 한다는 사용자님의 통찰을 설계의 핵심 원칙으로 삼았습니다.

이에 따라 백엔드 함수부터 DB 컬럼, 프론트엔드 로직까지 두 도메인을 **물리적으로 완전히 분리**합니다.

## 🎯 핵심 전략: 백엔드 엣지 함수 분리 및 하이브리드 모델 라우팅

**1. 위키 전담 시스템 (스토리텔러)**
- **기능**: 생생하고 감성적인 로컬 가이드 팁(마크다운) 생성
- **DB 컬럼**: `ai_practical_info` (text)
- **백엔드 함수**: `update-place-wiki` (기존 로직에서 툴킷 찌꺼기 완벽 제거)
- **AI 모델**: **Gemini 2.5 Pro** (비용 효율적이고 창의적인 글쓰기에 최적)

**2. 툴킷 전담 시스템 (예약/플래닝 에이전트)** 🆕
- **기능**: 수익성에 직결되는 예약 링크(비자, 페리 등), 여정 타임라인, 복잡도 분석 추출 및 JSON 구조화
- **DB 컬럼**: `essential_guide` (jsonb) - 기존 빈 컬럼 부활
- **백엔드 함수**: **`update-place-toolkit`** (새로 생성)
- **AI 모델**: **Gemini 3.1 Pro** (가장 뛰어난 논리적 추론 및 웹 검색, 엄격한 JSON 포맷팅 능력 활용)

이렇게 설계하면 툴킷 로직을 아무리 복잡하게 확장해도 위키 시스템에 단 1%의 영향도 주지 않으며, 에러 발생 시 장애가 격리(Fault Tolerance)됩니다.

---

## 💾 `essential_guide` JSON 구조 설계 (예시)

```json
{
  "is_complex": true,
  "complexity_score": 85,
  "journey_timeline": [
    { "step": 1, "title": "인천 출발", "duration": "7시간" },
    { "step": 2, "title": "발리 공항 도착 & 픽업", "duration": "1시간" },
    { "step": 3, "title": "빠당 바이 항구 도착", "duration": "1.5시간" },
    { "step": 4, "title": "페리 탑승 및 길리 메노 도착", "duration": "2시간" }
  ],
  "categories": {
    "pre_travel": [
      { "title": "E-비자 신청", "url": "https://molina.imigrasi.go.id/", "cost": "$35" },
      { "title": "관광세 납부", "url": "https://lovebali.baliprov.go.id/", "cost": "IDR 150,000" }
    ],
    "airport_transfer": { "advice": "Eka Jaya 픽업 추천", "url": "https://ekajayafastboat.com/" },
    "ferry_booking": { "advice": "BlueWater Express", "url": "https://www.bluewaterexpress.com/" },
    "visa": { "advice": "도착비자 가능..." },
    "accommodation": { "advice": "섬 동부 해변가 추천..." }
  }
}
```

---

## 📊 작업 순서 (Todo List)
1. [백엔드] 기존 `update-place-wiki` 함수에서 툴킷 관련 프롬프트 제거 및 Gemini 2.5 Pro 로직 고도화
2. [백엔드] 신규 엣지 함수 `update-place-toolkit` 생성 (Gemini 3.1 Pro 기반, `essential_guide` JSON 포맷 강제 프롬프트 작성)
3. [프론트엔드] API 클라이언트(`src/pages/Home/lib/apiClient.js` 등)에 `fetchPlaceToolkit` 함수 추가
4. [프론트엔드] `aiDataParser.js` 툴킷 파싱 의존성 제거
5. [프론트엔드] `ToolkitTab.jsx` 데이터 소스를 `essential_guide`로 변경 및 로딩/갱신 로직 독립화
6. [프론트엔드] 복잡한 여행지용 확장 UI (`PreTravelChecklist`, `JourneyTimeline` 등) 개발
7. '길리 메노', '보라카이' 데이터 생성 테스트 및 디버깅
