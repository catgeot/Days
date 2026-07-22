# 오케스트레이터 (gateo 공식 작업 방식)

**상태**: ✅ 공식 · 2026-07-22  
**역할**: 다배치·동일 SSOT 파일을 여러 세션에 걸쳐 확장할 때 **메인 에이전트 컨텍스트를 아끼는** 운영 방법.  
**제시어**: `오케스트레이터` · 주제 붙임 예) `오케스트레이터` + `명소` / `명소-오케스트레이터`

세션을 21번 여닫으며 tip만 이어 붙이는 방식 대신, **한 오케스트레이터가 배치표·감사·머지를 잡고** 서브에 초안만 맡긴다.

---

## 1. 역할

| 역할 | 하는 일 | 읽지 말 것 |
|------|---------|------------|
| **오케스트레이터(메인)** | 배치표 · 금지 규칙 · 워커 호출 · 감사 게이트 · tip 직렬 append · 핸드오프 | 워커 원문 장문·JSON 전문 |
| **워커(서브)** | 배치 N개(보통 **8~12 hub**) 초안 JSON 조각 · 자체 스모크 요약만 반환 | `main` 직접 push · 전체 SSOT rewrite |
| **통합** | 오케스트레이터(또는 전담 1)가 tip 위 **직렬 append** + audit | 병렬 머지 |

**금지 오해**: 서브가 Cursor 채팅 「메인」으로 자동 승격되지 않는다. 컨텍스트 한도에 가까우면 **오케스트레이터 역할만 핸드오프로 다음 세션/에이전트에 이관**한다.

---

## 2. 언제 쓰는가

**적합**
- 같은 파일에 **append만** 하는 대량 SSOT (예: [`cityAttractionHubs.json`](../src/pages/Home/data/cityAttractionHubs.json))
- 배치가 많고 세션을 사람이 매번 새로 열기 부담일 때
- 초안 조사는 병렬 가능, 파일 반영은 충돌 나기 쉬울 때

**비적합**
- 단일 버그픽스·UI 한 화면
- 서로 다른 파일을 독립 PR로 나누는 일반 feature (기존 PR 흐름 유지)

---

## 3. 운영 루프

```
배치표 확정 (오케스트레이터 + 사용자)
    ↓
워커 N개 병렬 → 초안 조각만 (같은 tip에 push 금지)
    ↓
감사 게이트 (실패 시 해당 배치만 재작업)
    ↓
main tip 위 직렬 append → 스모크 → (요청 시) commit/push
    ↓
컨텍스트 ~50% 또는 배치 구간 끝 → 인수인계서 → 다음 오케스트레이터
```

### 3.1 감사 게이트 (공통)

배치·합본 전후에 최소 확인:

- 키 중복 0 (`hubId` 등)
- 표기 normalize 충돌 0 (명소명 등)
- 필수 필드·enum·좌표
- 도메인 resolve/스모크 (해당 SSOT 런타임)

**명소 hub**: `npm run audit:city-attraction-hubs` (+ 필요 시 resolve 스모크 — 일지 절 참고).

### 3.2 병렬 vs 직렬

| 단계 | 병렬? |
|------|-------|
| 후보 조사·초안 조각 | ✅ |
| 단일 tip SSOT 파일 append / PR 머지 | ❌ 직렬만 |
| 감사 | 합본 직전·직후 (메인) |

---

## 4. 컨텍스트 50% — 오케스트레이터 이관

트리거: 대화가 대략 **절반**을 넘었거나, 배치 구간을 끝내고 쉬기 전.

인수인계서(일지 짧은 절 또는 채팅 요약)에만 남긴다:

1. **목표 잔량** (남은 배치·후보 목록)
2. **tip SHA** · 현재 건수
3. **배치표** (다음 8~12)
4. **금지 3** · 스키마 1줄
5. **제시어** (아래 §6)

다음 세션이 `오케스트레이터`로 시작하면 **이 절 + 방법 문서 §1~3**만 읽고 워커를 다시 띄운다. 이전 워커 로그 전체 Read 금지.

---

## 5. 명소 SSOT 적용 (1호 사례)

| 항목 | 값 |
|------|-----|
| SSOT | `src/pages/Home/data/cityAttractionHubs.json` |
| resolver | `src/pages/Home/lib/cityAttractionHubs.js` |
| 배치 크기 | **8~12 hub** (관례 10) |
| 규칙 | append only · `shrine` KIND 유지 · 시드 `sokcho`/`paris` 덮어쓰기 금지 · 명소명 전역 unique |
| audit | `npm run audit:city-attraction-hubs` |
| 상태(2026-07-23) | **410 hub / 2850 명소** (#47) · **main 커밋됨** · 재개=**해외 우선** |

상세 배치·스모크 문구: [`2026-07-22-project-log.md`](./2026-07-22-project-log.md) · 방향 [`2026-07-23-project-log.md`](./2026-07-23-project-log.md).

**워커 프롬프트 최소 골격**

```
역할: cityAttractionHubs 워커. 배치 hubId 목록만 초안.
출력: JSON 배열 조각(허브 8~12) + hub/exact 스모크 쿼리 목록 + 주의(동명 분리).
금지: main push, JSON 전면 rewrite, shrine 제거, releaseNotes, UI 변경.
스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng}]
kind: beach|market|temple|shrine|viewpoint|landmark|museum|neighborhood|park
```

**오케스트레이터 체크**

1. 배치표 확정 → 워커 병렬  
2. 조각 수신 → `audit:city-attraction-hubs` (합본 시뮬레이션 또는 tip append 후)  
3. tip 직렬 반영 → 스모크 → 사용자 승인 시 commit/push  
4. 50% 또는 구간 종료 시 일지 핸드오프

---

## 6. 제시어 (복붙)

| 용도 | 문장 |
|------|------|
| 일반 시작 | `오케스트레이터` + `@plans/orchestrator-method.md` · 「배치표부터」 |
| 명소 재개 | `오케스트레이터` + `명소` + `@plans/2026-07-22-project-log.md` · 「main tip 위 다음 10 hub」 |
| 이관 이어하기 | `오케스트레이터` · 「인수인계서대로 이어서」 + 일지 해당 절 |

---

## 7. 문서 위치

| 문서 | 담는 것 |
|------|---------|
| **본 파일** | 방법론 SSOT |
| [`.cursor/rules/gateo-orchestrator.mdc`](../.cursor/rules/gateo-orchestrator.mdc) | 세션 트리거·짧은 강제 규칙 |
| [`.ai-context.md`](../.ai-context.md) | 스냅샷 1줄 + 링크 |
| [`AGENTS.md`](../AGENTS.md) | 클라우드·로컬 공통 한 줄 |
| 일지 | 배치 완료·건수·다음 제시어만 |
