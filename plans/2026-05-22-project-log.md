# 2026-05-22 프로젝트 일지 — 홈 Mapbox 글로브 모바일 배포 수정

**직전**: [`2026-05-21-project-log.md`](2026-05-21-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md)

---

## 배경

gateo.kr 모바일 홈에서 Mapbox가 아닌 **legacy 지구본**(`react-globe.gl`, blue-marble 텍스처)이 로드됨. 데스크톱은 Mapbox 정상.

---

## 원인

배포 번들(`index-CTrugvuC.js`)의 `HomeGlobeAdapter`가 **모바일 User-Agent에서 무조건 `legacy`**를 선택하는 구버전 로직이었음.

```javascript
// 배포된 문제 코드 (PROD/DEV 구분 없음)
if (/android|iphone|ipad|ipod|mobile/i.test(ua)) return 'legacy';
```

`4586c17`(2026-05-08)에서 `import.meta.env.PROD`일 때 Mapbox 우선으로 수정됐으나, **프로덕션 번들에는 반영되지 않은 상태**였음. Mapbox 토큰(`VITE_MAPBOX_TOKEN`)은 빌드에 포함되어 있었음.

---

## 변경 (`a7e4eef`, gateo.kr 배포·모바일 QA 통과)

| 파일 | 내용 |
|------|------|
| `resolveHomeGlobeEngine.js` | 엔진 선택 분리 — **PROD + 토큰 있음 → 항상 mapbox**, DEV 모바일만 legacy |
| `HomeGlobeAdapter.jsx` | 위 resolver 사용 |
| `scripts/verify-globe-engine-build.mjs` | `npm run build` 후 프로덕션 번들에 모바일 legacy 분기 잔존 시 **빌드 실패** |
| `package.json` | build 스크립트에 검증 연결 |

로컬 프로덕션 빌드: `useMemo(()=>Cl({mapboxToken:...}))` → `return t?i?"mapbox":...` (PROD-first).

---

## QA (모바일)

- gateo.kr 홈 — Mapbox 위성 지구본 · 우측 상단 공유/GPS/우주 복귀 버튼 확인 완료.

---

## 운영 메모

- **DEV 모바일 → legacy**는 유지 (LAN QA 시 Mapbox 토큰 URL 제한 403/CORS). 배포 경로만 Mapbox.
- 재발 방지: `npm run build` 시 `[verify-globe-engine] OK` 필수.
