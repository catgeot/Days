# 2026-07-31 프로젝트 일지

직전: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)

## 범지구적 퍼즐 — MVP 제품 합의 · 구현 준비

**상태**: 기획 합의 ✅ · 코드 미착수였음 → **아래 MVP 구현으로 이어짐**

| | |
|--|--|
| 루프 | 권역(면)→나라 선택 → 지구본 **찾기 탭(B)** → **수도 4지선다** → 도장·재도전 |
| 힌트 | A(포커스/하이라이트)는 **힌트 전용** · 별 **−1** · 만점 3 · 하한 1 · 오답 패널티 합쳐 최대 −1 |
| 메뉴 | 기존 지구본 면·나라 UI 재사용 · 테마 필터로 스테이지 나누지 않음 |
| 후속 | 세부 지명(도시/명소)은 나라 클리어 후 해금 슬롯 |
| 핸드오프 | [`global-puzzle-mvp-plan.md`](./global-puzzle-mvp-plan.md) · 제시어 `범지구적퍼즐-이어하기` |

## 범지구적 퍼즐 — MVP 구현 (홈 모드 → `/play/geo` 전용으로 피벗)

**상태**: tip · Preview QA 대기 · 완료 단정 금지

| | |
|--|--|
| 피드백 | 홈 모드로는 전환 인지 어려움 · 지명/장소카드 간섭 · 홈 로직 얽힘 위험 |
| 아키텍처 | 이전 `/play/geo` **전용 글로브**(라벨 숨김) 유지 · 합의 루프(찾기B+수도)로 플레이 |
| 진입 | 홈 `Link` → `/play/geo` 만 (모드 토글·HomeGlobeMapbox 가드 **제거**) |
| 루프 | 권역→나라(시드) → 찾기(B) → 수도 4지선다 → 별·재도전 |
| VERIFY | `npm run smoke:global-puzzle` · `npm run build` |
| 플랜 | [`global-puzzle-mvp-plan.md`](./global-puzzle-mvp-plan.md) §0 아키텍처 확정 |

**QA (Preview)**: `/play/geo` — 지명 없음 · 장소카드 없음 · 미리 포커스 없음 · 힌트 별≤2 · 홈 회귀

**브랜치**: `cursor/global-puzzle-mvp-2177` · tip `e79b082` · PR [#40](https://github.com/catgeot/Days/pull/40)
