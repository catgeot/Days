# AI (Gemini) API 범용 프록시 서버 구축 및 점진적 마이그레이션 계획

## 1. 개요 및 목적
현재 `gateo.kr` 클라이언트(브라우저)에서 직접 Gemini API를 호출하는 방식(`apiClient.js`)은 API 키 노출 위험이 있고, 클라이언트 환경에 따라 네트워크 오류(CORS, 모바일 환경 제약 등)에 취약합니다. 
이를 해결하기 위해 **Supabase Edge Functions**를 활용한 범용 프록시 서버를 구축하여 보안을 강화하고, 서버 사이드에서 로깅, 캐싱, 모델 라우팅을 중앙 통제하는 아키텍처로 점진적 마이그레이션을 진행합니다.

## 2. 아키텍처 설계 (Supabase Edge Functions 기반)
### 2.1. 단일 진입점 (Universal Proxy)
- **함수명**: `gemini-proxy` (또는 `ai-gateway`)
- **역할**: 클라이언트의 모든 AI 요청을 하나의 Edge Function에서 수신한 뒤, 요청된 `modelId`와 `taskType`에 따라 적절한 프롬프트 주입 및 Gemini API로 릴레이합니다.

### 2.2. 요청/응답 페이로드 스펙 (예시)
```json
// Client Request
{
  "taskType": "chat" | "curation" | "logbook_draft" | "search_correction",
  "modelId": "gemini-2.5-flash", 
  "payload": {
    "userText": "...",
    "history": [],
    "images": ["base64..."]
  }
}
```

### 2.3. 보안 및 에러 핸들링
- **인증**: 클라이언트 요청 시 Supabase Auth JWT 토큰을 검증하여 인가된 사용자(또는 유효한 세션)만 API를 호출하도록 제한.
- **API 키 은닉**: Gemini API 키(`GEMINI_API_KEY`)는 Edge Function의 환경 변수(Secrets)로 안전하게 보관.
- **자동 Fallback**: 503 또는 404 에러 발생 시 서버 단에서 `gemini-2.5-flash`로 자동 재시도하는 로직을 프록시 내부에 캡슐화.

## 3. 점진적 마이그레이션 단계 (Phases)

### Phase 1: 기반 인프라 구축 및 단순 기능 연동 (단기)
1. **Edge Function 생성**: `supabase/functions/gemini-proxy` 생성 및 Deno 환경 설정.
2. **비밀키 설정**: Supabase 프로젝트에 `GEMINI_API_KEY` 환경 변수 등록.
3. **프록시 코어 로직 작성**: 클라이언트 페이로드를 파싱하고 구글 생성형 API로 POST 요청을 보내는 범용 릴레이 로직 구현.
4. **테스트 적용**: '스마트 검색창 교정(Search Correction)' 등 영향도가 적은 단일 기능부터 프록시 서버를 거치도록 `apiClient.js` 수정.

### Phase 2: 멀티모달 및 복잡한 컨텍스트 마이그레이션 (중기)
1. **장소 챗봇(Chat) 전환**: `PlaceChatPanel.jsx`에서 사용하는 대화 내역(`history`) 및 `systemInstruction`을 프록시 서버로 이관. (프롬프트는 프록시 내부에서 관리하거나 클라이언트에서 주입)
2. **리뷰 초안 작성(Logbook Draft) 전환**: 별점 및 키워드를 기반으로 리뷰 초안을 작성하는 로직 전환.
3. **AI 큐레이션 전환**: `AICurationCard.jsx` 등에서 사용하는 에세이 생성 로직 전환.
4. **이미지 처리 (Vision)**: Base64 이미지 데이터를 프록시 서버 거쳐서 Gemini에 전송할 때의 용량 제한(Edge Function Payload Limit) 테스트 및 최적화. (필요 시 Supabase Storage URL 방식으로 전환)

### Phase 3: 고도화 및 클라이언트 클린업 (장기)
1. **로깅 및 모니터링**: 어떤 유저가 어떤 모델을 얼마나 호출하는지 DB 테이블(`ai_usage_logs`)에 비동기 기록.
2. **Rate Limiting (속도 제한)**: 악의적인 API 호출을 막기 위해 유저별/IP별 호출 횟수 제한 적용.
3. **클라이언트 클린업**: 기존 `apiClient.js`에 남아있던 직접 호출 로직 및 로컬 `apiKey` 주입 관련 코드 완전 삭제.
4. **서버 사이드 캐싱**: 동일한 장소에 대한 큐레이션 등은 DB에 캐싱하여 API 비용 절감.

## 4. 즉각 실행 가능한 다음 액션 아이템
1. 로컬 환경에서 `supabase functions new gemini-proxy` 명령어 실행하여 뼈대 생성.
2. `apiClient.js` 내의 `fetchGeminiResponse`를 대체할 새로운 `fetchProxyGemini` 인터페이스 설계.
