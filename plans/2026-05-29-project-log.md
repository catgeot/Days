# 2026-05-29 프로젝트 일지 — MOONi §2.12·dock UX

**직전**: [`2026-05-27-project-log.md`](2026-05-27-project-log.md) · **맥락**: [`.ai-context.md`](../.ai-context.md)

---

- **§2.11 S8-1** (선행 `23de3e7`+): 2단 L1/L2 · Trip 라벨 · §2.11.1 출발 직접입력·`DEPARTURE_HUB_SLUGS`.
- **§2.12**: `resolveDepartureIataFromChat` — `rentalAirportHubs` aliases · `에서`/`from` 출발 구간 · 현재 턴 우선 · Trip `dAirportCode`·칩 라벨 — **gili-meno QA Pass**.
- **§2.11.3**: MOONi dock — **모바일** 칩·입력 7:3 · L1 `mobileLabel` 단축 · 헤더 📋 플래너 · L2 prompt 제거·주제 바꾸기 pill · **데스크톱** dock+전폭 입력 유지. §2.11.2 입력 숨김 **폐기**.
- **커밋·푸시**: 본 세션 변경 main 반영 · **releaseNotes** `2026-05-29` 합의 반영.
- **UX (본 세션)**: **ChatModal** — 주제 바꾸기 텍스트 링크·플래너 CTA 강조·모바일 `100dvh`/safe-area·입력 확대·부제 숨김·**닫기 좌측** 원형 버튼. **SiteUpdateBanner** — 모바일 헤더 하단 전폭 앵커(검색바 200px 제한 해소). releaseNotes **생략**(디자인·사용성).
- **MOONi 모델 티어**: `mooniChatModel.js` — 본문 `3.1-flash-lite` · intro·PLANNER·예약/교통 intent `2.5-flash`. 턴별 stateless 라우팅.
- **fix(mooni)**: 장소카드 bound — `resolveDestinationFromChat` 히스토리 출발지(서울) 재스캔 차단 · `placeBound` 우선 `destForPrompt` · 「이곳」 혼동 프롬프트.
- **다음**: MOONi dock·CTA **세부 조정** · (합의 시) gateo §10-F/G9 · releaseNotes 합의 후.
