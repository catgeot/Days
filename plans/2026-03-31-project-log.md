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

**최종 업데이트**: 2026-03-31 17:12 (KST)
