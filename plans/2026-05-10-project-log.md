# 2026-05-10 Project Log

이전 일지: [`plans/2026-05-09-project-log.md`](./2026-05-09-project-log.md)

## 플래너 · 스마트 링크

- **필수 앱(`type === 'apps'`)**: `CopyableText`에서 구글 검색어 끝에 **` APP`** 접미사(이미 `…app`으로 끝나면 생략)로 앱스토어/플레이 상위 노출을 기대. `connectivity`는 기존처럼 키워드만 사용.

## Klook 배너(명소 · 공항 픽업 렌터카)

- **명소** `KlookTourBannerWidget`: IAB **468×60**, 카드 폭에 맞춘 스케일 + `ResizeObserver`, 확대 상한 완화.
- **렌터카** `KlookCarBannerWidget`: 동일 레이아웃·상수 패턴으로 통일.

## 지도 및 명소 · Klook 레스토랑 링크

- `locationRules.js`: `DINING_KLOOK_PRIORITY_KEYS`에서 **`인도네시아`/`indonesia` 전체 매칭 제거**(보로부두르 등 자바권 오탐 방지). 발리·자카르타 및 소도시 키워드(우붓·쿠타 등)는 유지.
- `DINING_KLOOK_UNSUPPORTED_KEYS`에 **보로부두르·프람바난·요그야카르타·마겔랑** 등 자바 관광권 키워드 추가.
- `utils.js` `map_poi` 분기는 기존 로직 유지; 위 규칙으로 Klook 다이닝 노출이 줄어들고 미매칭 시 **구글 맵 근처 레스토랑**으로 폴백.

## 유심 파트 · Airalo / Holafly

- 에셋: **`src/assets/Airalo.svg`**, **`src/assets/Holafly.png`** 번들 import(Vite 해시 출력). `public` 구 이미지 URL 의존 제거.
- **배너 UI**: 상단 고정 바(상호명 + **eSIM** 뱃지 + 제휴광고), 이미지 단독 영역, 하단 한 줄 특징 문구. 테두리 대비(`border`/`ring`) 및 호버 보강.
- **유심 그룹**: `PlannerTab`에서 `ToolkitCard`(connectivity)와 두 배너를 **단일 래퍼**(연한 블루 테두리·그라데이션)로 묶음. `ToolkitCard`에 **`className`** prop 추가로 내부 카드 이중 테두리 완화.

## 기타

- `ToolkitCard` 루트 `className` 병합 시 `.trim()`으로 공백 정리.
