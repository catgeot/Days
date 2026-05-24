# 2026-05-24 프로젝트 일지 — 홈 GATEO 이미지 로고

**직전**: [`2026-05-22-project-log.md`](2026-05-22-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md)

---

- 홈 헤더·LogoPanel 텍스트 로고(`GATE.0`) → **`src/assets/gateo_logo1.png`** (Blue Glow) 이미지 로고로 교체. 크기 헤더 `h-11/md:h-14`, 패널 `scale-75` 제거.
- 3종 후보 dev 비교 후 1번 확정 · 선택 UI·`logoVariants` 임시 코드 제거.
- Cursor Rule [`.cursor/rules/gateo-project-context.mdc`](../.cursor/rules/gateo-project-context.mdc) (`alwaysApply`) — `@` 없이 `.ai-context.md` Read 동작 QA 확인.
- **홈 상단 릴리스/업데이트 공지 배너**: 다크 글래스모피즘 팝업 형태, 닫기/다시보지않기. 배포 감지(`version.json` 폴링) 및 릴리스 노트(`releaseNotes.js`) 연동.
- **MOONi AI 에이전트**: `MooniAgentFab.jsx` — 우측 하단 FAB·드래그 이동(`gateo_mooni_fab_pos`)·말풍선(45초 재표시·hover). `ChatModal` MOONi 브랜딩·세션 dest `MOONi`. 에셋 `MOONI_transparent.png`·`MONNI_text.png`. 커밋 `58c66bc`.
- **PlaceCardSummary 시인성 (QA 완료)**: 모바일 `bottom 6.75rem+safe-area` · `isTickerExpanded` 제거 · PC enter→idle 글로우 · 보조 지명 복사 제거.
- **MOONi FAB 말풍선**: intro X 닫기 · 45초 넛지 4.5초 자동 사라짐 · 혼잣말 12종.
- **SiteUpdateBanner**: 검색바 앵커 정렬 · 「시스템 공지」헤더 · 은은한 글로우·테두리 · 헤더 구분선 제거.
- **릴리스 노트·공지 리스트**: `releaseNotes.js` SSOT · FooterModal **Updates** · `ReleaseNotesList` · 공지 팝 「지난 공지 보기」. `.ai-context` **1.7**(합의 후 반영) · MOONi 공지 `2026-05-24-2`.
- **MOONi FAB 카피**: intro `안녕! MOONi예요.` · 호버 넛지 5종 랜덤 · 채팅 모달 첫 메시지는 상세 유지.
