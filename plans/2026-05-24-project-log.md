# 2026-05-24 프로젝트 일지 — 홈 GATEO 이미지 로고

**직전**: [`2026-05-22-project-log.md`](2026-05-22-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md)

---

- 홈 헤더·LogoPanel 텍스트 로고(`GATE.0`) → **`src/assets/gateo_logo1.png`** (Blue Glow) 이미지 로고로 교체. 크기 헤더 `h-11/md:h-14`, 패널 `scale-75` 제거.
- 3종 후보 dev 비교 후 1번 확정 · 선택 UI·`logoVariants` 임시 코드 제거.
- Cursor Rule [`.cursor/rules/gateo-project-context.mdc`](../.cursor/rules/gateo-project-context.mdc) (`alwaysApply`) — `@` 없이 `.ai-context.md` Read 동작 QA 확인.
- **홈 상단 릴리스/업데이트 공지 배너**: 다크 글래스모피즘 팝업 형태, 닫기/다시보지않기. 배포 감지(`version.json` 폴링) 및 릴리스 노트(`releaseNotes.js`) 연동.
