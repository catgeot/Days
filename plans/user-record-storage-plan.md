# 사용자 기록 · 용량 관리

**역할**: 검색·방문 기록을 지키면서 브라우저 저장 용량을 다루는 다음 세션용 SSOT.  
**코드**: 로그인 세션 유지 PR [#697](https://github.com/catgeot/Days/pull/697)은 `main`에 있다. 용량이 부족할 때 캐시만 지우는 수정은 PR [#699](https://github.com/catgeot/Days/pull/699) · 브랜치 `cursor/auth-keep-history-3163` · `e0b39b16`. **#699 병합 전 `www.gateo.kr`은 세션 저장 실패 시 검색·방문 기록까지 지운다.**

## 이미 정해진 것

- 검색어, 방문지, 여행사 방문, 축제·팔경 즐겨찾기와 본 목록은 사용자 기록이다. 로그인 세션을 남기려고 지우지 않는다.
- 이 기록은 계정 서버에 없다. 브라우저 `localStorage`에만 있고, 사이트 주소마다 따로다. 이미 지워진 항목은 복구되지 않는다.
- `localStorage`는 한 주소당 보통 5MB다. 가득 차도 브라우저가 오래된 키를 스스로 지우지 않고 `QuotaExceededError`를 낸다.
- #699의 `src/shared/api/authSession.js`는 **세션 키를 쓸 때만**, 아래 캐시 접두사를 지운 뒤 한 번 더 저장한다. 그래도 실패하면 사용자 기록은 두고 세션 저장만 실패한다.

캐시로 지우는 접두사: `gateo:tourapi-proxy:` · `gateo:mrt-tnas:` · `gateo:mrt-stays:` · `gateo:mrt-stay-coords:` · `gateo:nearby-attractions:` · `gateo:korea-festivals:v2:` · `gateo:festival-open-detail:` · `gateo-world-event-list-photo` · `gateo.yt.unplayable` · `days_place_chat_intro:` · `days_gallery_swr_` · `Days_Score_`.

## 사용자 기록으로 둔 키

| 키 | 내용 |
|----|------|
| `gateo_recent_search_keywords` | 홈 검색어 |
| `gateo_recent_visited_destinations` | 홈 방문지 |
| `gateo_recent_keyword_visits` | 검색어별 방문지 |
| `gateo:korea-scenic:v1:recent-searches` | 팔경 검색어 |
| `gateo:travel-agencies:v1:visits` | 여행사 방문 |
| `gateo:korea-festivals:v1:favorites` · `viewed` | 축제 즐겨찾기·본 목록 |
| `gateo:korea-scenic:v1:favorites` · `viewed` | 팔경 즐겨찾기·본 목록 |
| `savedEmail` · `gateo.locale` | 이메일 · 언어 |
| `days_guest_trips` | 게스트 여행 |
| `days_gallery_hidden_` | 사용자가 숨긴 갤러리 사진 |

접두사 목록에 없는 키는 #699에서 지우지 않는다. 장소 소개 캐시(`days_place_chat_intro:`)는 다시 받을 수 있어 캐시로 두었다.

## 아직 한 곳이 아닌 용량 처리

세션 저장 밖에서는 기능마다 다르다. 다음 세션이 공통 정책으로 묶기 전에 이 차이를 유지한다.

- 대부분 캐시와 한국 여행 검색어는 용량 오류를 삼키고 새 저장만 포기한다.
- 홈 검색어·방문지·여행사 방문 저장은 용량 오류를 삼키지 않는다. 기존 목록은 남고 그 호출은 실패한다.
- 갤러리 세션 캐시는 `days_gallery_`만 지운 뒤 다시 쓴다 (`usePlaceGallery.js`).
- 숙소 목록은 옛 `gateo:mrt-stays:v22:`만 지운 뒤 다시 쓴다 (`mrtStayCache.js`).

## 다음 세션에서 다룰 판단

구현 전에 사람과 순서를 정한다. 한 세션에 아래를 한꺼번에 넣지 않는다.

1. **기록의 집.** 이 기기에만 둘지, 로그인한 계정에 올릴지. 계정 동기화는 승인이 나오기 전에 만들지 않는다.
2. **키 분류.** 위 표 밖의 `localStorage` 키를 사용자 기록 · 설정 · 다시 받을 수 있는 캐시로 나눈다. 분류 전 접두사 목록을 넓히지 않는다.
3. **공통 용량 처리.** 세션 저장만이 아니라 검색·캐시 저장이 같은 규칙을 쓰게 할지. 규칙은 캐시만 오래된 것부터 지우고, 사용자 기록은 남긴다.
4. **큰 캐시의 자리.** 숙소·투어·관광 API처럼 큰 응답을 `localStorage` 밖에 둘지. 옮기기 전에 어떤 키가 용량을 쓰는지 측정한다.

## 9. 핸드오프

| | |
|--|--|
| **상태** | **#1 용량 정리**는 PR #699. 다음은 **#2 용량 관리** |
| **브랜치** | `cursor/auth-keep-history-3163` · PR [#699](https://github.com/catgeot/Days/pull/699) |
| **금지** | 검색·방문 기록을 용량 때문에 삭제 · 계정 동기화 선구현 · 세션마다 새 브랜치 |
| **남은 일** | #699 병합 여부 확인 후, 위 판단 1부터 사람과 정하고 한 단계만 구현 |

#699가 열려 있으면 그 브랜치에 이어서 커밋한다. 병합되어 브랜치가 없으면 `origin/main`에서 `cursor/user-record-storage-3163`을 한 번만 만든다.

**다음 제시어**

```
사용자 기록 #2, 용량 관리
@plans/feature-handoff-index.md
@plans/2026-11-07-project-log.md
@plans/user-record-storage-plan.md
브랜치 cursor/auth-keep-history-3163 · PR #699
금지: 검색·방문 기록 삭제 · 계정 동기화 선구현 · 새 브랜치
작업: 플랜의 판단 1부터 사람과 정하고 합의된 한 단계만 구현
검증: node --test scripts/health/auth-session-persist.test.mjs
```
