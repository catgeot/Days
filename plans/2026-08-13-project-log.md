# 2026-08-13 프로젝트 일지

직전: [`2026-08-12-project-log.md`](./2026-08-12-project-log.md)

## 지구본 홈 #12, Chrome 클릭 관통·장소카드 갇힘

**상태**: `main` 반영 · PR [#116](https://github.com/catgeot/Days/pull/116) · tip `ae00ee74`  
**세션**: `지구본 홈 #12, Chrome 클릭 관통·장소카드 갇힘`

- **증상**: Chrome에서 AI 큐레이션 칩 클릭이 아래(지도)로 뚫림 → 써머리 오픈 → X가 확장으로 오인 → `/place` 갇힘·explore 루프
- **한 일**: 홈 칩 레이어 `isolate`/`translateZ(0)`·불투명 보강 · 써머리 X 타깃 확대 · `/place` X는 홈+써머리 재오픈 skip · expand param 가드 · **후속**: Chrome 전용 불투명 히트 실드·칩 `backdrop-blur` 제거 (Safari/네이버/구글앱은 정상·Chrome만 재현 확인)
- **VERIFY**: `npm run build`
- **PROD 테스트**: `https://www.gateo.kr/` — Chrome에서 AI 큐레이션 칩·써머리 X
- **다음 채팅명**:

```
지구본 홈 #13, Chrome 클릭 QA
```
