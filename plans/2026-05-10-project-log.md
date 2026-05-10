# 2026-05-10 Project Log

이전 일지: [`plans/2026-05-09-project-log.md`](./2026-05-09-project-log.md)

## 플래너 · 스마트 링크

- **필수 앱(`type === 'apps'`)**: `CopyableText`에서 구글 검색어 끝에 **` APP`** 접미사(이미 `…app`으로 끝나면 생략)로 앱스토어/플레이 상위 노출을 기대. `connectivity`는 기존처럼 키워드만 사용.

## 지도 및 명소 · Klook 레스토랑 링크

- `locationRules.js`: `DINING_KLOOK_PRIORITY_KEYS`에서 **`인도네시아`/`indonesia` 전체 매칭 제거**(보로부두르 등 자바권 오탐 방지). 발리·자카르타 및 소도시 키워드(우붓·쿠타 등)는 유지.
- `DINING_KLOOK_UNSUPPORTED_KEYS`에 **보로부두르·프람바난·요그야카르타·마겔랑** 등 자바 관광권 키워드 추가.
- `utils.js` `map_poi` 분기는 기존 로직 유지; 위 규칙으로 Klook 다이닝 노출이 줄어들고 미매칭 시 **구글 맵 근처 레스토랑**으로 폴백.

## 유심 파트 · Airalo / Holafly

- 에셋: **`src/assets/Airalo.svg`**, **`src/assets/Holafly.png`** 번들 import(Vite 해시 출력). `public` 구 이미지 URL 의존 제거.
- **배너 UI**: 상단 고정 바(상호명 + **eSIM** 뱃지 + 제휴광고), 이미지 단독 영역, 하단 한 줄 특징 문구. 테두리 대비(`border`/`ring`) 및 호버 보강.
- **유심 그룹**: `PlannerTab`에서 `ToolkitCard`(connectivity)와 두 배너를 **단일 래퍼**(연한 블루 테두리·그라데이션)로 묶음. `ToolkitCard`에 **`className`** prop 추가로 내부 카드 이중 테두리 완화.

## Klook 배너(명소 투어 · 공항 렌터카) 반응형·광고 단위

- **`klookBannerLayout.js`**: `computeKlookBannerLayout`에서 최소 높이 스케일이 카드 폭을 넘기던 버그 수정(모바일 좌우 잘림 방지). 데스크톱 468×60 / 투어 모바일 300×250 / 렌터카 모바일 250×250 상수·브레이크포인트(767px) 정리.
- **`useKlookPlannerBannerDimensions.js`**: 슬롯 `tour` | `car`로 뷰포트별 배너 크기 전환.
- **`KlookTourBannerWidget`**: 모바일 `data-adid=1273972`, 데스크톱 `1272015`; `data-bgtype=Play`. 크기 변경 시 위젯 스크립트 재로드·스케일 래퍼 `key`.
- **`KlookCarBannerWidget`**: 모바일 250×250에 `data-adid=1273974`, 데스크톱 `1265731`; `data-bgtype`은 항상 `Car`. 동일하게 크기 전환 시 재초기화.

## 플래너 · 맨 위로 스크롤

- **`PlannerTab.jsx`**: 툴킷 스크롤 컨테이너 기준 `scrollTop > 280`일 때 고정 버튼(↑ + 「맨 위」)·`smooth` 스크롤. 탭 비활성·로딩·툴킷 없을 때 숨김.

## 교통 · Bounce 짐 보관 배너

- **`utils.js`**: `transport`의 Bounce 링크에 `bannerSrc`(데스크톱 **`src/assets/bounce_278x90.png`**, 278×90) + `bannerSrcMobile`(**`bounce.png`**, 300×250).
- **`ToolkitCard.jsx`**: `bannerSrcMobile`이 있으면 `<picture>` + `(min-width: 768px)`로 데스크톱/모바일 에셋 분기.

## 명소 투어 클릭 URL(참고)

- `ToolkitCard` → `KlookTourBannerWidget`에 `getKlookAffiliateUrl`(검색 `여행지명 + 투어`) 딥링크를 `targetUrl`로 전달; 모바일 오버레이도 동일 URL(`_self`만 차이). 클룩 페이지 상단 추천 상품은 플랫폼 측 노출.

## 기타

- `ToolkitCard` 루트 `className` 병합 시 `.trim()`으로 공백 정리.
