[⬅️ 이전 로그 보기 (2026-04-15)](./2026-04-15-project-log.md)

# 프로젝트 진행 로그 (2026-04-16)

## 📌 오늘 진행할 작업
- [x] API Key 외부 도용 현상 원인 파악 및 긴급 방어
- [x] 프론트엔드 직접 호출 제거 및 `gemini-proxy` 전면 도입
- [x] `gemini-proxy` Allowlist(허용 모델 목록) 추가로 `tts` 등 악성 호출 차단
- [x] Mapbox API 키 URL 제한 설정 안내 및 환경 변수 정리

## 📝 작업 기록

### 1. 외부 API 도용 보안 취약점 발견 및 패치 적용
- **문제 발생**: 사용자가 확인한 로그 내역에 프로젝트에서 사용하지 않는 음성 생성 모델(`gemini-2.5-flash-preview-tts`) 호출 내역 11건 발견.
- **원인 분석**: 
  - Vercel 등 프론트엔드 환경 변수에 `VITE_GEMINI_API_KEY` 형태로 Gemini API 키를 저장하여 빌드 시 클라이언트에 평문 노출됨.
  - 브라우저 개발자 도구나 네트워크 탭에서 누군가 API 키를 탈취해 외부에서 임의로 호출한 것으로 확인.
- **해결 방안 (조치 완료)**:
  - `.env.local` 및 클라이언트 코드(`useHomeHandlers.js`, `ChatModal.jsx`, `useLogbookAI.js`, `ReviewEditorModal.jsx`, `usePlaceChat.js`)에서 `import.meta.env.VITE_GEMINI_API_KEY`를 사용하는 로직을 모두 제거.
  - 클라이언트에서의 직접 API 호출을 차단하고, 무조건 Supabase의 `gemini-proxy` Edge Function을 경유하도록 `apiClient.js`의 `fetchProxyGemini`로 전면 마이그레이션.
  - 기존 Fallback 통신(직접 API 통신) 로직도 프록시 에러 스로우 방식으로 대체.

### 2. 백엔드(gemini-proxy) 보안 정책(Allowlist) 도입
- 프록시에서도 아무 모델이나 호출하지 못하도록 허용된 모델 리스트를 지정하는 방어 로직 추가.
  ```typescript
  const ALLOWED_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-pro-preview",
    "gemini-3.1-pro"
  ];
  ```
- 위 리스트에 없는 모델을 요청할 경우 `403` 또는 `500`으로 차단하여 무단 사용 및 과도한 비용 청구를 원천 봉쇄.

### 3. 클라이언트 API 키 (Mapbox 등) 보안 관리 가이드라인 안내
- 프론트엔드에서 필수적으로 사용해야 하는 Mapbox, YouTube, Unsplash 키들은 Vercel에 노출될 수밖에 없는 한계 설명.
- 도용 및 요금 폭탄 방지를 위해 **각 서비스 플랫폼의 관리자 대시보드에서 'HTTP 리퍼러(URL/도메인 제한)'**를 설정하여 운영 도메인(`gateo.kr`, `localhost`) 외의 접속을 차단하도록 가이드.

### 4. 전 세계 공식 비자(e-Visa/ETA) 링크 매핑 확대 및 에러 패치
- 사용자가 제보한 누락/에러 링크 확인 후 프론트엔드(`constants.js`) 매핑 데이터 전면 보완.
- **주요 수정 사항**:
  - 탄자니아(`visa.immigration.go.tz`), 러시아(`electronic-visa.kdmid.ru`) 공식 포털 추가.
  - 볼리비아(SIV 포털), 잠비아/짐바브웨(KAZA 유니비자), 요르단 패스, 세이셸 ETA 등 5개 신규 제도 추가.
  - 사우디아라비아, 라오스, 네팔, 쿠바 등 주요 관광 국가 비자 신청 매핑 보강.
  - 영국 ETA 도입 반영으로 기존 ETIAS에서 영국/런던 키워드를 분리하고 공식 단축 URL(`https://www.gov.uk/eta`)로 교체하여 404 에러 해결.
  - 볼리비아 기존 포털 503 에러 발생에 따라 최신 SIV 포털(`https://visas.cancilleria.gob.bo/`)로 대체.
- **효과**: 사용자가 도시명/지역명으로 검색할 때도 외교부 사이트로 잘못 연결되지 않고 100% 정확한 공식 비자 포털로 매칭되어 편의성과 정보 신뢰성 대폭 향상.

---

## ⚠️ 남은 이슈 및 고려사항
- 기존에 노출된 Gemini API 키는 이미 탈취되었으므로 Google AI Studio에서 즉시 삭제(폐기) 처리해야 함. (사용자 조치 안내 완료)
- 변경된 새 키는 Supabase 환경 변수에 등록 후 Edge Function 재배포 필요.

## 🚀 Next Steps
- [ ] **[Phase 8-6] 링크 전략 고도화 및 파트너사 전환**: 다음 세션에서 작동하지 않는 링크(에어비앤비 등)를 파악하고 트립닷컴/익스피디아 등으로 전환 적용.
- [ ] **[Phase 8-3 & 9] 복잡한 여행지 시스템 연동 (검색 모달 큐레이션)**
- [ ] **[Phase 9-2] 여행지 데이터 100개 추가 (Phase 2 대기)**
- [ ] **[Phase 10] 백엔드 프롬프트 개선 (DB 공항명 필드 추가 등) 및 A/B 테스트 검증**
