# 2026-08-17 프로젝트 일지

직전: [`2026-08-16-project-log.md`](./2026-08-16-project-log.md)

## 큐레이션 Android Chrome 전체 지도 보기 검은 화면

**상태**: `cursor/curation-globe-android-0ba2` · PR 대기  
**증상**: `/blog/curation` → 「전체 지도에서 보기」→ Android Chrome 검은 화면·먹통

- **원인**: 큐레이션→홈 remount 시 Mapbox 준비 전 flyTo 유실·중복 flyTo·스크롤 viewport 잔류
- **한 일**: `flyToAndPin` pending focus · onLoad/mapReady flush · `gateo_reset_viewport` · 중복 moveTo 제거
- **VERIFY**: `npm run build` · `smoke-curation-place-bridge` PASS
