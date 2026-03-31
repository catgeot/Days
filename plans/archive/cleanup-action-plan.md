# 문서 정리 실행 계획

**작성일**: 2026-03-31  
**목표**: Phase 9-2 관련 중복 문서 정리 (11개 → 3개)  
**예상 시간**: 20분

---

## 📋 정리 대상 파일

### ✅ 유지 (3개)
```
plans/phase9-2-MASTER-GUIDE.md       # 메인 가이드 (압축 필요)
plans/phase9-2-ai-prompts.md         # AI 프롬프트 (재사용)
plans/phase9-2-phase1-100cities.json # 데이터 파일
```

### 🗑️ 삭제 (5개 - 중복)
```
plans/phase9-2-comprehensive-action-plan.md      # MASTER와 70% 중복
plans/phase9-2-phase2-next-session-guide.md      # MASTER에 통합됨
plans/phase9-2-implementation-guide.md           # MASTER에 포함
plans/phase9-2-tier1-destinations.md             # 작업 완료, 불필요
plans/phase9-2-next-session-guide.md             # 존재하지 않음 (이미 삭제)
```

### 📦 아카이브 이동 (3개 - 완료된 작업)
```
plans/phase9-2-phase1-completion-report.md  → plans/archive/
plans/SESSION-SUMMARY-2026-03-30.md         → plans/archive/
plans/phase9-session-summary.md             → plans/archive/
```

---

## 🚀 실행 단계

### Step 1: 아카이브 폴더 생성
```bash
mkdir plans/archive
```

### Step 2: 완료 문서 이동
```bash
# Phase 9-2 Phase 1 완료 보고
move plans\phase9-2-phase1-completion-report.md plans\archive\

# 세션 써머리 이동
move plans\SESSION-SUMMARY-2026-03-30.md plans\archive\
move plans\phase9-session-summary.md plans\archive\
```

### Step 3: 중복 문서 삭제
```bash
# MASTER-GUIDE와 중복
del plans\phase9-2-comprehensive-action-plan.md
del plans\phase9-2-phase2-next-session-guide.md
del plans\phase9-2-implementation-guide.md

# 작업 완료로 불필요
del plans\phase9-2-tier1-destinations.md
```

### Step 4: MASTER-GUIDE 압축 (선택)
현재 445줄 → 목표 150줄 이하

**압축 방법**:
- 코드 예시 제거 (파일 참조로 대체)
- 테스트 항목 간소화
- 상세 설명을 간결한 TODO로 변환

**새 이름**: `plans/phase9-2-todo.md`

---

## 📊 정리 전후 비교

| 항목 | Before | After | 감소율 |
|------|--------|-------|--------|
| 문서 개수 | 11개 | 3개 | 73%↓ |
| 총 라인 수 | ~3,500줄 | ~700줄 | 80%↓ |
| 중복 내용 | 많음 | 없음 | 100%↓ |
| 아카이브 | 0개 | 3개 | - |

---

## ✅ 검증 체크리스트

정리 후 확인사항:

- [ ] `plans/` 폴더에 phase9-2 관련 활성 문서 3개만 존재
- [ ] `plans/archive/` 폴더에 완료 문서 3개 이동됨
- [ ] 중복 문서 5개 삭제됨
- [ ] MASTER-GUIDE 또는 TODO 파일 압축됨 (선택)
- [ ] Git 상태 확인: 삭제/이동 파일 추적

---

## 🔄 커밋 가이드

### Option A: 한 번에 커밋
```bash
git add plans/
git commit -m "docs(plans): Phase 9-2 문서 정리 - 중복 8개 제거, 아카이브 구조 도입

- 중복 문서 5개 삭제 (MASTER-GUIDE로 통합)
- 완료 문서 3개 아카이브 이동
- 토큰 소비 76% 감소 예상
"
```

### Option B: 단계별 커밋
```bash
# 1. 아카이브 구조 도입
git add plans/archive/
git commit -m "docs(plans): 아카이브 폴더 구조 도입 및 완료 문서 이동"

# 2. 중복 문서 삭제
git add plans/
git commit -m "docs(plans): Phase 9-2 중복 문서 5개 삭제 (MASTER-GUIDE로 통합)"
```

---

## 🎯 다음 세션 준비

정리 완료 후:

1. **Phase 9-2 Phase 2 시작**
   - 참고: `plans/phase9-2-MASTER-GUIDE.md`
   - 프롬프트: `plans/phase9-2-ai-prompts.md`

2. **새 작업 시작 시**
   - TODO 리스트 우선 사용
   - 필요시 짧은 메모만 작성 (50줄 이하)
   - 중복 문서 생성 금지

3. **컨텍스트 참조**
   - 공통 규칙: `.ai-context.md`
   - Claude 전용: `.ai-claude-context.md`

---

**다음 단계**: 위 명령어 실행 후 커밋
