# 2026-08-13 프로젝트 일지

직전: [`2026-08-12-project-log.md`](./2026-08-12-project-log.md)

## 해안해양 탐색 #1, 플랜

**상태**: 플랜만 · feature `cursor/coast-sea-plan-8c05`  
**세션**: `해안해양 탐색 #1, 플랜`

- **요청**: 5 테마 칩에 해안·해양 별칭 · 에게해·산호해 등 주변해로 숨은 섬 탐색 가능 여부
- **조사**: spots 273 · sea 필드 **0** · paradise 53 · 휴리스틱 해안 ~132 · 에게해 desc 2 · 산호해 고유명 ≈0
- **결론**: 6번째 대분류 금지(5면 충돌) · **해역 2차 칩+필드(`seaIds`/`coastKind`)** 권장 · [`coast-sea-explore-plan.md`](./coast-sea-explore-plan.md)
- **다음 채팅명**:

```
해안해양 탐색 #2, 해역 SSOT 시드
```

## 지구본 홈 #13, Chrome 칩 히트 어긋남

**상태**: `main` 반영 예정 · feature `cursor/chrome-hit-6294`  
**세션**: `지구본 홈 #13, Chrome 칩 히트 어긋남`

- **증상**: Chrome만 — 첫 진입 칩 OK → 1턴 후 「한국의 명승」클릭이 큐레이션(`/blog/curation`)으로 이동 · 큐레이션 버튼도 이상
- **원인**: `#12`에서 넣은 `translate3d`+`isolate` 합성 레이어가 URL바/viewport sync 후 **paint와 hit 박스가 한 줄만큼 어긋남**
- **수정**: 레이어 승격 제거 · 로고 hover scale 제거 · 검색 열 hit 축소 · `/qa/chrome-hit`→PROD
- **VERIFY**: `npm run build`
- **PROD QA**: `https://www.gateo.kr/` — Chrome에서 1턴 후 명승·큐레이션 각각 올바른 경로
- **다음 채팅명**:

```
지구본 홈 #14, Chrome 칩 QA
```

## 지구본 홈 #12, Chrome 클릭 관통·장소카드 갇힘

**상태**: `main` 반영 · PR [#116](https://github.com/catgeot/Days/pull/116) · tip `ae00ee74` / 히트실드 `643d912b`  
**세션**: `지구본 홈 #12, Chrome 클릭 관통·장소카드 갇힘`

- **증상**: Chrome에서 AI 큐레이션 칩 클릭이 아래(지도)로 뚫림 → 써머리 오픈 → X가 확장으로 오인 → `/place` 갇힘·explore 루프
- **한 일**: 홈 칩 레이어 `isolate`/`translateZ(0)`·불투명 보강 · 써머리 X 타깃 확대 · `/place` X는 홈+써머리 재오픈 skip · expand param 가드 · **후속**: Chrome 전용 불투명 히트 실드·칩 `backdrop-blur` 제거 (Safari/네이버/구글앱은 정상·Chrome만 재현 확인)
- **VERIFY**: `npm run build`
- **PROD 테스트**: `https://www.gateo.kr/` — Chrome에서 AI 큐레이션 칩·써머리 X
- **다음 채팅명**:

```
지구본 홈 #13, Chrome 클릭 QA
```
