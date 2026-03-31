# 프로젝트 진행 로그

**시작일**: 2026-03-31
**용도**: 누적 진행사항 기록 (지속 업데이트)

---

## 2026-03-31

### ✅ 이전 세션 작업 확인 (Phase 9-2 완료)
**커밋**: e091428, c8cd788, 764fb3c

- **200개 여행지 달성**: travelSpots.js 총 200개 ✅
- **지구본 최적화**: 150개만 표시 (75%) ✅
- **겹침 해결**: 22개 여행지 숨김 처리 (showOnGlobe: false) ✅
- **유럽 밀집도 개선**: Urban -45%, 마커 최적화 ✅

**통계**:
- 총 여행지: 200개
- 지구본 표시: 150개 (showOnGlobe: true)
- 검색 전용: 50개 (showOnGlobe: false)

**주요 전략**:
- Tier 1 (Common Cities): 36/50개 표시 (72%)
- Tier 2 (Special Places): 92/128개 표시 (71.9%)
- Tier 3 (Hidden Gems): 22/22개 표시 (100%)

### ✅ Plans 폴더 정리 완료
- 중복 문서 8개 아카이브 이동
- Phase 9 활성 파일: 11개 → 3개 (73%↓)
- 명확한 구조 확립

**아카이브된 파일**:
- phase9-2-session2-summary.md
- phase9-2-session3-completion.md
- phase9-2-session3-summary.md
- phase9-2-next-session-guide-v2.md
- phase9-2-phase2-addon-plan.md
- phase9-next-session-guide.md
- phase9-1-completion-report.md
- cleanup-action-plan.md

**삭제된 파일**:
- phase9-session-summary.md (중복)

**최종 Phase 9 활성 파일**:
- phase9-2-MASTER-GUIDE.md (통합 가이드)
- phase9-2-ai-prompts.md (AI 프롬프트)
- phase9-ux-optimization-plan.md (초기 기획)

### ✅ 문서 관리 규칙 개선
- 새로운 파일명 규칙: `YYYY-MM-DD-제목.md` (시간순 정렬)
- 누적 로그 파일: 이 파일에 계속 업데이트
- 참고용 계획만 신규 생성
- completion, summary, report 생성 금지
- .ai-claude-context.md 업데이트 완료

---

## 현재 상태 요약

### Phase 9-2: 200개 여행지 프로젝트 ✅ 완료
- [x] Phase 1: 100개 여행지 추가
- [x] Phase 2: 100개 추가 (실제 79개 추가, 21개 이미 존재)
- [x] 지구본 최적화: 150개 표시 전략
- [x] 유럽 밀집도 개선
- [x] 겹침 해결: 22개 숨김 처리

### 다음 작업 후보

#### 옵션 1: 사용자 테스트
- [ ] 200개 여행지 탐색
- [ ] 검색 기능 테스트
- [ ] 지구본 가독성 확인
- [ ] 성능 측정

#### 옵션 2: 추가 개선
- [ ] 동적 줌 레벨 표시
- [ ] 클러스터 뱃지 추가
- [ ] 모바일 UX 최적화

#### 옵션 3: 새 기능 개발
- [ ] 여행 일정 계획 기능
- [ ] 소셜 공유 기능
- [ ] 개인화 추천 시스템

---

## 2026-03-31 (오후 세션)

### ✅ 위키 탭 자동 생성 로직 추가

**문제점**:
- 위키 탭에서 최신 정보를 최상단에 자동 표시하도록 변경
- 하지만 검색/지오코딩으로 진입한 신규 여행지는 DB에 `ai_practical_info`가 없음
- 결과: 제미나이 최신 정보가 생성되지 않고, 이를 파싱하는 툴킷도 작성 안됨

**해결**:
- 툴킷 탭은 이미 자동 요청 로직 있음 ([`ToolkitTab.jsx:296-307`](src/components/PlaceCard/tabs/ToolkitTab.jsx:296))
- 위키 탭에도 동일한 자동 생성 로직 추가

**변경 사항**:
- [`PlaceWikiDetailsView.jsx`](src/components/PlaceCard/views/PlaceWikiDetailsView.jsx)
  - 위키 탭 활성화 시 DB 데이터 없으면 자동으로 제미나이 API 호출
  - 장소 변경 시 플래그 리셋하여 매번 체크 가능
  - `initialAutoGenTriggered` ref로 중복 호출 방지

**효과**:
- ✅ 검색으로 진입한 신규 여행지도 위키 정보 자동 생성
- ✅ 지오코딩으로 추가된 여행지도 정보 자동 생성
- ✅ 툴킷 탭에서 파싱할 데이터 확보
- ✅ 일관된 사용자 경험 제공

---

## 2026-03-31 (오후 세션 2)

### ✅ 위키 탭 DB 레코드 없는 경우 대응 완료

**문제점**:
- 검색/지오코딩으로 진입한 신규 여행지는 DB `place_wiki` 레코드가 없음
- 레코드 없으면 "제미나이에게 최신 정보 요청" 버튼이 표시되지 않음
- 버튼이 없어서 로컬 왓슨 정보를 생성할 방법이 없음
- 툴킷도 파싱할 데이터가 없어서 작성 불가

**해결 과정**:

1. **UI 수정** - 레코드 없어도 버튼 표시
   - PC: 좌측 패널에 버튼 항상 표시
   - 모바일: 하단 푸터에 버튼 표시

2. **클라이언트 로직 추가** - DB INSERT 처리
   - 버튼 클릭 시 레코드 없으면 INSERT 먼저 실행
   - unique violation 에러는 무시

3. **Edge Function 수정** - UPDATE → UPSERT
   - 레코드 없으면 자동 생성
   - **title, summary 필드 제거** (테이블에 컬럼 없음)
   - place_id, ai_practical_info, ai_info_updated_at만 저장

**변경 파일**:
- [`PlaceWikiDetailsView.jsx`](src/components/PlaceCard/views/PlaceWikiDetailsView.jsx)
- [`PlaceWikiNavView.jsx`](src/components/PlaceCard/views/PlaceWikiNavView.jsx)
- [`supabase/functions/update-place-wiki/index.ts`](supabase/functions/update-place-wiki/index.ts)

**백그라운드 실행 로직**:
- ✅ 이미 구현됨 - DB `[[LOADING]]` 저장 후 폴링
- 다른 탭/사이트 이동해도 서버에서 계속 실행
- [`useWikiData.js`](src/components/PlaceCard/hooks/useWikiData.js) 2초마다 폴링

**배포 필요**:
```bash
npx supabase functions deploy update-place-wiki
```

**커밋**: `fb475fa`

**효과**:
- ✅ 검색으로 진입한 신규 여행지도 버튼 표시
- ✅ 지오코딩으로 추가된 여행지도 정보 생성 가능
- ✅ 툴킷 탭에서 파싱할 데이터 확보
- ✅ PC/모바일 일관된 UX

**다음 테스트**:
1. Edge Function 재배포
2. 검색으로 신규 여행지 진입 → 버튼 클릭
3. 로컬 왓슨 정보 생성 확인
4. 툴킷 탭 확인

---

## 2026-03-31 (오후 세션 3) - 위키 DB 레코드 생성 버그 수정 ✅

### 🐛 발견된 문제

**원인**: 클라이언트 코드에서 DB 스키마와 불일치하는 컬럼 사용

1. **DB 스키마 불일치 버그** (Critical)
   - 위치: [`PlaceWikiDetailsView.jsx:112-117`](src/components/PlaceCard/views/PlaceWikiDetailsView.jsx:112)
   - 문제: INSERT문에서 존재하지 않는 `title` 컬럼 사용
   - 실제 스키마: `place_wiki` 테이블에 `title` 컬럼 없음
   - 결과: DB INSERT 실패 → 레코드 생성 안됨 → AI 정보 저장 불가

2. **Edge Function 미배포**
   - 파일: [`supabase/functions/update-place-wiki/index.ts`](supabase/functions/update-place-wiki/index.ts)
   - 상태: UPSERT 로직으로 수정 완료 (커밋 `fb475fa`)
   - 문제: 서버에 배포되지 않음

### ✅ 해결 작업

1. **클라이언트 버그 수정**
   ```javascript
   // ❌ Before (버그)
   await supabase.from('place_wiki').insert({
       place_id: String(placeId),
       title: location,  // title 컬럼 없음!
       summary: '',
       ai_practical_info: '[[LOADING]]'
   });
   
   // ✅ After (수정)
   await supabase.from('place_wiki').insert({
       place_id: String(placeId),
       summary: '',
       ai_practical_info: '[[LOADING]]'
   });
   ```

2. **Edge Function 재배포**
   ```bash
   npx supabase functions deploy update-place-wiki --project-ref phdjnbfitvmrguqzverm
   ```
   - 결과: 성공적으로 배포 완료 ✅
   
   **⚠️ 배포 시 주의사항**:
   - Edge Function에서 환경변수 사용 시 **Supabase Dashboard에서 Secret 등록 필수**
   - 로컬 `.env.local`에만 있으면 배포 후 작동 안 함!
   
   **환경변수 설정 방법**:
   1. Supabase Dashboard 접속: https://supabase.com/dashboard/project/phdjnbfitvmrguqzverm
   2. Settings → Edge Functions → Environment Variables
   3. 필요한 환경변수 추가:
      - `VITE_GEMINI_API_KEY` (또는 `GEMINI_API_KEY`)
      - `SUPABASE_SERVICE_ROLE_KEY` (자동 제공됨)
      - 기타 필요한 API 키
   4. 배포 후 함수 재시작 (자동)
   
   **배포 전 체크리스트**:
   - [ ] Dashboard에서 환경변수 등록 확인
   - [ ] 로컬에서 함수 테스트 완료
   - [ ] 배포 후 Dashboard Logs 확인
   - [ ] 실제 API 호출 테스트

### 📊 DB 스키마 확인 (place_wiki)
```
✅ 존재하는 컬럼:
- id (bigint)
- place_id (text) - Primary Key
- summary (text)
- sections (jsonb)
- source_url (text)
- created_at (timestamp)
- ai_practical_info (text)
- ai_info_updated_at (timestamp)
- essential_guide (jsonb)

❌ 존재하지 않는 컬럼:
- title
```

### 🧪 테스트 방법

1. **검색으로 신규 여행지 진입**
   - 예: "발리" 또는 "몰디브" 검색
   - Place Card 오픈

2. **위키 탭 진입**
   - "제미나이에게 최신 정보 요청" 버튼 클릭
   - 로딩 애니메이션 확인
   - 2초마다 폴링하여 데이터 자동 업데이트

3. **DB 확인**
   - Supabase 대시보드 → place_wiki 테이블
   - 신규 레코드 생성 확인
   - ai_practical_info 필드에 마크다운 데이터 저장 확인

4. **툴킷 탭 확인**
   - 툴킷 탭 진입
   - 8개 카드(비자, 항공, 숙박 등) 정상 표시 확인

### 📝 변경 파일
- [`src/components/PlaceCard/views/PlaceWikiDetailsView.jsx`](src/components/PlaceCard/views/PlaceWikiDetailsView.jsx) - title 컬럼 제거
- [`supabase/functions/update-place-wiki/index.ts`](supabase/functions/update-place-wiki/index.ts) - 재배포

### 🎯 예상 효과
- ✅ 검색으로 진입한 신규 여행지도 위키 정보 생성 가능
- ✅ 지오코딩으로 추가된 여행지도 정보 생성 가능
- ✅ DB 레코드 자동 생성으로 사용자 경험 개선
- ✅ 툴킷 탭 정상 작동

---

---

## 2026-03-31 (오후 세션 4) - RLS 정책 문제 해결 ✅

### 🐛 추가 문제 발견

**실제 원인**: RLS(Row Level Security) 정책으로 인한 클라이언트 권한 부족

1. **클라이언트(anon 키) INSERT/UPDATE 실패**
   - 문제: `place_wiki` 테이블에 RLS 정책 적용됨
   - 결과: 클라이언트에서 INSERT/UPDATE 시도 시 권한 에러
   - 현상: Edge Function은 200 OK이지만 DB 레코드 생성 안 됨

2. **이전 세션 해결책의 한계**
   - 클라이언트에서 INSERT 시도 → RLS에 의해 차단
   - Edge Function UPSERT는 정상 작동 (Service Role 사용)

### ✅ 최종 해결 방법

**전략**: 모든 DB 작업을 Edge Function(Service Role)에서만 처리

1. **클라이언트 코드 수정**
   ```javascript
   // ❌ Before (RLS 때문에 작동 안 함)
   if (!wikiData) {
       await supabase.from('place_wiki').insert({...});
   } else {
       await supabase.from('place_wiki').update({...});
   }
   
   // ✅ After (Edge Function에 위임)
   // Edge Function에서 UPSERT로 모든 처리
   console.log("Edge Function에서 DB 레코드 생성/업데이트 처리");
   ```

2. **Edge Function 확인**
   - 이미 UPSERT 로직 구현되어 있음 ✅
   - Service Role 사용으로 RLS 우회 ✅
   - 레코드 없으면 자동 생성, 있으면 업데이트 ✅

### 📝 변경 파일
- [`src/components/PlaceCard/views/PlaceWikiDetailsView.jsx`](src/components/PlaceCard/views/PlaceWikiDetailsView.jsx:109-113) - 클라이언트 INSERT/UPDATE 로직 제거
- [`supabase/functions/update-place-wiki/index.ts`](supabase/functions/update-place-wiki/index.ts:162) - UPSERT 로직 (이미 구현됨)

### 🧪 테스트 방법

1. **카르스텐츠 피라미드 테스트**
   - 검색: "카르스텐츠 피라미드"
   - Place Card → 위키 탭
   - "제미나이에게 최신 정보 요청" 버튼 클릭
   - 브라우저 콘솔에서 "[PlaceWikiDetailsView] Edge Function에서 DB 레코드 생성/업데이트 처리" 확인
   - 35초 대기 (Gemini API 응답 시간)
   - 위키 정보 표시 확인

2. **DB 확인**
   - Supabase Dashboard → place_wiki 테이블
   - `place_id = "카르스텐츠 피라미드"` 레코드 생성 확인
   - `ai_practical_info` 필드에 마크다운 데이터 확인

3. **툴킷 탭 확인**
   - 툴킷 탭 진입
   - 8개 카드 정상 표시 확인

### 🎯 예상 효과
- ✅ RLS 정책 우회 (Service Role 사용)
- ✅ 신규 여행지 DB 레코드 자동 생성
- ✅ 검색/지오코딩 진입 시 정상 작동
- ✅ 클라이언트 코드 단순화 (DB 직접 조작 제거)

### 📚 학습 포인트

#### Supabase RLS 정책
**현재 `place_wiki` 테이블 정책**:
- ✅ SELECT: public 허용 (읽기 가능)
- ❌ INSERT: 정책 없음 (클라이언트 차단)
- ❌ UPDATE: 정책 없음 (클라이언트 차단)

**권한 구분**:
- **anon 키** (클라이언트): SELECT만 가능
- **Service Role 키** (Edge Function): 모든 작업 가능 (RLS 우회)

#### 왜 기존 여행지는 작동했는가?

**이전 방식** (파이썬 스크립트):
```
1. 파이썬 스크립트로 수동 INSERT (Service Role/관리자 권한)
   → DB 레코드 생성 ✅
2. 웹에서 위키 정보 요청
   → Edge Function이 UPDATE (Service Role)
   → 작동 ✅
```

**신규 여행지 문제**:
```
1. 검색으로 진입 (DB 레코드 없음)
2. 클라이언트가 INSERT 시도 (anon 키)
   → RLS 차단 ❌
3. Edge Function 실행 (Service Role)
   → DB 레코드 없어서 UPDATE 실패 ❌
```

**해결 후**:
```
1. 검색으로 진입 (DB 레코드 없음)
2. 클라이언트는 Edge Function만 호출
3. Edge Function이 UPSERT (Service Role)
   → 레코드 없으면 자동 생성
   → 있으면 업데이트
   → 모두 성공 ✅
```

#### 핵심 차이점

| 상황 | 기존 방식 | 해결 후 |
|------|-----------|---------|
| 레코드 있음 | Edge Function UPDATE ✅ | Edge Function UPSERT ✅ |
| 레코드 없음 | 클라이언트 INSERT 시도 ❌ | Edge Function UPSERT ✅ |
| 수동 작업 | 파이썬 스크립트 필요 | 불필요 (자동 생성) |

---

## 2026-03-31 (오후 세션 5) - placeId 버그 발견 및 해결 ✅

### 🐛 진짜 문제 발견!

**실제 원인**: `requestInfoRef`의 `placeId`가 undefined

```javascript
// ❌ 문제 코드 (50-52줄)
const requestInfoRef = useRef({
    placeName,
    wikiTitle: wikiData?.title,
    placeId: wikiData?.place_id    // 신규 여행지는 wikiData 없음 → undefined!
});

// → placeId가 undefined → 100번째 줄에서 조기 return
// → Edge Function 호출 안 됨!
```

**왜 발견하기 어려웠나?**
1. 코드가 100번째 줄에서 조기 return
2. "[PlaceWikiDetailsView] Edge Function에서 DB 레코드 생성/업데이트 처리" 로그 출력 안 됨
3. "장소 정보를 확인할 수 없습니다" 에러도 UI에 표시 안 됨 (에러 상태 업데이트 전 return)

### ✅ 해결 방법

```javascript
// ✅ 수정 코드
const requestInfoRef = useRef({
    placeName,
    wikiTitle: wikiData?.title,
    placeId: wikiData?.place_id || placeName    // fallback 추가!
});

useEffect(() => {
    requestInfoRef.current = {
        placeName,
        wikiTitle: wikiData?.title,
        placeId: wikiData?.place_id || placeName
    };
}, [placeName, wikiData]);
```

**효과**:
- wikiData 없어도 placeName(한글명) 사용
- Edge Function 정상 호출
- DB 레코드 자동 생성 ✅

### 🧪 테스트 결과

**카르스텐츠 피라미드 테스트**:
1. 검색 → Place Card → 위키 탭 ✅
2. "다시 시도" 버튼 클릭 ✅
3. 콘솔 로그 정상 출력 ✅
   - "[PlaceWikiDetailsView] Edge Function에서 DB 레코드 생성/업데이트 처리"
   - "[PlaceWikiDetailsView] Supabase Edge Function 호출"
4. 35초 후 위키 정보 표시 ✅
5. DB `place_wiki` 테이블에 레코드 자동 생성 ✅
6. 툴킷 탭 8개 카드 정상 표시 ✅

### 📝 최종 변경 사항

1. **placeId fallback 추가** (50-53줄)
   - `wikiData?.place_id || placeName`
   - 신규 여행지도 placeName으로 작동

2. **클라이언트 INSERT/UPDATE 제거** (109-114줄)
   - RLS 정책으로 작동 안 함
   - Edge Function에 모든 DB 작업 위임

3. **에러 처리 롤백 제거** (138-139줄)
   - RLS로 클라이언트 롤백 불가능
   - Edge Function에서 자동 처리

### 🎯 최종 효과

- ✅ 신규 여행지 DB 레코드 자동 생성
- ✅ 검색/지오코딩 진입 시 정상 작동
- ✅ RLS 정책 우회 (Service Role)
- ✅ 파이썬 스크립트 수동 작업 불필요
- ✅ 툴킷 탭 정상 작동

### 📚 교훈

1. **디버깅 로그 중요성**: 조기 return 전에 에러 로그 필수
2. **Fallback 패턴**: optional 데이터는 항상 fallback 제공
3. **RLS 정책 이해**: 클라이언트(anon)와 서버(Service Role) 권한 구분

---

## 2026-03-31 (오후 세션 6) - AI 프록시 마이그레이션 및 방어 로직 구축 ✅

### 🛡️ 목적
- 4월 1일부터 변경되는 Gemini API 사용량 규제에 대비하여, 클라이언트 직접 호출 방식의 취약점을 보완하고 사이트 멈춤을 방지하기 위한 **서버 사이드 프록시 및 다중 방어 로직** 구축.

### ✅ 구현 내용 (4단계 구간 진행)

1. **[구간 1] Edge Function 뼈대 생성 및 배포**
   - `supabase/functions/gemini-proxy` 생성
   - CORS 처리 및 기본 응답 구조 작성
   - Project Ref ID(`phdjnbfitvmrguqzverm`)로 배포 완료

2. **[구간 2] 프록시 내부 Gemini API 호출 및 Fallback 방어 로직**
   - 클라이언트 요청(`modelId`, `parts`)을 받아 Gemini API로 릴레이
   - **서버 사이드 Fallback**: 503(Service Unavailable) 또는 404 에러 발생 시, 가장 안정적인 초경량 모델인 `gemini-3.1-flash-lite-preview`로 자동 재시도하는 로직 캡슐화

3. **[구간 3] 클라이언트 연동 준비 및 자동 롤백(Fallback) 방안 추가**
   - `src/pages/Home/lib/apiClient.js`에 `fetchProxyGemini` 함수 신설
   - **클라이언트 사이드 롤백**: 만약 프록시 서버(Edge Function) 호출 자체가 실패하거나 에러를 반환할 경우, 기존의 클라이언트 직접 호출 방식(`fetchGeminiResponse`)으로 자동 롤백하도록 이중 방어 로직 구현
   - 홈 화면 스마트 검색 AI 교정 기능(`useHomeHandlers.js`)에 우선 적용 및 테스트 완료

4. **[구간 4] 전면 마이그레이션**
   - 장소 챗봇 (`src/components/PlaceCard/hooks/usePlaceChat.js`) 전환 완료
   - 리뷰 초안 작성 (`src/pages/DailyReport/hooks/useLogbookAI.js`) 전환 완료
   - 기존 `fetchGeminiResponse`는 롤백 용도로 유지

### 🎯 기대 효과
- **안정성 극대화**: 프록시 서버 장애 시 클라이언트 직접 호출로 롤백, API 장애 시 경량 모델로 Fallback 되는 이중 방어막 구축.
- **보안 강화**: 클라이언트(브라우저)에서 API 키 노출 위험 감소.
- **중앙 통제**: 향후 로깅, 캐싱, Rate Limiting 등을 서버 단에서 일괄 관리할 수 있는 기반(Phase 1 & 2) 마련.

---

---

## 2026-03-31 (야간 세션) - 위키 탭 매거진 레이아웃 고도화 계획 (진행 중)

### 🎨 작업 내용
- 장소 카드의 위키 탭(`PlaceWikiDetailsView`)에 미니맵과 갤러리 이미지를 추가하여 건조한 텍스트 위주의 화면을 개선했습니다.
- `leaflet` 및 `react-leaflet`을 사용하여 다크 테마 기반의 `PlaceMiniMap` 컴포넌트를 구현했습니다.
- `PlaceMediaPanel`을 통해 `galleryData`를 전달받아 위키 본문(sections) 사이사이에 이미지를 배치했습니다.

### 💡 사용자 피드백
- Leaflet 지도의 사용성과 디자인 한계로 인해 **Mapbox로 교체** 요청.
- 단순한 이미지 반복 배치가 인위적이라고 느껴져, 제미나이와 논의했던 **'유기적인 매거진 레이아웃'** 적용 요청.

### 🚀 다음 세션 계획 (`plans/wiki-magazine-layout-plan.md` 생성)
- `leaflet` 제거 및 `react-map-gl`, `mapbox-gl` 설치.
- Hero 이미지(패럴랙스 효과), 인용구(Pull Quotes), 풀와이드 중간 이미지, Sticky 사이드바 지도(PC), 하단 갤러리 그리드 등을 적용하여 하이엔드 여행 매거진 느낌으로 전면 개편 예정.

**최종 업데이트**: 2026-03-31 23:10 (KST)
**커밋 예정**: `feat(wiki): 위키 탭 미니맵 및 갤러리 이미지 추가 (매거진 레이아웃 초안)`
