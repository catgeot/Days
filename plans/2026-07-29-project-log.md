# 2026-07-29 프로젝트 일지

직전: [`2026-07-28-project-log.md`](./2026-07-28-project-log.md)

## 범지구적 퍼즐 — 실루엣 매칭 · 모바일 우선

**상태**: Preview QA

| | |
|--|--|
| 피드백 | 이름만 드롭 → **나라 필(실루엣) 매칭** · **모바일 중심** 레이아웃 · 카테고리/칩 미표시 수정 |
| 변경 | `geoPuzzleSilhouettes` · 하단 고정 트레이(flex+dvh) · 빈 칸 슬롯 윤곽 · 드래그 고스트=실루엣(정답 위치 스포일러 제거) |
| Vercel | `dec1279` FAIL — `Could not resolve "../data/geoPuzzleSilhouettes.js"` · `6e4cff1`로 `./data` 수정 · Preview 미기동 → empty commit 재배포 |
| 검증 | `npm run audit:geo-puzzle` PASS · 로컬 `npm run build` PASS |

**다음**: Preview 모바일 QA · PC 확장은 후속

## 지구본 지리 퍼즐 게임 — 기획·유사작 조사

**상태**: Phase 0 ✅ · Phase 1 MVP 구현 (Preview QA)

| | |
|--|--|
| 평가 | 방법1 방향 OK · **드래그 스냅 MVP** (사람 결정) |
| Phase 0 | 감점·종료없음 · 공식 대륙명 · `/play/geo` · 축제 아래 진입 · 이름「범지구적 퍼즐」· 대양/여행 CTA 후속 |
| 권장 이유(탭) | 3D 드롭 오차·소국·제스처 충돌·모바일 — 기록만, MVP는 드래그 |
| 문서 | [`geography-puzzle-game-plan.md`](./geography-puzzle-game-plan.md) |
| MVP | `PlayGeo` · 아시아(동아 6)→남아메리카→오세아니아 · `audit:geo-puzzle` PASS |

**다음**: Preview QA(드래그 히트·감점·진입) · 대양은 Phase 1.5

## 지구본 나라 카탈로그 — UN 누락 채움 · 「전체」중분류 철회

**상태**: ✅ `main` 머지·푸시 · Production 배포

| | |
|--|--|
| 오해 정정 | 「전체」칩·면 전체 일괄 표시가 아님 · **누락 국가 채움** + 중분류 배타 |
| 카탈로그 | 114 → **219** (UN 회원+VA/PS/XK · 기존 하와이·영국 구성국 등 유지) |
| 중분류 | 「전체」제거 · 잔여는「기타」흡수 · 문화/모험 소권역 추가 · 중동→휴양 시드 |
| 파일 | `globeCountryCatalog.js` · `globeFaceRegions.js` · `globeFaceSubregions.js` · `scripts/generate-globe-country-catalog-fill.mjs` |

**VERIFY**: UN missing 0 · 면 합=219 · 중분류 중복0·커버100% · 기본≠all · `smoke:place-label-slug` OK

**tip**: `9bb80b5` (merge) · PR [#30](https://github.com/catgeot/Days/pull/30) MERGED · Vercel Production OK

## 국내축제 — 홈페이지 CTA 복구 (Edge 재배포 · 파서)

**상태**: ✅ Edge 재배포 + 파서 수정 · LIVE 검증

| | |
|--|--|
| 원인 | PROD Edge가 `detailCommon.homepage` 미전달 · 본문형 URL(`공식 홈페이지 https://…`) 파서 실패 |
| 조치 | `tourapi-proxy` 재배포 · `normalizeHomepage`가 본문·HTML·plain URL 추출 |
| VERIFY | 세미원·나오라쇼·동강·더위사냥·대관령 → CTA URL OK · 썸머워터는 TourAPI `homepage` 공백(데이터 한계) · `smoke:tourapi` LIVE PASS |

## 국내축제 — 상세 1단계 (갤러리·개요·홈페이지 · PC 분할)

**상태**: ✅ 사람 QA 후 `main` 커밋

| | |
|--|--|
| 시트 | `detailCommon` 개요 · `detailImage` 갤러리 · 공식 홈페이지 CTA · X/닫기 · 확대보기 |
| PC | 좌사진·우글 · 축제홈 폭(`xl:max-w-7xl`)·거의 전체 높이 |
| 복귀 | 인근 hub → `/place` 후 ←/닫기 시 `/korea` (`placeReturnTo`) |
| 다음 | 동영상·기사 등 읽을거리 2단계 |

**VERIFY**: 사람 QA(갤러리·개요·홈페이지·크기·복귀·확대)

## 국내축제 — 테마 칩 1건 노출 · 홈 바탕 완료 · 다음=상세 리치

**상태**: ✅ 사람 QA 후 `main` 커밋·푸시 (`9c58066` · docs `ad2b078`)

| | |
|--|--|
| 테마 | `festivalTasteTags` `MIN_COUNT` 2→1 · 제목 매칭 1건부터 칩 |
| 홈 바탕 | 사람 판정 **완료** (시간·지역·테마·검색·지도·내 주변) |
| 다음 | 단발 `FestivalDetailSheet` → **읽을거리·볼거리** (사진 갤러리·홈페이지·동영상·기사 등). 현재는 `detailIntro`+썸네일 1장·홈페이지 링크만 |

**VERIFY**: 사람 QA(1건 테마 칩)

**tip**: `9c58066`

## 국내축제 지도 — 한글 지명 · 지역칩=포커스 · 전체화면

**상태**: ✅ 사람 QA 후 `main` 커밋·푸시

| | |
|--|--|
| 지명 | Mapbox `setLanguage('ko')` + LanguageControl |
| 마커 | 지역 칩으로 숨기지 않음(시간·테마·검색만) · 전국 유지 |
| 카메라 | 시도/시군구 칩 → bbox `fitBounds` · 전국 → overview |
| 전체화면 | PC「전체」= 모바일과 동일 몰입 ·「축소」= 분할 |
| 칩 스크롤 | 모바일 가로칩: 하단 스크롤 트랙만(넘칠 때만) |
| 내 주변 | 단발 버튼 · 지도 오픈 시 near bbox 포커스 재적용 |

**VERIFY**: 사람 QA(지명·포커스·몰입·칩 트랙·내 주변→지도)

**tip**: `1fc2454`

**다음**: 필요 시 Edge `tourapi-proxy` · 추가 UX는 새 세션

## 홈 MOONi FAB — 모바일 드래그·말풍선 (QA · push)

**상태**: ✅ 사람 확인 후 `main` 커밋·푸시

| | |
|--|--|
| 드래그 | 좌·하단 오버플로 완화 · 우측은 끝 밀착(`right: 0`) · 말풍선 제외 클램프 |
| 말풍선 | FAB 좌측 여유 부족 시 오른쪽으로 반전 |

**VERIFY**: 사람 QA(좌·우·하단 이동 · 말풍선 가독)

## 홈 모바일 — 로그인·로그북·검색바 배치 (QA · push)

**상태**: ✅ 사람 확인 후 `main` 커밋·푸시

| | |
|--|--|
| 하단 | 모바일에서 로그인·로그북 숨김(테마 카테고리 겹침 제거) · PC 하단 유지 |
| 로그북 | 모바일 우측 상단 툴바: 공유 → 로그북 → 위치 → 지구본 |
| 검색바 | 모바일 우측 끝 고정 · PC 변경 없음 |

**VERIFY**: 사람 QA(모바일 겹침·검색바 위치)

## 국내축제 — 세션 종료 (QA 반영 · push)

**상태**: ✅ `main` push · 리스트 우선 QA 반영 · **사람 확인 후 커밋·푸시**

| | |
|--|--|
| 헤더 | 대분류 칩 선택 라벨 유지 · 2행 · 지도 시 공통 헤더·칩 유지 |
| PC | `lg:max-w-6xl` / `xl:max-w-7xl` · 지도 시 리스트\|지도 분할 |
| 위치 | 허용 후 힌트 재노출 방지(`sessionStorage`) · 권한 시 재진입 재적용 |
| 내 주변 | 반경 리스트·좌측 칩 동일 그룹·건수 · 지역 구분 유지 · 거리순(+km) |

**VERIFY**: 사람 QA(리스트·지도·위치·내 주변 칩/건수)

**다음**: 필요 시 Edge `tourapi-proxy` · 추가 UX는 새 세션

## 국내축제 — 헤더·본문 UX 조율 (QA · push)

**상태**: ✅ 사람 확인 후 `main` 커밋·푸시

| | |
|--|--|
| 헤더 | 제목「한국의 축제」·상단 지도/`n건` 제거 ·「홈으로」우측 · 내 주변을 칩 줄 우측 분리 |
| 본문 | 모달형 리스트 X 제거 · 모바일 `main` 전체 스크롤 · 우하단「위로」FAB |
| PC | 동일 헤더 배치 · 리스트 내부 스크롤 유지 |

**VERIFY**: 사람 QA(헤더·내 주변·모바일 스크롤·위로)

## 국내축제 — 지도·리스트 UX (QA · push)

**상태**: ✅ 사람 확인 후 `main` 커밋·푸시

| | |
|--|--|
| 모바일 칩 | 리스트 상단 구분(시군구)만 · 인근·테마 제외 · 하단 스크롤 여유 |
| 지도 | 모바일 전체화면+글라스 헤더(닫기·대분류) · PC 분할·리스트 동기화 |
| 마커 | 시간·지역·테마·검색·내 주변 반영 · 클러스터: 모바일 확대만·PC 리스트 반영 |
| 내 주변 | 자동 GPS는 시도만 · 토글은 사용자 클릭 시 ON |
| 상위 복귀 | 리스트 기존 시도 복귀 유지 · 전국/지도헤더 상위 버튼 없음 |

**VERIFY**: 사람 QA(지도 몰입·칩·내 주변 1클릭·상위 복귀)

## 국내축제 — 검색·전국 기본·계절칩·내주변 (QA · push)

**상태**: ✅ 사람 QA 후 `main` 커밋·푸시

| | |
|--|--|
| 기본 | `DEFAULT_AREA_CODE=all` · 자동 GPS는 지역 칩 덮지 않음 ·「내 주변」만 위치 적용 |
| 검색 | PC 상시 검색바 · 모바일 16px·엔터 확정 · 전국 `title`/`addr1` · 지역칩 변경 시 해제 |
| 시간 | 현재 계절부터 여름·가을·겨울·봄 |
| 내 주변 | 시간·테마는 반경 유지·재계산 · 지역 칩만 해제 |

**VERIFY**: 사람 QA(전국 기본·검색·계절·내주변+시간)

**tip**: `a492a1a` (검색 선행 `52ea626`)
