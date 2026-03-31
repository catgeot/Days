# Plans 폴더 정리 계획

**작성일**: 2026-03-31  
**목표**: 중복 문서 제거, 아카이브 정리, 명확한 구조 확립

---

## 📊 현재 상태 분석

### Phase 9 관련 파일 (총 14개)

#### ✅ 유지할 핵심 파일 (4개)
```
plans/phase9-2-MASTER-GUIDE.md              (767줄) - 통합 가이드
plans/phase9-2-ai-prompts.md                       - AI 프롬프트 재사용
plans/phase9-2-phase1-100cities.json               - 데이터 파일
plans/phase9-ux-optimization-plan.md               - 초기 기획 (참고용)
```

#### 🔄 중복/세션 문서 (7개)
```
plans/phase9-2-next-session-guide-v2.md            - MASTER와 중복
plans/phase9-2-phase2-addon-plan.md                - MASTER에 통합됨
plans/phase9-2-session2-summary.md                 - 세션 기록
plans/phase9-2-session3-completion.md              - 세션 기록
plans/phase9-2-session3-summary.md                 - 세션 기록
plans/phase9-session-summary.md                    - 구버전 요약
plans/phase9-next-session-guide.md                 - MASTER로 대체됨
```

#### ✅ 이미 아카이브된 파일 (3개)
```
plans/archive/phase9-2-phase1-completion-report.md - Phase 1 완료 보고
plans/archive/phase9-session-summary.md            - 세션 요약
plans/archive/SESSION-SUMMARY-2026-03-30.md        - 세션 요약
```

### 기타 계획 파일 분석

#### ✅ 유지할 활성 문서
```
plans/destination-scope-analysis.md                - 여행지 분석
plans/europe-density-improvement-plan.md           - 유럽 밀집도 개선
plans/globe-overlap-resolution-session.md          - 최근 작업 기록
plans/globe-rendering-optimization-analysis.md     - 기술 분석
plans/workflow-optimization-analysis.md            - 워크플로우 분석
```

#### 🗂️ 아카이브 후보 (완료된 작업)
```
plans/phase9-1-completion-report.md                - Phase 9-1 완료
plans/cleanup-action-plan.md                       - 정리 계획 (이 작업 후 아카이브)
```

---

## 🎯 정리 계획

### 1단계: 중복 문서 아카이브

```bash
# 세션 기록 이동
move plans\phase9-2-session2-summary.md plans\archive\
move plans\phase9-2-session3-completion.md plans\archive\
move plans\phase9-2-session3-summary.md plans\archive\

# 구버전 가이드 이동
move plans\phase9-2-next-session-guide-v2.md plans\archive\
move plans\phase9-2-phase2-addon-plan.md plans\archive\
move plans\phase9-next-session-guide.md plans\archive\

# Phase 9-1 완료 보고 이동
move plans\phase9-1-completion-report.md plans\archive\
```

**총 7개 파일 아카이브**

### 2단계: plans/phase9-session-summary.md 처리

**문제**: plans와 archive 폴더에 동일 파일명 존재

**해결**:
```bash
# plans 버전 삭제 (archive 버전만 유지)
del plans\phase9-session-summary.md
```

### 3단계: 정리 후 구조

```
plans/
├── 📌 Phase 9-2 활성 파일 (3개)
│   ├── phase9-2-MASTER-GUIDE.md          ⭐ 메인 가이드
│   ├── phase9-2-ai-prompts.md            🤖 AI 프롬프트
│   └── phase9-2-phase1-100cities.json    📊 데이터
│
├── 📚 참고 문서 (5개)
│   ├── phase9-ux-optimization-plan.md    - 초기 기획
│   ├── destination-scope-analysis.md     - 여행지 분석
│   ├── europe-density-improvement-plan.md
│   ├── globe-rendering-optimization-analysis.md
│   └── workflow-optimization-analysis.md
│
├── 📝 최근 세션 기록 (1개)
│   └── globe-overlap-resolution-session.md
│
├── 🔧 기타 계획 파일 (유지)
│   ├── ai-*.md
│   ├── globe-*.md
│   ├── toolkit-*.md
│   └── ...
│
└── archive/
    ├── phase9-2-phase1-completion-report.md
    ├── phase9-2-session2-summary.md        ⭐ 추가
    ├── phase9-2-session3-completion.md     ⭐ 추가
    ├── phase9-2-session3-summary.md        ⭐ 추가
    ├── phase9-2-next-session-guide-v2.md   ⭐ 추가
    ├── phase9-2-phase2-addon-plan.md       ⭐ 추가
    ├── phase9-next-session-guide.md        ⭐ 추가
    ├── phase9-1-completion-report.md       ⭐ 추가
    ├── phase9-session-summary.md
    └── SESSION-SUMMARY-2026-03-30.md
```

---

## 📈 예상 효과

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| Phase 9 활성 문서 | 11개 | 3개 | **73%↓** |
| plans/ 총 파일 수 | 52개 | 44개 | **15%↓** |
| archive/ 파일 수 | 3개 | 10개 | +7개 |
| 중복 문서 | 다수 | 없음 | ✅ |

---

## ✅ 실행 명령어

### Windows (cmd.exe)

```batch
:: 1단계: 세션 기록 아카이브
move plans\phase9-2-session2-summary.md plans\archive\
move plans\phase9-2-session3-completion.md plans\archive\
move plans\phase9-2-session3-summary.md plans\archive\

:: 2단계: 구버전 가이드 아카이브
move plans\phase9-2-next-session-guide-v2.md plans\archive\
move plans\phase9-2-phase2-addon-plan.md plans\archive\
move plans\phase9-next-session-guide.md plans\archive\
move plans\phase9-1-completion-report.md plans\archive\

:: 3단계: 중복 파일 삭제
del plans\phase9-session-summary.md

:: 4단계: 확인
dir plans\phase9*.md
dir plans\archive\phase9*.md
```

---

## 🔍 검증 항목

정리 후 확인:
- [ ] plans/ 폴더에 phase9-2-MASTER-GUIDE.md 존재
- [ ] plans/ 폴더에 phase9-2-ai-prompts.md 존재
- [ ] plans/ 폴더에 중복 가이드 파일 없음
- [ ] archive/ 폴더에 7개 파일 추가됨
- [ ] phase9-session-summary.md는 archive에만 존재

---

## 📌 다음 세션 시작 제시어

정리 완료 후:

```
".ai-claude-context.md와 phase9-2-MASTER-GUIDE.md 확인하고 여행지 21개 추가 작업 시작"
```

또는 사용자 테스트 먼저:

```
".ai-claude-context.md 확인하고 현재 앱 상태 테스트 진행"
```

---

**작성일**: 2026-03-31  
**다음 작업**: 사용자 승인 후 정리 실행
