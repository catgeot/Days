# 2026-08-12 프로젝트 일지

직전: [`2026-08-11-project-log.md`](./2026-08-11-project-log.md)

## 지구본 홈 #4, 아이투타키 투어 오탐

**상태**: feature `cursor/aitutaki-gyg-tour-b09e` · Preview QA 대기  
**세션**: `지구본 홈 #4, 아이투타키 투어 오탐`

- **증상**: 써머리「투어 찾기」아이투타키 → GYG bare `Aitutaki`가 아유타야(·일본 혼입)로 오탐
- **원인**: GYG 아이투타키 재고 없음 · fuzzy가 Ayutthaya로 붙음
- **한 일**: `GYG_ACTIVITIES_Q_BY_SLUG.aitutaki` → `Rarotonga, Cook Islands` · City id `2689` · `smoke:gyg-activities-query` · `/qa/aitutaki-tour`
- **VERIFY**: `npm run smoke:gyg-activities-query` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/aitutaki-tour`
- **Preview**: `https://days-git-cursor-aitutaki-gyg-tour-b09e-catgeots-projects.vercel.app/`
- **작업 로그**: 「아이투타키 투어 찾기 → 아유타야 오탐 보정」
- **남은 일**: 사람 Preview QA(아이투타키→투어 찾기 · 아유타야/일본 없음 · 쿡 제도 투어)
- **다음 채팅명**:

```
지구본 홈 #5, 아이투타키 투어 QA
```
