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

## 탐색 모달 배경 톤 (갈색 계열)

- `SearchDiscoveryModal`: 전체 오버레이·헤더·AI 로딩 딤·최근 검색/퀵 섹션 팝오버를 남색 계열(`#0b101a` / `#0f1625`)에서 따뜻한 우드·에스프레소 톤(`#1b1410`, `#261d16`)과 `amber-950` 계열 테두리로 통일해 탐색 UI 분위기만 조정 (카드·탭 포인트 색은 유지).

## 장소카드 모바일 갤러리: 추천·설명 노출

- 배경: PC에서는 `PlaceChatPanel` 본문에 `GalleryInfoView`가 있으나 `hidden md:flex`라 모바일에서 감성 검색으로 들어온 `desc`(추천 연결 문구)·키워드·사진 캡션을 읽기 어려움.
- `PlaceGalleryView`에 `location` 전달(`PlaceMediaPanel`), **모바일 전용(`md:hidden`)** 블록 추가.
  - 그리드 뷰: `desc`/`description`, `originalQuery`가 있을 때 「입력에서 이 여행지로」 뱃지, 키워드 칩.
  - 사진 확대 뷰: `alt_description`/`description`을 상단 **사진 노트**로 스크롤 가능하게 표시.

## 로컬 모바일 테스트 (맥락 정리 · 2026-05-09 후반)

배경: `vite.config.js`의 `server.host: '0.0.0.0'`으로 LAN URL(NordVPN 100.x, WSL 172.22.x, Wi-Fi 192.168.219.x 등)이 함께 표시됨.

- **서브넷 불일치**: 개발 PC가 `192.168.219.x`(예: `.106`)인데 휴대폰이 `192.168.105.x` 등 **세 번째 옥텟이 다른 대역**이면 같은 집 Wi-Fi처럼 보여도 라우팅 없이 dev 서버에 붙지 않음. Vite에 표시된 **PC와 동일한 `192.168.219.*` 망**으로 폰을 맞추는 것이 우선. (이전에 “105 이상에서 안 된다”로 오해하기 쉬운 케이스로 기록.)
- **방화벽**: Windows 인바운드 TCP `5173` 허용 규칙이 없으면 LAN에서 타임아웃 가능. 관리자 PowerShell 예: `netsh advfirewall firewall add rule name="Vite Dev 5173 TCP" dir=in action=allow protocol=TCP localport=5173 profile=private,domain`
- **HTTPS**: `@vitejs/plugin-basic-ssl` 자체 서명 → 폰 브라우저에서 경고 통과 필요.
- **Vite 보강**: LAN에서 `https://<PC-IP>:5173` 접속 시 HMR WebSocket이 맞물리도록 `server.strictPort`, `server.hmr.protocol: 'wss'`, `port`/`clientPort`를 `5173`에 맞춤.
- **검증 루트**: 로컬이 막힐 때 **푸시 후 배포 URL로 모바일 QA**를 반복하는 방식이 실제로 도움이 됨(사용자 피드백).

## Home 지구본: 탐색·장소카드 전환 시 “새로고침” 체감 완화

- `pauseRender` 시 래퍼에 `display: none`을 쓰면 Mapbox/WebGL 컨테이너가 접혔다 펴지며 깜빡임·재배치가 커짐. `HomeGlobeMapbox`·`HomeGlobe` 모두 **`invisible` + `pointer-events-none`**으로만 숨기도록 변경 (`touch-none`은 레거시 쪽에 유지).

---

## 로컬 모바일 테스트용 IP 고정 시도 (보류 · 참고만)

- DHCP로 마지막 옥텟만 바뀌는 것은 여전히 QR/북마크 불편 요인.
- 정적 IP를 PowerShell `netsh interface ip set address name="Wi-Fi" static ...`만 실행하면 DNS가 함께 깨질 수 있음 → `dhcp`로 원복한 전례 유지.
- 재시도 시: DNS를 IP와 **함께** 설정하거나 Windows GUI 수동 IP, 또는 공유기 DHCP 예약. NordVPN 분리 테스트도 여전히 유효.
