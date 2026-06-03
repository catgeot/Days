# 2026-06-03 프로젝트 일지 — 3D 투어 좌표·템플릿 1차

**직전**: [`2026-06-02-project-log.md`](2026-06-02-project-log.md) · **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md)

---

## 제품 결정

- **3D 투어 버튼**: 유효 좌표가 있으면 **전 여행지·신규/숨은 지명** 노출 유지 — 플래너·로컬 왓슨·DB·위키 파이프라인과 연동.
- **젠/시네마(홈 UI 숨김)**: 보류 — 홈 UI 유지하며 투어.
- **시각 품질**: 도심보다 **대자연·해안·알프스** 선회가 유리 (체르마트·사파 등 QA 반영).

## 구현

- `globeTourResolve.js` — `globeLandmarks` 우선 · 없으면 `primaryCategory` → `coastalOrbit` / `mountainOrbit` / `cityOrbit` · 알프스 slug/키워드 → `alpineVillageOrbit`.
- `globeLandmarks.json` — 자연/휴양 12 slug 추가 (칸쿤·사파·푸켓·몰디브·밴프·우유니·EBC·퀸스타운·아이슬란드·파타고니아·하롱·보라카이·보라보라 등).
- `globeTourEngine.js` · `globeTourUi.js` · 계획·`.ai-context` · `travel-spots-management` 갱신.

## QA (사용자 확인)

- **칸쿤·사파·흐바르** 등: 도심 중심 → **해변·산맥(계곡)** 포커스로 변경됨 확인.
- 흐바르(`hvar`): `globeLandmarks` 미등록 — category 폴백(`paradise` → `coastalOrbit`) 효과로 개선된 것으로 추정 → 1e에서 전용 center 등록 권장.

## 다음 세션 (Phase 1e~1h)

→ [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md) **「다음 세션 제시어」** 참조.
