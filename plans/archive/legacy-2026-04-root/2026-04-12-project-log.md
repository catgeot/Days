# 2026-04-12 Project Log

[⬅️ 이전 로그 보기 (2026-04-11)](./2026-04-11-project-log.md)

## 📌 이전 세션에서 이관된 고려사항 (Carry-over)
- 클룩(Klook)과 겟트랜스퍼(GetTransfer) 파트너사도 Intui.travel처럼 검색 위젯으로 나열하여 제공하는 방안 연구.
- (UX 고도화) 단일 공항 목적지의 경우, 위젯/딥링크 로딩 시 목적지 공항명이 기본으로 자동 입력(세팅)되도록 처리하는 로직 연구.

---

## 🎯 작업 내용 (Bug Fix)
- **URL 탭 라우팅 버그 수정**
  - **문제 증상:** `/place/wadi-rum`과 같은 여행지 주소까지는 복사/붙여넣기 시 정상 접근되나, `/place/wadi-rum/wiki`처럼 특정 탭이 포함된 주소로 직접 접근 시 홈 화면으로 튕기는 문제 발생. (`[Safe Path] 유효하지 않은 장소 SLUG 접근` 에러 로그 출력)
  - **원인:** `src/pages/Home/index.jsx` 내의 React Router `matchPath` 로직이 `/place/:slug` 형태의 경로만 매칭하도록 설정되어 있어, 뒤에 `/tab` 경로가 추가된 경우 `selectedLocation`을 가져오지 못하고 빈 컨텍스트를 하위 `PlaceCard` 컴포넌트로 전달함. `PlaceCard` 내부 방어 로직에 의해 1.5초 후 홈으로 강제 이동됨.
  - **해결 방안:** `matchPath`에서 `/place/:slug`뿐만 아니라 `/place/:slug/:tab` 경로에 대해서도 검사하도록 로직을 수정. 이를 통해 탭 주소로 직접 접근 시에도 정상적으로 장소 정보를 불러오고 해당 탭으로 랜딩되도록 조치.
  - **변경 파일:** `src/pages/Home/index.jsx`
