# 2026-05-09 Project Log

이전 일지: [`plans/2026-05-08-project-log.md`](./2026-05-08-project-log.md)

## `/explore` 탐색 검색·최근 기록 UX

- `SearchDiscoveryModal`: 로컬 스토리지에 최근 검색어·최근 방문지·키워드별 방문 기록(`gateo_recent_*`)을 저장하고, 대표 섹션 버튼·칩으로 재검색·삭제(X)를 지원.
- `useHomeHandlers`의 `handleSmartSearch`가 최종 선택 장소를 반환하도록 하고, `Home`의 탐색 `onSearch`에서 검색 키워드와 매칭된 방문지를 키워드 방문 기록에 누적해 감성 검색 후에도 방문 이력이 남도록 함.
- 안내문·섹션과 겹치지 않도록 패널 열림 시 안내문 숨김·섹션과 검색 드롭 분리 등 가독성 조정.
- 구글 검색창에 가깝게: 검색줄·섹션 목록은 **`position: fixed`** 오버레이 + 백드롭으로 본문 레이아웃을 밀지 않고 표시, 검색줄은 `mousedown`으로 최근 검색 패널 토글, 스크롤·리사이즈 시 앵커 재측정.

## `/explore` 검색 popover 비차단화 + 모바일 안정화 (보강)

직전 세션에서 만든 popover가 다크 백드롭으로 본문(필터 탭·큐레이션·그리드)을 가리던 문제와, 검색바 클릭 시 칩 행이 사라지던 동작을 구글 검색창 형태에 맞춰 정리.

- **다크 백드롭 제거**: `fixed inset-0 z-[205] bg-black/45 backdrop-blur-[1px]` 오버레이를 통째로 제거. 헤더의 `isSearchPopoverOpen ? 'z-[220]' : 'z-20'` 임시 승격도 함께 정리. 외부 클릭으로 popover 닫기는 기존 `useEffect` 안의 `handlePointerDown`(mousedown/touchstart)이 그대로 처리하므로 회귀 없음.
- **popover 배경 불투명화**: `bg-[#0f1625]/98` / `bg-[#0f1625]/95` → `bg-[#0f1625] backdrop-blur-xl`. 알파를 제거하고 강한 backdrop-blur를 더해 popover 카드와 본문 여행지 카드 사이의 시각적 간섭을 완전히 차단.
- **칩 버튼 행 항상 노출**: `{!isSearchHistoryOpen && ...}` 가드를 풀어, 검색바 클릭 후에도 "최근 검색어 / 최근 방문지 / 키워드 방문 기록" 칩이 그대로 보이고 다른 섹션으로 즉시 전환 가능. 칩과 popover가 겹치지 않도록 search history popover의 anchor를 `Math.max(searchBarRow.bottom, chipRow.bottom)` 기준으로 조정.
- **모바일 안정화 (`useLayoutEffect`)**:
  - `window.visualViewport` 우선 사용(`getViewportSize()`)으로 iOS Safari 키보드가 올라온 상황에서도 popover `maxHeight`/`width`가 키보드 뒤편으로 잘리지 않도록 시각 viewport 기준으로 계산. `offsetTop`도 보정해 핀치 줌 케이스 대응.
  - `visualViewport.resize`/`scroll` 리스너 추가로 키보드 토글·회전·핀치 줌 시 popover가 즉시 따라 움직임.
  - `isAnchorOnScreen()` 가드로 헤더 anchor가 viewport 밖으로 완전히 스크롤되면 popover를 자동 닫아 화면 위쪽에 어색하게 잘려 떠 있는 상태 방지.
  - `useLayoutEffect` 의존성에 `recentVisitedDestinations.length`, `keywordVisitHistory.length` 추가해 칩 가시성 변동 시 위치 재계산.

## 로컬 모바일 테스트용 IP 고정 시도 (보류)

배경: `vite.config.js`의 `server.host: '0.0.0.0'`로 모든 어댑터에 바인딩되어 매 dev 시작 시 NordVPN(NordLynx 100.x.x.x)·WSL(172.22.208.1)·Wi-Fi(192.168.219.x) URL이 함께 표시됨. Wi-Fi DHCP가 매번 다른 IP를 할당해 모바일 QR 접속이 불안정.

- 진단: 현재 Wi-Fi `192.168.219.106`. 사용자는 직전 세션들에서 .103/.104일 때는 모바일 접속이 잘 되었으나 .106에서는 실패. 활성 NordVPN 터널의 split tunneling이 특정 LAN IP의 인바운드를 간섭할 가능성이 가장 유력.
- 시도: 정적 IP를 PowerShell `netsh interface ip set address name="Wi-Fi" static 192.168.219.104 ...`로 시도 → IP 명령만 실행하면 DNS가 함께 깨져 컴퓨터 자체의 인터넷이 끊기는 위험을 확인. `netsh interface ip set address name="Wi-Fi" dhcp`로 즉시 원복해 복구.
- **결정 (이번 세션)**: 로컬 IP 고정은 보류. Vite 설정은 그대로 두고, 모바일 검증은 **배포 환경에서 수행**.
- 다음에 다시 시도하려면: (a) DNS 명령(`netsh interface ip set dns name="Wi-Fi" static <DNS>`)을 IP 명령과 **반드시 같이** 실행하거나, (b) Windows 설정 GUI(설정 → 네트워크 → Wi-Fi → IP 할당 편집 → 수동)에서 IP·게이트웨이·DNS를 함께 채우거나, (c) 공유기 DHCP 예약(MAC `D2-1D-1C-70-63-41` → `192.168.219.104`)으로 라우터 측에서 고정. NordVPN을 잠시 끄고 .106에서도 모바일 접속이 되는지 먼저 분리 테스트하는 것이 우선.
