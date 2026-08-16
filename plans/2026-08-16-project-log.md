# 2026-08-16 프로젝트 일지

직전: [`2026-08-13-project-log.md`](./2026-08-13-project-log.md)

## 해안해양 탐색 #4, 나라바다 토글

**상태**: feature `cursor/coast-sea-plan-8c05` · PR [#118](https://github.com/catgeot/Days/pull/118)  
**세션**: `해안해양 탐색 #4, 나라바다 토글`

- **한 일**: `main` merge · 나라 레일 `나라|바다` 토글 · 뷰포트 근처 해역 3~8 칩 · 선택 시 fitBounds+bbox fill · 해역 핀 필터 · 모바일 토글 하단 레일(세부 메뉴 위) · `smoke:sea-basin-rail` PASS · build OK
- **QA**: Preview — 5면 카테고리 → 바다 토글 → 에게해 등 칩 · 지도 하이라이트·핀

## 해안해양 탐색 #3, 검색 별칭

**상태**: feature `cursor/coast-sea-plan-8c05` · PR [#118](https://github.com/catgeot/Days/pull/118)  
**세션**: `해안해양 탐색 #3, 검색 별칭`

- **한 일**: `seaBasinResolve` — 에게해/산호해/멕시코만 등 → coast 스팟 큐레이션 · `useHomeHandlers` 테마 경로 선연결 · `smoke:sea-basin-search` PASS · build OK
- **다음**: Phase 4 UI는 사람 합의 후

```
해안해양 탐색 #4, 나라바다 토글
```

## 해안해양 탐색 #2, 해역 SSOT 시드

**상태**: feature `cursor/coast-sea-plan-8c05` · PR [#118](https://github.com/catgeot/Days/pull/118)  
**세션**: `해안해양 탐색 #2, 해역 SSOT 시드`

- **한 일**: `seaBasins` 33 · `travelSpotCoast` 119 · generate/audit · tier1–2 칩 후보 28(각 ≥2 스팟) · tier3(사르가소·바렌츠·홍해·아라비아·남극해) 라벨만
- **VERIFY**: `npm run audit:sea-basins` PASS
- **UI 없음** (Phase 4 합의 대기)
- **다음 채팅명**:

```
해안해양 탐색 #3, 검색 별칭
```
